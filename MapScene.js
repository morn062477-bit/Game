// 맵 키 -> 배경 이미지/타일맵 JSON 경로. 맵을 추가하면 여기 한 줄만 늘리면 된다.
const MAP_FILES = {
  'map_01_village': { bg: 'asset/backgrounds/map_01_village_bg.png', json: 'asset/maps/map_01_village.json' },
  'map_02_forest':  { bg: 'asset/backgrounds/map_02_forest_bg.png',  json: 'asset/maps/map_02_forest.json' },
  'map_03_farm':    { bg: 'asset/backgrounds/map_03_farm_bg.png',    json: 'asset/maps/map_03_farm.json' },
  'map_04_port':    { bg: 'asset/backgrounds/map_04_port_bg.png',    json: 'asset/maps/map_04_port.json' },
  'map_05_lake':    { bg: 'asset/backgrounds/map_05_lake_bg.png',    json: 'asset/maps/map_05_lake.json' },
};

class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  // 씬 시작 시 이동할 맵 지정 (기본값: 마을/허브 맵)
  init(data) {
    this.currentMapKey = data.mapKey || 'map_01_village';
  }

  preload() {
    // 지도는 타일셋이 아니라 배경 그림 한 장 + 포탈 오브젝트만 가진 JSON이다.
    for (const [key, files] of Object.entries(MAP_FILES)) {
      this.load.image(`${key}-bg`, files.bg);
      this.load.tilemapTiledJSON(key, files.json);
    }

    // 캐릭터 걷기 스프라이트: 1148x1370 그림을 5열x4행으로 자른다(칸당 약 229x342).
    // 위에서부터 아래를 보고 걷기 / 왼쪽 / 오른쪽 / 뒤(위)를 보고 걷기 순서.
    this.load.spritesheet('player', 'asset/characters/main.png', {
      frameWidth: 229,
      frameHeight: 342,
    });
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

  create() {
    // 1. 배경 그림을 그대로 깐다(타일 레이어 없음)
    this.add.image(0, 0, `${this.currentMapKey}-bg`).setOrigin(0, 0);

    // 2. 포탈/오브젝트 데이터만 이 맵의 JSON에서 읽는다
    const map = this.make.tilemap({ key: this.currentMapKey });

    // 3. 플레이어 스폰 (start_point 오브젝트가 없으면 맵 중앙에 배치)
    this.ensurePlayerAnims();
    const startPoint = map.findObject('Portals', obj => obj.name === 'start_point')
      || { x: map.widthInPixels / 2, y: map.heightInPixels / 2 };
    // 원본 스프라이트가 사람 키 기준으로 너무 커서(342px) 0.28배로 줄인다.
    // 배경 그림 속 문/의자 크기랑 비교해서 안 맞으면 이 숫자만 조절하면 된다.
    this.player = this.physics.add.sprite(startPoint.x, startPoint.y, 'player', 0).setScale(0.48);
    // 충돌 판정은 발밑 좁은 영역만 쓴다(전신 박스를 쓰면 앞의 벽/오브젝트에 너무 일찍 걸린다).
    this.player.body.setSize(this.player.width * 0.5, this.player.height * 0.25);
    this.player.body.setOffset(this.player.width * 0.25, this.player.height * 0.3);
    this.player.body.setCollideWorldBounds(true);
    this.lastDir = 'down';

    // 4. 카메라 추적. 배경 그림이 매우 커서(3072px+) 축소해서 주변이 더 보이게 한다.
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(0.35);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // 5. NPC 배치 (현재 맵에 해당하는 NPC만 표시)
    this.setupNPCs(map);

    // 6. 이동 포탈 설정
    this.setupPortals(map);

    // 7. 입력 및 UI
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.interactText = this.add.text(640, 670, '', {
      fontSize: '14px', fill: '#ffff00', backgroundColor: '#000000aa', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

    this.isTalking = false;
    this.nearNPC = null;
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
        this.scene.restart({ mapKey: targetMap });
      });
    });
  }

  update() {
    if (this.isTalking) {
      this.player.body.setVelocity(0);
      return;
    }

    const speed = 180;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown)  vx = -speed;
    if (this.cursors.right.isDown) vx = speed;
    if (this.cursors.up.isDown)    vy = -speed;
    if (this.cursors.down.isDown)  vy = speed;

    this.player.body.setVelocity(vx, vy);

    // 걷는 방향에 맞는 애니메이션 재생. 대각선이면 좌우 우선(가로 이동이 더 잘 보임).
    if (vx < 0) { this.lastDir = 'left'; this.player.anims.play('walk-left', true); }
    else if (vx > 0) { this.lastDir = 'right'; this.player.anims.play('walk-right', true); }
    else if (vy < 0) { this.lastDir = 'up'; this.player.anims.play('walk-up', true); }
    else if (vy > 0) { this.lastDir = 'down'; this.player.anims.play('walk-down', true); }
    else {
      // 멈추면 애니메이션도 멈추고, 마지막으로 보던 방향의 첫 프레임(서 있는 자세)으로 고정
      this.player.anims.stop();
      const idleRow = { down: 0, left: 1, right: 2, up: 3 }[this.lastDir];
      this.player.setFrame(idleRow * 5);
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
