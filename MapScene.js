// 맵 키 -> 배경 이미지/타일맵 JSON 경로. 맵을 추가하면 여기 한 줄만 늘리면 된다.
const MAP_FILES = {
  'map_01_village': { bg: 'asset/backgrounds/map_01_village_bg.png', json: 'asset/maps/map_01_village.json' },
  'map_02_forest':  { bg: 'asset/backgrounds/map_02_forest_bg.png',  json: 'asset/maps/map_02_forest.json' },
  'map_03_farm':    { bg: 'asset/backgrounds/map_03_farm_bg.png',    json: 'asset/maps/map_03_farm.json' },
  'map_04_port':    { bg: 'asset/backgrounds/map_04_port_bg.png',    json: 'asset/maps/map_04_port.json' },
  'map_05_lake':    { bg: 'asset/backgrounds/map_05_lake_bg.png',    json: 'asset/maps/map_05_lake.json' },
  'map_06_water':   { bg: 'asset/backgrounds/map_06_water_bg.png',   json: 'asset/maps/map_06_water.json' },
};

class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  // 씬 시작 시 이동할 맵 지정 (기본값: 마을/허브 맵)
  // fromMapKey: 포탈을 타고 넘어온 경우 방금 있던 맵 키. 돌아올 때 이 맵으로 이어지는
  // 포탈 근처에서 스폰시키는 데 쓴다(예: 숲에서 마을로 오면 마을의 "숲으로" 포탈 옆에서 시작).
  init(data) {
    this.currentMapKey = data.mapKey || 'map_01_village';
    this.fromMapKey = data.fromMapKey || null;
  }

  preload() {
    // 지도는 타일셋이 아니라 배경 그림 한 장 + 포탈 오브젝트만 가진 JSON이다.
    // 이미지/JSON을 수정해도 브라우저가 예전 캐시를 그대로 쓰는 걸 막기 위해
    // 로드할 때마다 매번 바뀌는 버전 값(?v=현재시간)을 붙인다.
    const v = Date.now();
    for (const [key, files] of Object.entries(MAP_FILES)) {
      this.load.image(`${key}-bg`, `${files.bg}?v=${v}`);
      this.load.tilemapTiledJSON(key, `${files.json}?v=${v}`);
    }

    // 캐릭터 걷기 스프라이트: 1148x1370 그림을 5열x4행으로 자른다(칸당 약 229x342).
    // 위에서부터 아래를 보고 걷기 / 왼쪽 / 오른쪽 / 뒤(위)를 보고 걷기 순서.
    this.load.spritesheet('player', 'asset/characters/main.png', {
      frameWidth: 229,
      frameHeight: 342,
    });

    // 정적 장식: 항구 배경 그림에서 배만 오려낸 그림(배경을 투명하게 뺀 것). 배 두 척.
    this.load.image('boat-small', `asset/decorations/boat_small.png?v=${v}`);
    this.load.image('boat-large', `asset/decorations/boat_large.png?v=${v}`);

    // 숲 맵 전용: 화면 가장자리를 둘러싼 나무 프레임(가운데만 뚫려있는 그림)
    this.load.image('forest-frame', `asset/decorations/forest_frame.png?v=${v}`);

    // 마을 맵 전용 건물 장식: 캐릭터가 건물 앞/뒤로 자연스럽게 지나다닐 수 있도록
    // 배와 같은 방식(y좌표 기반 depth 재계산)으로 다룬다.
    this.load.image('village-inn', `asset/decorations/village_inn.png?v=${v}`);
    this.load.image('village-blue-house', `asset/decorations/village_blue_house.png?v=${v}`);
    this.load.image('village-statue', `asset/decorations/village_statue.png?v=${v}`);

    // 호수 맵 전용: 작은 나룻배(캐릭터와 앞뒤로 겹칠 수 있어 depth 정렬 필요)와
    // 기본 배경 위에 쌓는 물 레이어 2장(물 그림 -> 물 자리만 뚫린 그림 순으로 겹쳐서
    // 자연스러운 물 표현을 만든다)
    this.load.image('lake-boat', `asset/decorations/lake_boat.png?v=${v}`);
    this.load.image('lake-pond', `asset/decorations/lake_water.png?v=${v}`);
    this.load.image('lake-except-water', `asset/decorations/lake_expcept_water.png?v=${v}`);
  }

  // 방향별 애니메이션은 씬이 재시작될 때마다 다시 만들면 "키가 이미 있다" 에러가 나서,
  // 한 번만 등록한다.
  ensurePlayerAnims() {
    if (this.anims.exists('walk-down')) return;
    const dirs = [
      { key: 'walk-down', row: 0 },
      { key: 'walk-left', row: 1 },
      { key: 'walk-right', row: 2 },
      { key: 'walk-up', row: 3 },
    ];
    dirs.forEach(({ key, row }) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers('player', { start: row * 5, end: row * 5 + 4 }),
        frameRate: 10,
        repeat: -1,
      });
    });
  }

  // walkable 폴리곤 안 + walkdisable 사각형 밖인지 확인. walkable 레이어가 없는 맵은
  // 항상 true(제한 없음).
  isWalkable(x, y) {
    if (this.walkablePolygons.length === 0) return true;
    const inWalkable = this.walkablePolygons.some(poly => Phaser.Geom.Polygon.Contains(poly, x, y));
    if (!inWalkable) return false;
    return !this.walkdisableRects.some(rect => Phaser.Geom.Rectangle.Contains(rect, x, y));
  }

  create() {
    // 2. 포탈/오브젝트 데이터만 이 맵의 JSON에서 읽는다
    const map = this.make.tilemap({ key: this.currentMapKey });

    // 1. 배경 그림을 깐다(타일 레이어 없음). 원본 사진 해상도가 맵마다 제각각이라
    // (고화질로 다시 뽑으면서 2배가 되기도 하고, 새로 교체하면서 전혀 다른 크기가 되기도 함),
    // 실제 이미지 크기와 맵의 타일 기준 크기(map.widthInPixels)를 비교해서 항상 맵 크기에 꽉 차게 늘리거나 줄인다.
    const addFullMapImage = (tex, depth) => {
      const img = this.textures.get(tex).getSourceImage();
      this.add.image(0, 0, tex)
        .setOrigin(0, 0)
        .setScale(map.widthInPixels / img.width, map.heightInPixels / img.height)
        .setDepth(depth);
    };
    // 배경은 항상 맨 뒤에 깔리도록 깊이를 가장 낮게 고정한다.
    addFullMapImage(`${this.currentMapKey}-bg`, -1002);

    // 호수 맵(과 호수를 복제한 water 맵) 전용: 기본 배경 위에 물 그림을 깔고,
    // 그 위에 물 자리만 뚫린 그림을 한 번 더 덮어서 물 부분만 자연스럽게 강조되도록 3겹으로 쌓는다.
    if (this.currentMapKey === 'map_05_lake' || this.currentMapKey === 'map_06_water') {
      addFullMapImage('lake-pond', -1001);
      addFullMapImage('lake-except-water', -1000);
    }

    // 캐릭터와 앞/뒤 관계를 매 프레임 다시 계산해야 하는 장식들(배, 건물 등)은 여기 모은다.
    // x/y/width/height는 Tiled의 Portals 레이어에 배치해둔 오브젝트 값을 그대로 쓰고,
    // update()에서 y좌표 기준으로 depth를 갱신해 캐릭터가 앞/뒤로 자연스럽게 오갈 수 있게 한다.
    this.depthSprites = [];
    [
      { name: 'deco_boat_small', tex: 'boat-small', sway: true },
      { name: 'deco_boat_large', tex: 'boat-large', sway: true },
      { name: 'deco_village_inn', tex: 'village-inn' },
      { name: 'deco_village_blue_house', tex: 'village-blue-house' },
      { name: 'deco_village_statue', tex: 'village-statue' },
      { name: 'deco_lake_boat', tex: 'lake-boat', sway: true },
    ].forEach(({ name, tex, sway }) => {
      const obj = map.findObject('Portals', o => o.name === name);
      if (obj) {
        const img = this.add.image(obj.x, obj.y, tex).setOrigin(0, 0).setDisplaySize(obj.width, obj.height);
        if (sway) {
          // 물 위에 살짝 떠 있는 느낌을 주는 흔들림 애니메이션 (배 전용)
          this.tweens.add({
            targets: img,
            y: obj.y + 8,
            duration: 1600 + Math.random() * 400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        }
        this.depthSprites.push(img);
      }
    });

    // 1-2. 숲 맵 전용 나무 프레임. 화면 가장자리를 둘러싸는 그림이라 배경처럼 맵 전체 크기에
    // 맞춰 늘리고, 배경 바로 위 / 캐릭터보다는 아래 깊이에 둔다. 바람에 흔들리는 느낌으로
    // 좌우로 아주 살짝 왕복시킨다.
    if (this.currentMapKey === 'map_02_forest') {
      const frameImage = this.textures.get('forest-frame').getSourceImage();
      const frameScaleX = map.widthInPixels / frameImage.width;
      const frameScaleY = map.heightInPixels / frameImage.height;
      const forestFrame = this.add.image(0, 0, 'forest-frame')
        .setOrigin(0, 0)
        .setScale(frameScaleX, frameScaleY)
        .setDepth(-999);
      this.tweens.add({
        targets: forestFrame,
        x: 8,
        duration: 2400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // 3. 플레이어 스폰. 우선순위:
    //   1) "start_point_<방금 있던 맵 키>"라는 이름의 오브젝트가 있으면 그 자리 그대로 사용
    //      (맵마다 어디서 왔는지에 따라 스폰 위치를 다르게 정해두고 싶을 때 이걸 만들어두면 됨.
    //      예: 호수 맵에 "start_point_map_06_water" 오브젝트를 만들면 water에서 돌아올 때만 거기서 시작)
    //   2) 없으면, 방금 있던 맵으로 이어지는 포탈(예: 숲에서 넘어왔으면 "숲으로" 포탈) 근처에서
    //      시작한다. 포탈 위치에 그대로 놓으면 겹침이 바로 다시 감지돼 되돌아가버리므로,
    //      맵 중앙 쪽으로 살짝 밀어낸 위치를 쓴다.
    //   3) 그마저 없으면(맵 첫 진입 등) 기본 "start_point", 그것도 없으면 맵 중앙.
    this.ensurePlayerAnims();
    let startPoint = null;
    if (this.fromMapKey) {
      startPoint = map.findObject('Portals', obj => obj.name === `start_point_${this.fromMapKey}`);
    }
    if (!startPoint && this.fromMapKey) {
      const returnPortal = map.findObject('Portals', obj => {
        const tp = obj.properties?.find(p => p.name === 'target_map');
        return tp && tp.value.replace(/\.tmx$/, '') === this.fromMapKey;
      });
      if (returnPortal) {
        const px = returnPortal.x + (returnPortal.width || 0) / 2;
        const py = returnPortal.y + (returnPortal.height || 0) / 2;
        const dx = px - map.widthInPixels / 2;
        const dy = py - map.heightInPixels / 2;
        const len = Math.hypot(dx, dy) || 1;
        const nudge = 120;
        startPoint = { x: px - (dx / len) * nudge, y: py - (dy / len) * nudge };
      }
    }
    if (!startPoint) {
      startPoint = map.findObject('Portals', obj => obj.name === 'start_point')
        || { x: map.widthInPixels / 2, y: map.heightInPixels / 2 };
    }
    // water 맵에서는 걸어다니는 캐릭터 대신 보트를 조작한다(스프라이트시트가 아니라 정지 그림 한 장).
    this.isBoat = this.currentMapKey === 'map_06_water';
    if (this.isBoat) {
      const boatImage = this.textures.get('lake-boat').getSourceImage();
      this.player = this.physics.add.sprite(startPoint.x, startPoint.y, 'lake-boat')
        .setScale(180 / boatImage.width);
      // 충돌 판정은 보트 형태(넓고 낮음)에 맞춰 살짝 안쪽으로 줄인다.
      this.player.body.setSize(this.player.width * 0.8, this.player.height * 0.7);
      this.player.body.setOffset(this.player.width * 0.1, this.player.height * 0.15);
    } else {
      // 원본 스프라이트가 사람 키 기준으로 너무 커서(342px) 0.28배로 줄인다.
      // 배경 그림 속 문/의자 크기랑 비교해서 안 맞으면 이 숫자만 조절하면 된다.
      this.player = this.physics.add.sprite(startPoint.x, startPoint.y, 'player', 0).setScale(0.48);
      // 충돌 판정은 발밑 좁은 영역만 쓴다(전신 박스를 쓰면 앞의 벽/오브젝트에 너무 일찍 걸린다).
      this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.25);
      this.player.body.setOffset(this.player.width * 0.25, this.player.height * 0.3);
    }
    this.player.body.setCollideWorldBounds(true);
    this.lastDir = 'down';

    // 3-1. 걸어다닐 수 있는 영역 제한. Tiled에 "walkable"(다닐 수 있는 길, 폴리곤)과
    // "walkdisable"(그 안에서도 못 들어가는 구멍, 사각형) 오브젝트 레이어를 그려두면 적용되고,
    // 없는 맵(호수 등)에서는 지금까지처럼 자유롭게 돌아다닐 수 있다.
    this.walkablePolygons = (map.getObjectLayer('walkable')?.objects || [])
      .filter(obj => obj.polygon)
      .map(obj => new Phaser.Geom.Polygon(obj.polygon.map(p => ({ x: obj.x + p.x, y: obj.y + p.y }))));
    this.walkdisableRects = (map.getObjectLayer('walkdisable')?.objects || [])
      .map(obj => new Phaser.Geom.Rectangle(obj.x, obj.y, obj.width || 1, obj.height || 1));
    this.lastValidPos = { x: startPoint.x, y: startPoint.y };

    // 4. 카메라 추적. 배경 그림이 매우 커서(3072px+) 축소해서 주변이 더 보이게 한다.
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(0.35);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // 5. NPC 배치 (현재 맵에 해당하는 NPC만 표시)
    this.setupNPCs(map);

    // 6. 이동 포탈 설정
    this.setupPortals(map);

    // 6-1. 깜빡이는 빛(횃불 등). Tiled에서 이름이 "light_"로 시작하는 점 오브젝트를
    // Portals 레이어에 찍어두면 그 위치에 자동으로 생긴다.
    this.setupLights(map);

    // 7. 입력 및 UI
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    // Shift를 누르고 있으면 달리기
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.interactText = this.add.text(640, 670, '', {
      fontSize: '14px', fill: '#ffff00', backgroundColor: '#000000aa', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

    this.isTalking = false;
    this.nearNPC = null;
  }

  // --- 깜빡이는 빛(횃불 등) ---
  // Portals 레이어의 오브젝트 중 이름이 "light_"로 시작하거나 "fire"/"fire_plus"인 걸
  // 전부 찾아서 그 자리에 만든다. fire_plus는 기본 fire보다 범위(radius)는 넓지만,
  // 그만큼 눈에 띄지 않게 밝기(alpha)는 더 낮춰서 은은하게 퍼지는 느낌을 준다.
  setupLights(map) {
    const objects = map.getObjectLayer('Portals')?.objects || [];
    objects.forEach(obj => {
      if (!obj.name) return;
      if (obj.name === 'fire_plus') {
        this.addFlickerLight(obj.x, obj.y, 160, 0xffcc66, { from: 0.15, to: 0.3 });
      } else if (obj.name === 'fire' || obj.name.startsWith('light_')) {
        this.addFlickerLight(obj.x, obj.y);
      }
    });
  }

  // 밝기(alpha)와 크기를 살짝씩 랜덤한 속도로 왔다갔다 시켜서 횃불처럼 깜빡이는
  // 빛 하나를 만든다. 더하기(ADD) 블렌드라 배경 위에 겹쳐도 어두워지지 않고 밝아지기만 한다.
  addFlickerLight(x, y, radius = 90, color = 0xffcc66, alphaRange = { from: 0.25, to: 0.45 }) {
    // 동그란 그라데이션 텍스처는 씬에서 한 번만 만들어서 재사용한다.
    if (!this.textures.exists('light-glow')) {
      const size = 128;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      for (let i = size; i > 0; i -= 2) {
        const alpha = (1 - i / size) * 0.06;
        g.fillStyle(0xffffff, alpha);
        g.fillCircle(size, size, i);
      }
      g.generateTexture('light-glow', size * 2, size * 2);
      g.destroy();
    }

    const glow = this.add.image(x, y, 'light-glow')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(color)
      .setScale(radius / 128)
      .setDepth(900);

    // 은은하게: 밝기 변화 폭을 좁게(0.25~0.45), 속도도 느리게(1.8~2.6초) 해서
    // 눈에 띄게 반짝이기보다 천천히 숨쉬듯 흔들리게 한다.
    this.tweens.add({
      targets: glow,
      alpha: alphaRange,
      scale: { from: glow.scale * 0.95, to: glow.scale * 1.05 },
      duration: 1800 + Math.random() * 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // --- NPC 스폰 로직 ---
  setupNPCs(map) {
    this.npcGroup = this.physics.add.staticGroup();
    this.npcDataMap = new Map();

    const suspectList = [
      { id: 'wife', name: '이장 부인', objName: 'npc_wife', color: 0xff6666 },
      { id: 'hunter', name: '사냥꾼', objName: 'npc_hunter', color: 0x66ff66 },
      { id: 'farmer', name: '농부', objName: 'npc_farmer', color: 0xffff66 },
      { id: 'painter', name: '화가', objName: 'npc_painter', color: 0x66ffff },
      { id: 'fisherman', name: '어부', objName: 'npc_fisherman', color: 0xff66ff }
    ];

    suspectList.forEach(data => {
      const npcPoint = map.findObject('Portals', obj => obj.name === data.objName);
      if (npcPoint) {
        const npc = this.add.rectangle(npcPoint.x, npcPoint.y, 28, 28, data.color);
        this.physics.add.existing(npc, true);
        this.npcGroup.add(npc);

        this.add.text(npcPoint.x, npcPoint.y - 25, data.name, {
          fontSize: '12px', fill: '#ffffff'
        }).setOrigin(0.5);

        this.npcDataMap.set(npc, data);
      }
    });

    this.physics.add.collider(this.player, this.npcGroup);
  }

  // --- 포탈 영역 및 맵 이동 처리 ---
  // 맵의 Portals 오브젝트 레이어에 있는 각 오브젝트의 target_map 속성값
  // (예: "map_02_forest.tmx")을 그대로 다음 씬의 mapKey로 쓴다.
  setupPortals(map) {
    const objects = map.getObjectLayer('Portals')?.objects || [];

    objects.forEach(obj => {
      const targetProp = obj.properties?.find(p => p.name === 'target_map');
      if (!targetProp) return;
      const targetMap = targetProp.value.replace(/\.tmx$/, '');

      const zone = this.add.zone(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width, obj.height);
      this.physics.add.existing(zone, true);

      this.physics.add.overlap(this.player, zone, () => {
        this.scene.restart({ mapKey: targetMap, fromMapKey: this.currentMapKey });
      });
    });
  }

  update() {
    // 직전 프레임 이동 결과가 걸을 수 있는 영역을 벗어났으면 되돌린다(walkable 레이어가
    // 없는 맵에서는 isWalkable이 항상 true라 아무 효과 없음).
    const feet = this.player.body.center;
    if (!this.isWalkable(feet.x, feet.y)) {
      this.player.setPosition(this.lastValidPos.x, this.lastValidPos.y);
      this.player.body.setVelocity(0);
    } else {
      this.lastValidPos.x = this.player.x;
      this.lastValidPos.y = this.player.y;
    }

    if (this.isTalking) {
      this.player.body.setVelocity(0);
      return;
    }

    const walkSpeed = 300;
    const runSpeed = 500;
    const isRunning = this.shiftKey.isDown;
    const speed = isRunning ? runSpeed : walkSpeed;
    const animFrameRate = isRunning ? 16 : 10;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown)  vx = -speed;
    if (this.cursors.right.isDown) vx = speed;
    if (this.cursors.up.isDown)    vy = -speed;
    if (this.cursors.down.isDown)  vy = speed;

    this.player.body.setVelocity(vx, vy);

    if (this.isBoat) {
      // 보트는 스프라이트시트가 아니라 정지 그림 한 장이라 걷기 애니메이션 대신
      // 좌우로 움직일 때만 그림을 뒤집어서 방향을 표현한다.
      if (vx < 0) this.player.setFlipX(true);
      else if (vx > 0) this.player.setFlipX(false);
    } else {
      // 걷는 방향에 맞는 애니메이션 재생(달릴 땐 더 빠르게). 대각선이면 좌우 우선(가로 이동이 더 잘 보임).
      if (vx < 0) { this.lastDir = 'left'; this.player.anims.play({ key: 'walk-left', frameRate: animFrameRate }, true); }
      else if (vx > 0) { this.lastDir = 'right'; this.player.anims.play({ key: 'walk-right', frameRate: animFrameRate }, true); }
      else if (vy < 0) { this.lastDir = 'up'; this.player.anims.play({ key: 'walk-up', frameRate: animFrameRate }, true); }
      else if (vy > 0) { this.lastDir = 'down'; this.player.anims.play({ key: 'walk-down', frameRate: animFrameRate }, true); }
      else {
        // 멈추면 애니메이션도 멈추고, 마지막으로 보던 방향의 첫 프레임(서 있는 자세)으로 고정
        this.player.anims.stop();
        const idleRow = { down: 0, left: 1, right: 2, up: 3 }[this.lastDir];
        this.player.setFrame(idleRow * 5);
      }
    }

    // 캐릭터/장식(배, 건물 등) 앞뒤 관계: 화면 아래쪽(y가 큰 쪽)에 있는 쪽이 항상 앞에 보이도록
    // 매 프레임 depth를 다시 계산한다. 배는 흔들림 애니메이션으로 y가 계속 바뀌기 때문에
    // 한 번만 정해두면 안 되고 여기서 갱신해야 한다.
    this.player.setDepth(this.player.y + this.player.displayHeight / 2);
    if (this.depthSprites) {
      this.depthSprites.forEach(spr => spr.setDepth(spr.y + spr.displayHeight));
    }

    // 상호작용 가능한 거리 내 NPC 확인
    this.nearNPC = null;
    let minDistance = 50;

    this.npcGroup.getChildren().forEach(npc => {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < minDistance) {
        minDistance = dist;
        this.nearNPC = npc;
      }
    });

    if (this.nearNPC) {
      const npcData = this.npcDataMap.get(this.nearNPC);
      this.interactText.setText(`[SPACE] ${npcData.name}와 대화하기`).setVisible(true);

      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.startDialogue(npcData);
      }
    } else {
      this.interactText.setText('').setVisible(false);
    }
  }

  startDialogue(npcData) {
    this.isTalking = true;
    this.interactText.setText('');
    console.log(`[대화/대전 진입] 대상: ${npcData.name} (${npcData.id})`);
  }
}
