// 맵 키 -> 배경 이미지/타일맵 JSON 경로. 맵을 추가하면 여기 한 줄만 늘리면 된다.
const MAP_FILES = {
  'map_01_village': { bg: 'asset/backgrounds/map_01_village_bg.png', json: 'asset/maps/map_01_village.json' },
  'map_02_forest':  { bg: 'asset/backgrounds/map_02_forest_bg.png',  json: 'asset/maps/map_02_forest.json' },
  'map_03_farm':    { bg: 'asset/backgrounds/map_03_farm_bg.png',    json: 'asset/maps/map_03_farm.json' },
  'map_04_port':    { bg: 'asset/backgrounds/map_04_port_bg.png',    json: 'asset/maps/map_04_port.json' },
  'map_05_lake':    { bg: 'asset/backgrounds/map_05_lake_bg.png',    json: 'asset/maps/map_05_lake.json' },
  'map_06_water':   { bg: 'asset/backgrounds/map_06_water_bg.png',   json: 'asset/maps/map_06_water.json' },
  'map_07_inter':   { bg: 'asset/backgrounds/map_07_inter_bg.png',   json: 'asset/maps/map_07_inter.json' },
  'map_08_body':    { bg: 'asset/backgrounds/map_08_body_bg.png',    json: 'asset/maps/map_08_body.json' },
};

// 오프닝 컷씬은 게임을 처음 시작했을 때 딱 한 번만 재생돼야 한다(맵 이동으로 씬이
// 계속 restart되므로 씬 인스턴스 안에 두면 매번 다시 재생됨). 모듈 스코프에 둬서
// 페이지를 새로고침하기 전까지 유지되게 한다.
let hasPlayedIntro = false;

// npc id -> 대화 대사(순서대로 한 줄씩 보여준다). 여기 없는 id는 대화창 자체에서
// 기본 문구 하나만 뜬다. NPC를 하나씩 채워나갈 때 이 표에 항목만 추가하면 된다.
const DIALOGUE_SCRIPTS = {
  saint: [
    '...아직도 그 광경이 눈에 선해요.',
    '동상 옆에서... 이장님의... 그 모습을 보고는 정신이 아득해졌어요.',
    '저는 그냥 아침 기도를 드리러 가던 길이었을 뿐인데...',
    '부디, 부디 범인을 꼭 찾아주세요, 탐정님.',
  ],
  wife: ['결국 저에게도 오셨군요...'],
  fisher: ['이번엔 나요?'],
  hunter: ['뭐 때문에 왔는지는 굳이 묻지 않겠소..'],
  painter: ['사건이 일어난 후 저를 보는 눈이 조금 달라졌어요.'],
  farmer: ['이미 저와 사이의 일도 들으셨겠죠.'],
  // 맵 데이터의 실제 npc id가 "docter"(오타)라서 여기 키도 맞춰야 매칭된다 - 안 그러면
  // DIALOGUE_SCRIPTS[npcData.id]가 항상 undefined라 기본 문구만 뜬다.
  docter: ['부디, 부디 범인을 꼭 찾아주세요, 탐정님.'],
  boy: [
    { q: '사건 당일 저녁, 화가의 모습을 본 사람이 있습니까?', a: '저녁에 화가가 호숫가에 있던 건 봤어요.' },

  { q: '그 사람이 밤늦게까지 호숫가에 있었다고 확신합니까?', a: '밤중에 다시 지나갔을 땐 그 자리에 없던데요.' },

  { q: '화가는 마을 사람들과 평소 어떤 관계였습니까?', a: '농부가 유일하게 화가를 챙겨줬죠.' },

  { q: '최근 마을 사람들 사이에 문제가 있었다는 이야기는 없었습니까?', a: '며칠 전 사냥꾼이 이장과 크게 다퉜어요.' },

  { q: '저 동상은 꽤 오래된 것 같은데, 무슨 의미가 있습니까?', a: '저 동상은 마을을 처음 일군 사람을 기리는 거래요.' },

  { q: '사건이 일어나기 전, 수상한 행동을 한 사람은 없었습니까?', a: '며칠 전부터 사냥꾼이 밤마다 숲 쪽을 살피고 있었어요.' },

  { q: '농부와 화가가 특별히 가까웠던 이유를 알고 있습니까?', a: '예전에 농부가 어려울 때 화가가 도와준 적이 있다더군요.' },

  { q: '이장과 사냥꾼은 왜 다툰 겁니까?', a: '숲에 들어가는 문제 때문이었다고 들었어요.' },

  { q: '그 숲은 원래 마을 사람들이 자유롭게 들어갈 수 있는 곳 아닙니까?', a: '예전에는 그랬는데, 최근에는 이장이 들어가지 말라고 했어요.' },

  { q: '마을 사람들은 그 이유를 알고 있습니까?', a: '정확한 이유는 아무도 몰라요. 이장만 알고 있다는 말이 있었죠.' },{ q: '사건 당일 밤, 숲에서 사냥꾼을 봤습니까?', a: '네. 북쪽 숲길로 들어가는 건 봤습니다.\n다만 몇 시였는지는 기억나지 않아요.' },
    { q: '그 뒤에 다시 나온 것도 봤습니까?', a: '아니요. 제가 본 건 숲으로 들어가는 모습뿐입니다.' },
  ],
  girl: [
    {q:"사건 당일 밤, 화가를 봤습니까?",a:"저녁까지 그림을 그리고 있는 건 봤습니다. 다만 밤에 다시 지나갔을 때는 잠시 자리를 비운 상태였어요."},
    {q:"화가와 농부는 가까운 사이였습니까?",a:"네. 농부가 화가를 꽤 챙겼어요. 처음 마을에 왔을 때도 여러 가지로 도와줬다고 들었습니다."}
  ],
  farmer_baby: [
    { q: '잠깐 물어봐도 될까요?', a: '네, 뭐든 물어보세요.' },
    { q: '사건 당일 아버지가 언제까지 밭에 있었는지 기억합니까?', a: '저녁까지는 같이 있었어요.\n제가 먼저 집에 들어갔거든요.\n아빠는 일이 조금 남았다고 조금만 더 하고 가겠다고 했어요.' },
  ],
  captain: [
    { q: '사건 당일 어부가 항구에 있었습니까?', a: '사건 시간 내내 한 발짝도 안 움직였다고까지는 못 하겠지만.' },
    { q: '이장과는 사이가 좋았습니까?', a: '아니요. 사건 며칠 전에도 빚 문제로 서로 죽일 듯이 싸웠죠..' },
  ],
  // TODO: 임시 대사. 실제 내용 정해지면 교체.
  // 잡화점 주인 (map_07_inter)
  village_woman1: [
    '어서 오세요... 아, 탐정님이셨군요.',
    '요즘 다들 흉흉한 얘기뿐이라 장사도 손에 안 잡히네요.',
    '필요한 거 있으면 말씀하세요. 아는 건 다 말씀드릴게요.',
  ],
  // 마을 주민 (map_01_village)
  village_woman2: [
    '좋은 아침이에요, 탐정님.',
    '이장님 일 때문에 오신 거죠? 마을이 이렇게 조용해진 건 처음이에요.',
    '얼른 범인을 찾아주셨으면 좋겠어요...',
  ],
};

// =============================================
// 용의자 5명 조사 완료 후 마을 집합 대화
// =============================================

const FINAL_GATHER_SCRIPT = [
    {
        speaker: '사냥꾼',
        text: '이제 조사할 만큼 한 것 같은데.\n결론을 내릴 때가 되지 않았소?',
        portraitTexKey: 'npc-hunter'
    },

    {
        speaker: '어부',
        text: '나도 더는 이 일 때문에 일을 미룰 수 없소.\n범인이 누군지 알았다면 말해주시오.',
        portraitTexKey: 'npc-fisher'
    },

    {
        speaker: '이장 부인',
        text: '모두의 이야기를 들으셨으니\n이제 답을 가지고 계시겠죠.',
        portraitTexKey: 'npc-wife'
    },

    {
        speaker: '화가',
        text: '…….',
        portraitTexKey: 'npc-painter'
    },

    {
        speaker: '농부',
        text: '탐정님.\n이제 누구의 짓인지 알아낸 겁니까?',
        portraitTexKey: 'npc-farmer'
    },

    {
        speaker: '탐정',
        text: '네.\n이제 한 사람을 지목하겠습니다.',
        isDetective: true
    }
];

// npc id -> 화면에 보여줄 한글 이름. 맵 위 이름표(닉네임)와 대화창의 "[이름]" 표시에
// 둘 다 쓴다. 여기 없는 id는 그냥 원래 id(영문)가 그대로 뜬다.
const NPC_DISPLAY_NAME = {
  saint: '수녀',
  docter: '의사',
  boy: '소년',
  girl: '낚시꾼',
  farmer_baby: '농부의 딸',
  farmer: '농부',
  hunter: '사냥꾼',
  painter: '화가',
  fisher: '어부',
  captain: '선장',
  wife: '이장 부인',
  village_woman1: '잡화점 주인',
  village_woman2: '마을 주민',
  body: '시체'
};

// npc id -> 대화창 초상화용 일러스트 텍스처 키(preload에서 "dialogue-ill-*"로 로드해둔 것).
// 여기 없는 npc(예: farmer_baby, village_woman1/2)는 기존처럼 걷기 스프라이트를 대신 쓴다.
const DIALOGUE_ILLUST_BY_NPC = {
  saint: 'dialogue-ill-saint',
  docter: 'dialogue-ill-doctor',
  boy: 'dialogue-ill-boy',
  girl: 'dialogue-ill-girl',
  captain: 'dialogue-ill-captain',
};
const DETECTIVE_ILLUST_KEY = 'dialogue-ill-탐정';

// npc id -> 다빈치코드 미니게임 쪽 봇 이름(봇1~봇6). 이 표에 있는 npc만 "용의자"로
// 취급돼서 대화 시 VN 화면+미니게임으로 이어진다(그 외 npc는 기존 하단 대화창만).
// 지금은 VN/카드 그림이 준비된 다섯 명만 넣어뒀다.
const NPC_TO_BOT_NAME = {
  wife: '봇1', hunter: '봇3', farmer: '봇4', painter: '봇5', fisher: '봇6',
};

// 맵 키 -> 발소리 텍스처 키. water 맵은 보트라서 발소리가 없다(빠져있음).
const STEP_SOUND_BY_MAP = {
  map_01_village: 'step-village',
  map_02_forest: 'step-forest-farm',
  map_03_farm: 'step-forest-farm',
  map_04_port: 'step-village',
  map_07_inter: 'step-village',
  map_05_lake: 'step-forest-farm',
  map_08_body: 'step-forest-farm',
};

// 맵 키 -> bgm-main 위에 같이 겹쳐서 틀 전용 배경음악. 여기 없는 맵은 bgm-main만 나온다.
const EXTRA_BGM_BY_MAP = {
  map_06_water: { key: 'bgm-water', volume: 0.7 },
  map_04_port: { key: 'bgm-port', volume: 0.2 },
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
    // 용의자 VN 화면/다빈치코드에 갔다가 돌아온 경우, 대화를 건 바로 그 자리에서
    // 다시 시작하기 위한 좌표. SuspectVNScene/DaVinciCodeScene이 넘겨줄 때만 있다.
    this.resumeX = data.returnX ?? null;
    this.resumeY = data.returnY ?? null;
    // 최종 추리를 위해 마을로 강제 이동된 상태인지
    this.endingGather = data.endingGather === true;
    this.storyEvent = data.storyEvent || null;
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

    // body 맵 전용: 배경 위를 통째로 덮는 나무 그림. 숲 프레임과 같은 방식으로 좌우로 살짝 흔든다.
    this.load.image('body-tree', `asset/decorations/body_tree.png?v=${v}`);

    // 마을 맵 전용 건물 장식: 캐릭터가 건물 앞/뒤로 자연스럽게 지나다닐 수 있도록
    // 배와 같은 방식(y좌표 기반 depth 재계산)으로 다룬다.
    this.load.image('village-inn', `asset/decorations/village_inn.png?v=${v}`);
    this.load.image('village-blue-house', `asset/decorations/village_blue_house.png?v=${v}`);
    this.load.image('village-statue', `asset/decorations/village_statue.png?v=${v}`);

    // 호수 맵 전용: 작은 나룻배(캐릭터와 앞뒤로 겹칠 수 있어 depth 정렬 필요)와
    // 기본 배경 위에 쌓는 물 레이어 2장(물 그림 -> 물 자리만 뚫린 그림 순으로 겹쳐서
    // 자연스러운 물 표현을 만든다)
    // 배는 두 버전: 호수 맵에 떠 있는 장식용은 빈 배, water 맵에서 실제로 조작하는 건
    // 캐릭터가 타고 있는 버전.
    this.load.image('lake-boat-empty', `asset/decorations/lake_boat_empty.png?v=${v}`);
    this.load.image('boat_main', `asset/decorations/lake_boat.png?v=${v}`);
    this.load.image('lake-pond', `asset/decorations/lake_water.png?v=${v}`);
    this.load.image('lake-except-water', `asset/decorations/lake_expcept_water.png?v=${v}`);

    // NPC 그림(맵 위에 서있는 용의자들). 전부 main.png와 같은 5열x4행 걷기 스프라이트시트지만,
    // 그림마다 전체 캔버스 크기가 달라서(교체하면서 비율이 바뀐 것들이 있음) 한 프레임 크기도
    // 파일별로 다르게 줘야 한다(5로 나눈 너비 x 4로 나눈 높이). 표준 크기(204x384, 1024x1536
    // 캔버스)와 다른 파일만 별도로 표시해뒀다.
    const npcFrame = { frameWidth: 204, frameHeight: 384 }; // 표준: 1024x1536
    this.load.spritesheet('npc-saint', `asset/characters/용의자들-NPC/saint.png?v=${v}`, { frameWidth: 224, frameHeight: 350 }); // 1122x1402
    this.load.spritesheet('npc-doctor', `asset/characters/용의자들-NPC/doctor.png?v=${v}`, { frameWidth: 250, frameHeight: 313 }); // 1254x1254
    this.load.spritesheet('npc-boy', `asset/characters/용의자들-NPC/boy.png?v=${v}`, { frameWidth: 224, frameHeight: 350 }); // 1122x1402
    this.load.spritesheet('npc-farmer_baby', `asset/characters/용의자들-NPC/farmer_baby.png?v=${v}`, { frameWidth: 250, frameHeight: 313 }); // 1254x1254
    this.load.spritesheet('npc-girl', `asset/characters/용의자들-NPC/girl.png?v=${v}`, npcFrame); // 1024x1536
    // village_woman1(inter)/village_woman2(village) 둘 다 같은 그림을 id만 다르게 재사용한다.
    this.load.spritesheet('npc-villager_woman', `asset/characters/용의자들-NPC/villager_woman.png?v=${v}`, { frameWidth: 250, frameHeight: 313 }); // 1254x1254
    // farmer.png만 다른 그림들과 달리 4열x4행 그리드라(1024/4=256, 1536/4=384),
    // 5열 기준 표준 프레임으로 자르면 오른쪽에 있는 팔이 다음 칸으로 잘려 들어간다.
    this.load.spritesheet('npc-farmer', `asset/characters/용의자들-farmer/farmer.png?v=${v}`, { frameWidth: 256, frameHeight: 384 }); // 1024x1536, 4열
    this.load.spritesheet('npc-hunter', `asset/characters/용의자들-hunter/hunter.png?v=${v}`, npcFrame);
    this.load.spritesheet('npc-painter', `asset/characters/용의자들-painter/painter.png?v=${v}`, npcFrame);
    this.load.spritesheet('npc-fisher', `asset/characters/용의자들-fisher/fisher.png?v=${v}`, npcFrame);
    this.load.spritesheet('npc-captain', `asset/characters/용의자들-NPC/captain.png?v=${v}`, npcFrame);
    this.load.spritesheet('npc-wife', `asset/characters/용의자들-wife/wife.png?v=${v}`, npcFrame);
    // 시체 발견 장소(map_08_body)에 놓인 시체. 걸어다니는 캐릭터가 아니라 누워있는
    // 정지 그림 한 장(가로로 긴 1536x1024)이라 스프라이트시트가 아니라 일반 이미지로 불러온다.
    this.load.image('npc-body', `asset/characters/용의자들-NPC/body.png?v=${v}`);

    // 일반 NPC 대화창 초상화용 일러스트(걷기 스프라이트와 별도). "탐정" 질문 줄에도
    // 전용 일러스트가 있어서 그걸 쓰고, 일러스트가 없는 id는 기존처럼 걷기 스프라이트로
    // 대체된다(showDialogueLine 참고).
    this.load.image('dialogue-ill-탐정', `asset/characters/대화창 일러스트/dective_ill.png?v=${v}`);
    this.load.image('dialogue-ill-saint', `asset/characters/대화창 일러스트/saint_ill.png?v=${v}`);
    this.load.image('dialogue-ill-doctor', `asset/characters/대화창 일러스트/doctor_ill.png?v=${v}`);
    this.load.image('dialogue-ill-boy', `asset/characters/대화창 일러스트/boy_ill.png?v=${v}`);
    this.load.image('dialogue-ill-girl', `asset/characters/대화창 일러스트/girl_ill.png?v=${v}`);
    this.load.image('dialogue-ill-captain', `asset/characters/대화창 일러스트/captine_ill.png?v=${v}`);

    // 오프닝 컷씬 전용: 발견 장면에서 잠깐 블러 처리해서 띄우는 잘린 머리 그림.
    this.load.image('cutscene-head', `asset/decorations/head.png?v=${v}`);

    // 이동 발소리. 맵 분위기에 따라 다른 파일을 쓴다(STEP_SOUND_BY_MAP 참고).
    // village/port/inter는 전부 village 발소리로 통일. water 맵은 보트라서 발소리 자체가 없다.
    this.load.audio('step-village', `asset/sound/vilage_step.mp3?v=${v}`);
    this.load.audio('step-forest-farm', `asset/sound/forest_farm_step.mp3?v=${v}`);

    // 배경음악. 맵을 옮겨다닐 때마다(포탈 -> scene.restart) 씬이 새로 만들어지는데,
    // 그때마다 처음부터 다시 재생되면 끊기니 create()에서 이미 재생 중이면 건너뛴다.
    // water/port 맵은 전용 배경음악(bgm-water/bgm-port)을 bgm-main 위에 겹쳐서 같이 튼다.
    this.load.audio('bgm-main', `asset/sound/main.mp3?v=${v}`);
    this.load.audio('bgm-water', `asset/sound/water_map.mp3?v=${v}`);
    this.load.audio('bgm-port', `asset/sound/port.mp3?v=${v}`);
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

  // NPC 그림도 main.png와 같은 5열x4행 걷기 스프라이트시트라, 같은 방식으로 걷기
  // 애니메이션을 만들어둔다(컷씬에서 성녀가 자연스럽게 걷는 것처럼 보이도록).
  // 키 이름은 "<텍스처키>-walk-<방향>"으로 플레이어 것과 겹치지 않게 구분한다.
  // cols: 한 행에 프레임이 몇 개인지(대부분 5열이지만 farmer.png만 4열이라 다르게 준다).
  ensureNpcAnims(texKey, cols = 5) {
    if (this.anims.exists(`${texKey}-walk-down`)) return;
    const dirs = [
      { dir: 'down', row: 0 }, { dir: 'left', row: 1 }, { dir: 'right', row: 2 }, { dir: 'up', row: 3 },
    ];
    dirs.forEach(({ dir, row }) => {
      this.anims.create({
        key: `${texKey}-walk-${dir}`,
        frames: this.anims.generateFrameNumbers(texKey, { start: row * cols, end: row * cols + (cols - 1) }),
        frameRate: 10,
        repeat: -1,
      });
    });
  }

  // walkable 폴리곤 안 + walkdisable(사각형 또는 폴리곤) 밖인지 확인. walkable 레이어가
  // 없는 맵은 항상 true(제한 없음).
  isWalkable(x, y) {
    if (this.walkablePolygons.length === 0) return true;
    const inWalkable = this.walkablePolygons.some(poly => Phaser.Geom.Polygon.Contains(poly, x, y));
    if (!inWalkable) return false;
    return !this.walkdisableShapes.some(shape => shape instanceof Phaser.Geom.Polygon
      ? Phaser.Geom.Polygon.Contains(shape, x, y)
      : Phaser.Geom.Rectangle.Contains(shape, x, y));
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
      { name: 'deco_lake_boat', tex: 'lake-boat-empty', sway: true },
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

    // 1-3. body 맵 전용 나무 그림. 배경 전체를 덮어 씌우고 숲 프레임과 같은 방식으로
    // 좌우로 아주 살짝 왕복시킨다.
    if (this.currentMapKey === 'map_08_body') {
      const bodyTreeImage = this.textures.get('body-tree').getSourceImage();
      const bodyTreeScaleX = map.widthInPixels / bodyTreeImage.width;
      const bodyTreeScaleY = map.heightInPixels / bodyTreeImage.height;
      const bodyTree = this.add.image(0, 0, 'body-tree')
        .setOrigin(0, 0)
        .setScale(bodyTreeScaleX, bodyTreeScaleY)
        .setDepth(-999);
      this.tweens.add({
        targets: bodyTree,
        x: 10,
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

    // 3-0. 걸어다닐 수 있는 영역 제한. Tiled에 "walkable"(다닐 수 있는 길, 폴리곤)과
    // "walkdisable"(그 안에서도 못 들어가는 구멍, 사각형) 오브젝트 레이어를 그려두면 적용되고,
    // 없는 맵에서는 지금까지처럼 자유롭게 돌아다닐 수 있다. 스폰 위치를 정할 때도 이 안에
    // 들어오는지 확인해야 하므로 스폰 계산보다 먼저 만들어둔다.
    this.walkablePolygons = (map.getObjectLayer('walkable')?.objects || [])
      .filter(obj => obj.polygon)
      .map(obj => new Phaser.Geom.Polygon(obj.polygon.map(p => ({ x: obj.x + p.x, y: obj.y + p.y }))));
    // walkdisable 오브젝트는 사각형뿐 아니라 폴리곤으로도 그릴 수 있다(폴리곤은 Tiled에서
    // width/height가 0으로 저장되므로, 사각형 취급하면 사실상 아무 것도 막지 못한다).
    const hiddenForestUnlocked = window.GameSave?.state?.data?.story?.hiddenForestUnlocked === true;
    this.walkdisableShapes = (map.getObjectLayer('walkdisable')?.objects || [])
      // 이전 맵 JSON에는 blocker 이름이 없으므로, 숨겨진 숲 입구 바로 아래를 막는
      // walkdisable(id 14)도 랜턴을 고친 뒤에는 함께 제거한다.
      .filter(obj => !(
        hiddenForestUnlocked
        && this.currentMapKey === 'map_02_forest'
        && (obj.name === 'hidden_forest_blocker' || obj.id === 14)
      ))
      .map(obj => obj.polygon
        ? new Phaser.Geom.Polygon(obj.polygon.map(p => ({ x: obj.x + p.x, y: obj.y + p.y })))
        : new Phaser.Geom.Rectangle(obj.x, obj.y, obj.width || 1, obj.height || 1));

    // 용의자와 대화하다가 VN/다빈치코드로 넘어간 뒤 돌아온 거면, 다른 스폰 로직보다
    // 우선해서 대화를 걸었던 그 자리에 그대로 세운다.
    let startPoint = (this.resumeX != null && this.resumeY != null)
      ? { x: this.resumeX, y: this.resumeY }
      : null;
    if (!startPoint && this.fromMapKey) {
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
        // 포탈(문) 바로 앞에서 걸어나오는 느낌이어야 하므로, 맵 중앙 쪽으로 멀리 튕겨내는 대신
        // 포탈 주변을 방사형으로 가까운 거리부터 훑어서 "포탈 박스 밖 + walkable 안"인 가장
        // 가까운 지점을 찾는다. (포탈 영역에 그대로 두면 도착하자마자 다시 겹침이 감지돼
        // 원래 맵으로 튕겨나가고, walkable을 무시하면 캐릭터가 못 움직이게 갇힌다.)
        // 보트는 캐릭터보다 충돌 판정 몸통이 훨씬 커서(가로 폭 절반이 70px 넘음),
        // 20px짜리 여유로는 중심점만 포탈 밖으로 나가고 실제 몸통은 여전히 겹쳐서
        // 도착하자마자 다시 되돌아가버렸다. 걷는 캐릭터도 마찬가지 문제가 있다 -
        // 충돌 바디가 스프라이트 발밑에 크게 아래로 치우쳐 있어서(setOffset 참고),
        // 후보 지점이 스프라이트 기준으로는 포탈 밖이어도 실제 발(바디) 위치는
        // 포탈 안에 걸쳐 있을 수 있다(예: 포탈 바로 위쪽 후보가 걸림). 그래서 걷는
        // 캐릭터도 여유를 넉넉히 준다.
        const margin = 100;
        const rx0 = returnPortal.x - margin, ry0 = returnPortal.y - margin;
        const rx1 = returnPortal.x + (returnPortal.width || 0) + margin;
        const ry1 = returnPortal.y + (returnPortal.height || 0) + margin;
        const baseRadius = Math.max(returnPortal.width || 0, returnPortal.height || 0) / 2 + 30;
        // update()의 walkable 체크는 스프라이트 위치가 아니라 충돌 바디의 발끝(맨 아래)
        // 좌표로 한다. 몸 전체(player 스프라이트)는 발밑 좁은 영역만 바디로 쓰고 그 바디가
        // 스프라이트보다 한참 아래로 치우쳐 있어서(setOffset 참고), 스프라이트 기준으로는
        // walkable해 보이는 후보도 실제 발 위치는 walkable 밖일 수 있다 - 그러면 도착하자마자
        // update()가 매 프레임 위치를 되돌려서 캐릭터가 그 자리에 그대로 멈춰버린다. 그래서
        // 후보를 검사할 때도 발이 놓일 대략적인 위치(스프라이트 기준 y + 아래쪽 오프셋)로
        // walkable 여부를 확인한다.
        const isInteriorTarget = this.currentMapKey === 'map_08_body' || this.currentMapKey === 'map_07_inter';
        const isBoatTarget = this.currentMapKey === 'map_06_water';
        const feetYOffset = isBoatTarget ? 40 : (isInteriorTarget ? 90 : 75);
        outer:
        for (const radius of [baseRadius, baseRadius + 40, baseRadius + 80, baseRadius + 140, baseRadius + 220, baseRadius + 320]) {
          for (const angleDeg of [90, 270, 0, 180, 45, 135, 225, 315]) {
            const angle = angleDeg * Math.PI / 180;
            const candidate = { x: px + Math.cos(angle) * radius, y: py + Math.sin(angle) * radius };
            const stillInsidePortal = candidate.x >= rx0 && candidate.x <= rx1 && candidate.y >= ry0 && candidate.y <= ry1;
            if (stillInsidePortal) continue;
            // 맵 바깥으로 나가는 후보는 제외한다. world bounds에 막혀 다시 포탈 쪽으로
            // 튕겨 들어오면서 도착하자마자 재입장이 감지되는 문제(예: map_08_body처럼
            // 포탈이 맵 가장자리에 가까운 작은 맵)를 막기 위함.
            const boundsMargin = 40;
            const outOfBounds = candidate.x < boundsMargin || candidate.x > map.widthInPixels - boundsMargin
              || candidate.y < boundsMargin || candidate.y > map.heightInPixels - boundsMargin;
            if (outOfBounds) continue;
            if (!this.isWalkable(candidate.x, candidate.y)) continue;
            if (!this.isWalkable(candidate.x, candidate.y + feetYOffset)) continue;
            startPoint = candidate;
            break outer;
          }
        }
        // 그래도 못 찾으면 이 포탈 기준 스폰은 포기하고 아래의 기본 start_point로 넘어간다.
      }
    }
    if (!startPoint) {
      startPoint = map.findObject('Portals', obj => obj.name === 'start_point');
    }
    // 마을 맵은 start_point 오브젝트가 따로 없으면, 오프닝 컷씬에서 탐정이 도착하는
    // detective_path의 마지막 지점을 기본 스폰 위치로 쓴다(컷씬이 재생 안 될 때도 같은
    // 자리에서 시작하도록 통일).
    if (!startPoint && this.currentMapKey === 'map_01_village') {
      const detectivePathObj = (map.getObjectLayer('detective_path')?.objects || []).find(obj => obj.polyline || obj.polygon);
      const detectivePathPoints = detectivePathObj?.polyline || detectivePathObj?.polygon;
      if (detectivePathPoints?.length) {
        const last = detectivePathPoints[detectivePathPoints.length - 1];
        startPoint = { x: detectivePathObj.x + last.x, y: detectivePathObj.y + last.y };
      }
    }
    if (!startPoint) {
      startPoint = { x: map.widthInPixels / 2, y: map.heightInPixels / 2 };
    }
    // water 맵에서는 걸어다니는 캐릭터 대신 보트를 조작한다(스프라이트시트가 아니라 정지 그림 한 장).
    this.isBoat = this.currentMapKey === 'map_06_water';
    if (this.isBoat) {
      const boatImage = this.textures.get('boat_main').getSourceImage();
      this.player = this.physics.add.sprite(startPoint.x, startPoint.y, 'boat_main')
        .setScale(250 / boatImage.width);
      // 충돌 판정은 보트 형태(넓고 낮음)에 맞춰 살짝 안쪽으로 줄인다.
      this.player.body.setSize(this.player.width * 0.8, this.player.height * 0.7);
      this.player.body.setOffset(this.player.width * 0.1, this.player.height * 0.15);
    } else {
      // 원본 스프라이트가 사람 키 기준으로 너무 커서(342px) 0.28배로 줄인다.
      // 배경 그림 속 문/의자 크기랑 맞춰서 조절. body/inside 맵은 실내라 캐릭터를 조금 더 크게 보이게 한다.
      const isInteriorMap = this.currentMapKey === 'map_08_body' || this.currentMapKey === 'map_07_inter';
      const playerScale = isInteriorMap ? 0.58 : 0.48;
      this.player = this.physics.add.sprite(startPoint.x, startPoint.y, 'player', 0).setScale(playerScale);
      // 충돌 판정은 발밑 좁은 영역만 쓴다(전신 박스를 쓰면 앞의 벽/오브젝트에 너무 일찍 걸린다).
      // 충돌 바디를 실제 발 부분에만 둔다.
      const bodyW = this.player.width * 0.42;
      const bodyH = this.player.height * 0.14;

      this.player.body.setSize(bodyW, bodyH);

      this.player.body.setOffset(
          (this.player.width - bodyW) / 2,
          this.player.height * 0.82
      );
    }
    this.player.body.setCollideWorldBounds(true);
    this.lastDir = 'down';
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
    // Enter로 오프닝 컷씬 스킵
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // 카메라를 0.35배 축소해서 쓰는데(위 setZoom), setScrollFactor(0)로 "화면에 고정"한
    // 오브젝트도 스크롤만 무시할 뿐 줌 배율은 그대로 적용된다 - 그래서 화면 좌표를 그대로
    // 써서 만들면 크기/위치가 줌 배율만큼 줄어들어 화면 중앙 쪽으로 쏠려 보인다(대화창이
    // 작고 어중간한 위치에 뜨던 문제가 이거였음). 아래 헬퍼로 "원하는 화면 좌표/길이"를
    // 줌을 상쇄한 월드 좌표/길이로 변환해서 UI를 배치한다.
    const zoom = this.cameras.main.zoom;
    const camCenterX = this.cameras.main.width / 2;
    const camCenterY = this.cameras.main.height / 2;
    const uiX = (sx) => (sx - camCenterX) / zoom + camCenterX;
    const uiY = (sy) => (sy - camCenterY) / zoom + camCenterY;
    const uiLen = (n) => n / zoom;
    const uiFont = (px) => `${Math.round(px / zoom)}px`;
    this.uiX = uiX;
    this.uiY = uiY;
    this.uiLen = uiLen;
    this.uiFont = uiFont;

    // 예전엔 (640,670)에 있었는데, 화면이 960x540이라 670은 화면 밖이라 안 보이고 있었다.
    this.interactText = this.add.text(uiX(this.cameras.main.width / 2), uiY(this.cameras.main.height - 40), '', {
      fontSize: uiFont(14), fill: '#ffff00', backgroundColor: '#000000aa', padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

    // NPC 대화창. RPG Maker풍 - 화면 하단에 딱 붙는 단색 검은 박스, 왼쪽에 정사각형
    // 흉상 초상화, "[이름]" 형태 이름표, 흰 텍스트, 하단 중앙에 다음 표시용 ▼.
    // 여기부터는 전부 "화면 기준" 좌표/길이를 정한 뒤 uiX/uiY/uiLen으로 변환해서 쓴다.
    const dialogCam = this.cameras.main;
    const dialogBoxW = dialogCam.width;
    const dialogBoxH = 170;
    const dialogBoxX = 0;
    const dialogBoxY = dialogCam.height - dialogBoxH;
    // 초상화는 박스 왼쪽 끝에 딱 붙여서 박스 높이만큼 꽉 채운다(테두리/여백 없음).
    const portraitSize = dialogBoxH;
    const portraitX = dialogBoxX;
    const portraitY = dialogBoxY;
    const textStartX = portraitX + portraitSize + 24;
    this.dialogueBox = this.add.graphics().setScrollFactor(0).setDepth(3000).setVisible(false);
    this.dialogueBox.fillStyle(0x000000, 0.92);
    this.dialogueBox.fillRect(uiX(dialogBoxX), uiY(dialogBoxY), uiLen(dialogBoxW), uiLen(dialogBoxH));
    this.dialoguePortraitBox = { x: uiX(portraitX), y: uiY(portraitY), size: uiLen(portraitSize) };
    this.dialoguePortraitBg = this.add.graphics().setScrollFactor(0).setDepth(3001).setVisible(false);
    this.dialoguePortraitBg.fillStyle(0x000000, 0.92);
    this.dialoguePortraitBg.fillRect(uiX(portraitX), uiY(portraitY), uiLen(portraitSize), uiLen(portraitSize));
    this.dialoguePortrait = this.add.image(uiX(portraitX + portraitSize / 2), uiY(portraitY + portraitSize / 2), 'player', 0)
      .setScrollFactor(0).setDepth(3002).setVisible(false);
    this.dialogueNameText = this.add.text(uiX(textStartX), uiY(dialogBoxY + 16), '', {
      fontSize: uiFont(17), fill: '#ffffff', fontStyle: 'bold',
    }).setScrollFactor(0).setDepth(3001).setVisible(false);
    this.dialogueText = this.add.text(uiX(textStartX), uiY(dialogBoxY + 48), '', {
      fontSize: uiFont(16), fill: '#ffffff', wordWrap: { width: uiLen(dialogBoxX + dialogBoxW - 20 - textStartX) }, lineSpacing: uiLen(8),
    }).setScrollFactor(0).setDepth(3001).setVisible(false);
    this.dialogueHint = this.add.text(uiX(dialogBoxX + dialogBoxW / 2), uiY(dialogBoxY + dialogBoxH - 14), '▼', {
      fontSize: uiFont(16), fill: '#ffffff',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(3001).setVisible(false);

    this.isTalking = false;
    this.isCutscene = false;
    this.nearNPC = null;
    this.lastStepSoundTime = 0;

    // 배경음악 재생. bgm-main은 항상 깔리고, 맵별 전용 배경음악(EXTRA_BGM_BY_MAP)이
    // 있으면 그 위에 겹쳐서 같이 튼다(하나가 다른 하나를 대체하지 않음). 사운드
    // 매니저(this.sound)는 씬이 restart돼도 유지되므로, 이미 만들어둔 인스턴스가
    // 있으면(포탈로 맵을 옮긴 경우 등) 그대로 이어서 쓰고, 없을 때만 새로 만든다 —
    // 그래야 맵 옮길 때마다 처음부터 다시 재생되지 않는다.
    const playBgm = (key, volume = 0.4) => {
      const bgm = this.sound.get(key) || this.sound.add(key, { loop: true, volume });
      if (bgm.isPaused) bgm.resume();
      else if (!bgm.isPlaying) bgm.play();
      return bgm;
    };
    this.bgmMain = playBgm('bgm-main');
    const extra = EXTRA_BGM_BY_MAP[this.currentMapKey];
    Object.entries(EXTRA_BGM_BY_MAP).forEach(([mapKey, { key }]) => {
      if (mapKey === this.currentMapKey) return;
      const bgm = this.sound.get(key);
      if (bgm && (bgm.isPlaying || bgm.isPaused)) bgm.pause();
    });
    if (extra) {
      this.bgmExtra = playBgm(extra.key, extra.volume);
    }

    // =============================================
    // 최종 집합 이벤트
    // =============================================
    if (this.endingGather) {

        // 검은 화면에서 마을이 다시 나타난다.
        this.cameras.main.fadeIn(
            300,
            0,
            0,
            0
        );

        // fadeIn이 끝난 뒤 집합 대화 시작
        this.cameras.main.once(
            Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE,
            () => {
                this.startFinalGatherDialogue();
            }
        );
    }
    const story = window.GameSave?.state?.data?.story;
    // 농부 도주 뒤 플레이어가 직접 마을의 숲 포탈을 통과해 처음 도착했을 때만
    // 랜턴 발견/수리 장면을 시작한다.
    if (this.storyEvent === 'forestDiscovery'
      || (this.currentMapKey === 'map_02_forest' && story?.phase === 'farmer_escape')) {
      this.time.delayedCall(350, () => this.scene.start('EndingStoryScene', { route: 'forestDiscovery' }));
    }
    if (this.currentMapKey === 'map_02_forest' && this.storyEvent === 'walkToHiddenForest') {
      this.time.delayedCall(350, () => this.playHiddenForestWalkCutscene());
    }
    if (this.currentMapKey === 'map_08_body' && story?.phase === 'hidden_forest' && story.bodyFound === false) {
      this.time.delayedCall(450, () => this.scene.start('EndingStoryScene', { route: 'bodyConfession' }));
    }
    // 8. 오프닝 컷씬. 맨 처음 마을에 들어왔을 때(포탈을 타고 온 게 아니라 게임을 막 시작했을
    // 때)만 한 번 재생한다.
    if (this.currentMapKey === 'map_01_village' && !this.fromMapKey && !hasPlayedIntro
      && !this.endingGather && (!story || story.phase === 'investigation')) {
      hasPlayedIntro = true;
      this.playIntroCutscene(map);
    }
  }

  // 랜턴을 고친 뒤 탐정이 숲 아래쪽 시작점에서 북쪽의 숨겨진 입구까지 걸어가는 장면.
  // 물리 충돌은 잠시 끄고 숲길 중심을 따라 여러 지점을 순서대로 이동시킨다.
  playHiddenForestWalkCutscene() {
    if (this.isCutscene || this.currentMapKey !== 'map_02_forest') return;

    this.isCutscene = true;
    this.portalTransitioning = true;
    this.player.body.setVelocity(0);
    this.player.body.enable = false;
    this.player.setDepth(2000);
    this.interactText.setText('').setVisible(false);

    const path = [
      { x: 1549, y: 1810 },
      { x: 1580, y: 1510 },
      { x: 1600, y: 1280 },
      { x: 1710, y: 1120 },
      { x: 1660, y: 930 },
      { x: 1545, y: 760 },
      { x: 1555, y: 535 },
    ];

    const walkNext = (index) => {
      if (index >= path.length) {
        this.player.anims.stop();
        this.player.setFrame(15);
        this.cameras.main.fadeOut(350, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.restart({ mapKey: 'map_08_body', fromMapKey: 'map_02_forest' });
        });
        return;
      }

      const target = path[index];
      const dx = target.x - this.player.x;
      const dy = target.y - this.player.y;
      const direction = Math.abs(dx) > Math.abs(dy)
        ? (dx < 0 ? 'left' : 'right')
        : (dy < 0 ? 'up' : 'down');
      this.player.anims.play(`walk-${direction}`, true);

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, target.x, target.y);
      this.tweens.add({
        targets: this.player,
        x: target.x,
        y: target.y,
        duration: Math.max(350, distance / 360 * 1000),
        ease: 'Linear',
        onComplete: () => walkNext(index + 1),
      });
    };

    walkNext(0);
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
  // 각 맵의 "npc" 오브젝트 레이어를 그대로 읽어서 배치한다. 오브젝트 이름이 곧 NPC의
  // 고유 id라서(예: village의 "saint"/"docter", forest의 "hunter"/"boy" 등), 나중에
  // 기믹/대사를 하나씩 추가할 때 npcData.id로 구분해서 넣으면 된다.
  setupNPCs(map) {
    this.npcGroup = this.physics.add.staticGroup();
    this.npcDataMap = new Map();
    // id -> { sprite, label }. 컷씬에서 특정 NPC(예: 성녀)를 이름으로 찾아 움직이는 데 쓴다.
    this.npcById = new Map();

    // npc 오브젝트 이름 -> 그림 텍스처 키. 아직 그림이 없는 id(예: captain, body)는
    // 여기 없으니 아래에서 색깔 네모로 대신 표시된다. "docter"는 맵 데이터의 오타지만
    // 그림 파일은 정상 철자(doctor.png)로 받아서 여기서 매핑해준다.
    const npcTextureKeys = {
      saint: 'npc-saint', docter: 'npc-doctor', boy: 'npc-boy',
      farmer_baby: 'npc-farmer_baby', girl: 'npc-girl',
      farmer: 'npc-farmer', hunter: 'npc-hunter', painter: 'npc-painter', fisher: 'npc-fisher',
      captain: 'npc-captain', wife: 'npc-wife',
      village_woman1: 'npc-villager_woman', village_woman2: 'npc-villager_woman',
      body: 'npc-body',
    };
    // "body"는 걷는 캐릭터가 아니라 누워있는 정지 그림 한 장이라(가로로 긴 1536x1024),
    // 걷기 스프라이트용 크기 보정/애니메이션 대상에서 빼고 따로 취급한다.
    const STATIC_IMAGE_NPC_IDS = new Set(['body']);
    const isInteriorMap = this.currentMapKey === 'map_08_body' || this.currentMapKey === 'map_07_inter';
    const npcScale = isInteriorMap ? 0.58 : 0.48;
    const palette = [0xff6666, 0x66ff66, 0xffff66, 0x66ffff, 0xff66ff, 0xffa500, 0xaa88ff];

    // wife는 표준 프레임(204x384)이라 npcScale이 곧 실제 크기다. 다른 그림들은 원본
    // 프레임 세로 크기가 제각각이라(예: doctor 313px, farmer_baby 313px, saint 350px)
    // 같은 npcScale을 곱해도 화면상 키가 서로 달라 보인다 - wife 프레임 높이(384) 기준으로
    // 배율을 보정해서 다들 wife와 같은 화면 크기로 보이게 맞춘다.
    const WIFE_FRAME_H = 384;
    const npcFrameHeightByTexKey = {
      'npc-saint': 350, 'npc-boy': 350, 'npc-doctor': 313, 'npc-farmer_baby': 313,
      'npc-villager_woman': 313, 'npc-farmer': 384,
    };

    const npcObjects = map.getObjectLayer('npc')?.objects || [];
    npcObjects.forEach((obj, i) => {
      if (!obj.name) return;
      const storyPhase = window.GameSave?.state?.data?.story?.phase;
      const isEndingForest = this.currentMapKey === 'map_02_forest'
        && ['farmer_escape', 'hidden_forest', 'confession', 'ending'].includes(storyPhase);
      if (isEndingForest && (obj.name === 'hunter' || obj.name === 'boy')) return;
      const data = { id: obj.name, name: NPC_DISPLAY_NAME[obj.name] || obj.name };
      const texKey = npcTextureKeys[obj.name];

      let npc;
      let isSpriteNpc = false;
      if (texKey && this.textures.exists(texKey) && STATIC_IMAGE_NPC_IDS.has(obj.name)) {
        // 걷기 스프라이트가 아니라 정지 그림이라 애니메이션도 없고, 크기도 캐릭터
        // 스케일(npcScale)이 아니라 화면에 자연스러운 폭(약 200px)에 맞춘 별도 배율을 쓴다.
        const targetWidth = 200;
        npc = this.add.image(obj.x, obj.y, texKey).setScale(targetWidth / this.textures.get(texKey).getSourceImage().width);
      } else if (texKey && this.textures.exists(texKey)) {
        const frameH = npcFrameHeightByTexKey[texKey] || WIFE_FRAME_H;
        const sizeAdjust = WIFE_FRAME_H / frameH;
        npc = this.add.sprite(obj.x, obj.y, texKey, 0).setScale(npcScale * sizeAdjust);
        this.ensureNpcAnims(texKey, texKey === 'npc-farmer' ? 4 : 5);
        isSpriteNpc = true;
      } else {
        npc = this.add.rectangle(obj.x, obj.y, 28, 28, palette[i % palette.length]);
      }
      this.physics.add.existing(npc, true);
      if (isSpriteNpc) {
        // 기본은 스프라이트 전신 크기 그대로 충돌 박스가 잡혀서 너무 커진다 -
        // 보트(충돌 판정이 훨씬 큼)를 탄 상태로는 NPC 근처에 몸이 닿기도 전에
        // 막혀버려서 상호작용 거리(140px) 안으로 들어오지 못하는 문제가 있었다.
        // 발밑 좁은 영역만 막히게 줄인다.
        const bodyW = npc.width * 0.4;
        const bodyH = npc.height * 0.2;
        npc.body.setSize(bodyW, bodyH);
        npc.body.setOffset((npc.width - bodyW) / 2, npc.height - bodyH);
      }
      this.npcGroup.add(npc);

      const label = this.add.text(obj.x, obj.y - npc.displayHeight / 2 - 8, data.name, {
        fontSize: '30px', fill: '#ffffff'
      }).setOrigin(0.5);

      this.npcDataMap.set(npc, data);
      this.npcById.set(data.id, { sprite: npc, label, texKey: texKey && this.textures.exists(texKey) ? texKey : null });
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
        if (targetMap === 'map_08_body'
          && window.GameSave?.state?.data?.story?.farmerLantern !== 'lit') {
          if (!this.portalLockNotice || this.time.now > this.portalLockNotice) {
            this.portalLockNotice = this.time.now + 1500;
            this.interactText.setText('안쪽은 너무 어두워 들어갈 수 없다.').setVisible(true);
          }
          return;
        }
        if (this.portalTransitioning) return;
        this.portalTransitioning = true;
        this.scene.restart({ mapKey: targetMap, fromMapKey: this.currentMapKey });
      });
    });
  }

  update() {
    // 컷씬 중에는 물리 바디가 꺼져있어서(body.enable = false) body.center가 갱신되지
    // 않는다. 그 상태로 아래 walkable 체크를 하면 컷씬 시작 전 위치 기준으로 "벗어났다"고
    // 오판해서, 컷씬에서 tween으로 옮긴 위치를 매 프레임 lastValidPos(꺼지기 전 위치)로
    // 도로 되돌려버린다 — 그 결과 캐릭터가 실제로는 안 움직이고 제자리에서 애니메이션만
    // 재생되는 것처럼 보였다. 그래서 이 체크 자체를 컷씬/대화 중엔 건너뛴다.
    if (this.isTalking) {
      this.player.body.setVelocity(0);
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.advanceDialogue();
      }
      return;
    }
    if (this.isCutscene) {
      this.player.body.setVelocity(0);
      if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this.skipIntroCutscene();
      }
      return;
    }

    // 직전 프레임 이동 결과가 걸을 수 있는 영역을 벗어났으면 되돌린다(walkable 레이어가
    // 없는 맵에서는 isWalkable이 항상 true라 아무 효과 없음).
    const feet = {
        x: this.player.body.center.x,
        y: this.player.body.bottom - 1
    };

    if (!this.isWalkable(feet.x, feet.y)) {
      this.player.setPosition(this.lastValidPos.x, this.lastValidPos.y);
      this.player.body.setVelocity(0);
    } else {
      this.lastValidPos.x = this.player.x;
      this.lastValidPos.y = this.player.y;
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

    // 이동 중일 때만 일정 간격으로 발소리를 재생한다(맵마다 다른 소리, 달릴 땐 더 자주).
    // 보트(water 맵)는 발이 없으니 발소리 자체를 재생하지 않는다.
    const stepKey = STEP_SOUND_BY_MAP[this.currentMapKey];
    if (!this.isBoat && stepKey && (vx !== 0 || vy !== 0)) {
      const stepInterval = isRunning ? 260 : 380;
      if (this.time.now - this.lastStepSoundTime > stepInterval) {
        this.sound.play(stepKey, { volume: 0.3 });
        this.lastStepSoundTime = this.time.now;
      }
    }

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
    // body 맵은 나무 그림이 배경 전체를 덮고 있어서, 캐릭터가 항상 맨 앞이면 나무 밑을
    // 지나가는 느낌이 안 산다. 배경(-1002)과 나무(-999) 사이 깊이에 고정해서 나무 아래로
    // 다니는 것처럼 보이게 한다.
    if (this.currentMapKey === 'map_08_body') {
      this.player.setDepth(-1000.5);
    } else {
      this.player.setDepth(this.player.y + this.player.displayHeight / 2);
    }
    if (this.depthSprites) {
      this.depthSprites.forEach(spr => spr.setDepth(spr.y + spr.displayHeight));
    }

    // 상호작용 가능한 거리 내 NPC 확인. NPC는 충돌체가 있어서(스프라이트 전체 크기 그대로)
    // 플레이어가 실제로 가까이 갈 수 있는 최소 거리가 이미 100 안팎이라, 예전 50짜리
    // 기준으론 아무리 붙어도 절대 트리거가 안 됐다. 충돌로 붙을 수 있는 거리보다 넉넉하게 잡는다.
    this.nearNPC = null;
    let minDistance = 140;

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
        // 용의자(다빈치코드 대전 상대로 매핑된 NPC)는 미연시풍 배경+일러스트 화면으로,
        // 그 외 일반 NPC는 지금까지의 하단 대화창으로 처리한다.
        if (NPC_TO_BOT_NAME[npcData.id]) {
          this.scene.start('SuspectVNScene', {
            npcId: npcData.id, npcName: npcData.name, returnMapKey: this.currentMapKey,
            returnX: this.player.x, returnY: this.player.y,
          });
        } else {
          this.startDialogue(npcData);
        }
      }
    } else {
      this.interactText.setText('').setVisible(false);
    }
  }

  // =============================================
// 최종 추리 직전 마을 집합 대화
// =============================================
startFinalGatherDialogue() {
    const save =
        window.GameSave?.state?.data;

    if (!save) {
        console.warn(
            '[최종 집합] 세이브 데이터를 찾을 수 없습니다.'
        );
        return;
    }

    // 같은 이벤트가 두 번 재생되지 않도록
    // 실제 대화가 시작되는 순간 기록한다.
    save.story.finalGatherPlayed = true;

    window.GameSave.saveGame().catch((error) => {
        console.error(
            '[최종 집합] 진행상태 저장 실패:',
            error
        );
    });

    // 플레이어 이동 잠금
    this.isTalking = true;

    this.interactText
        .setText('')
        .setVisible(false);

    // 일반 NPC 한 명과 대화하는 게 아니므로 초기화
    this.currentNpcData = null;
    this.currentNpcName = null;
    this.npcPortraitTexKey = null;

    // 집합 대본 복사
    this.dialogueLines =
        FINAL_GATHER_SCRIPT.map(line => ({ ...line }));

    this.dialogueIndex = 0;

    // 이 대화가 끝났을 때 실행할 작업
    this.dialogueCompleteCallback = () => {
        save.story.phase = 'final_deduction';

        window.GameSave.saveGame().catch((error) => {
            console.error(
                '[최종 집합] final_deduction 저장 실패:',
                error
            );
        });

        console.log(
            '[최종 집합] 대화 완료 → final_deduction'
        );
        this.scale.resize(960, 540);
        this.scene.start('FinalDeductionScene');
    };

    this.showDialogueLine();
}

  // --- NPC 대화 ---
  // DIALOGUE_SCRIPTS[npcData.id]의 각 항목은 두 형태를 쓸 수 있다:
  //   - 그냥 문자열: NPC 혼자 하는 대사 한 줄 (예전 방식 그대로, 예: saint).
  //   - { q, a } 객체: 탐정이 묻고("탐정" 이름표로) NPC가 답하는("NPC 이름표로) 두 줄로
  //     펼쳐진다 - 물어보고 답하는 문답 느낌을 낼 때 이 형태를 쓰면 된다.
  // 대사가 없으면 기본 문구 하나만 보여준다. [SPACE]로 다음 줄로 넘기고, 마지막 줄에서
  // 한 번 더 누르면 대화가 끝난다.
  startDialogue(npcData) {
    this.isTalking = true;
    this.interactText.setText('').setVisible(false);
    this.currentNpcData = npcData;
    this.currentNpcName = npcData.name;
    // 초상화용 텍스처 키. NPC는 맵에 스폰할 때 쓴 스프라이트를 그대로 재사용하고,
    // 탐정(플레이어) 질문 줄에는 플레이어 스프라이트를 쓴다.
    this.npcPortraitTexKey = this.npcById.get(npcData.id)?.texKey || null;

    const rawScript = DIALOGUE_SCRIPTS[npcData.id] || [`(${npcData.name})... 별다른 말이 없다.`];
    this.dialogueLines = [];
    rawScript.forEach(entry => {
      if (typeof entry === 'string') {
        this.dialogueLines.push({ speaker: npcData.name, text: entry, isDetective: false });
      } else {
        this.dialogueLines.push({ speaker: '탐정', text: entry.q, isDetective: true });
        this.dialogueLines.push({ speaker: npcData.name, text: entry.a, isDetective: false });
      }
    });

    this.dialogueIndex = 0;
    this.showDialogueLine();
  }

  showDialogueLine() {
    const line = this.dialogueLines[this.dialogueIndex];
    this.dialogueBox.setVisible(true);
    this.dialoguePortraitBg.setVisible(true);
    this.dialogueNameText.setText(`[${line.speaker}]`).setVisible(true);
    this.dialogueText.setText(line.text).setVisible(true);
    this.dialogueHint.setVisible(true);

    // 초상화 우선순위: 1) 대화창 전용 일러스트(DIALOGUE_ILLUST_BY_NPC) 2) 없으면 맵에
    // 스폰할 때 쓴 걷기 스프라이트(탐정 질문 줄은 플레이어 스프라이트) 3) 그것도 없으면 빈 칸.
    const illustKey = line.isDetective ? DETECTIVE_ILLUST_KEY: null;

    const spriteTexKey = line.isDetective ? 'player' : (line.portraitTexKey ||this.npcPortraitTexKey);
    const { size } = this.dialoguePortraitBox;
    if (illustKey && this.textures.exists(illustKey)) {
      this.dialoguePortrait.setTexture(illustKey).setVisible(true);
      const src = this.dialoguePortrait;
      this.dialoguePortrait.setScale(size / Math.max(src.width, src.height));
    } else if (spriteTexKey && this.textures.exists(spriteTexKey)) {
      this.dialoguePortrait.setTexture(spriteTexKey, 0).setVisible(true);
      const src = this.dialoguePortrait;
      this.dialoguePortrait.setScale(size / Math.max(src.width, src.height));
    } else {
      this.dialoguePortrait.setVisible(false);
    }
  }

  advanceDialogue() {
    this.dialogueIndex += 1;
    if (this.dialogueIndex >= this.dialogueLines.length) {
      this.endDialogue();
    } else {
      this.showDialogueLine();
    }
  }

  // 일반 NPC는 대화가 끝나면 그냥 대화창만 닫는다. 용의자(NPC_TO_BOT_NAME에 있는 NPC)는
  // 애초에 여기로 안 오고 SuspectVNScene으로 바로 가서 거기서 "수사하기" 버튼을 눌러야만
  // 다빈치코드로 넘어간다 - 예전엔 여기서도 무조건 미니게임을 켜버리는 버그가 있었다.
  endDialogue() {
    const completedNpcId = this.currentNpcData?.id;
    this.isTalking = false;
    this.dialogueBox.setVisible(false);
    this.dialoguePortraitBg.setVisible(false);
    this.dialoguePortrait.setVisible(false);
    this.dialogueNameText.setVisible(false);
    this.dialogueText.setVisible(false);
    this.dialogueHint.setVisible(false);

    // 집합 대화처럼
    // 대화 종료 후 실행해야 할 작업이 있다면 실행
    const callback =
      this.dialogueCompleteCallback;

    this.dialogueCompleteCallback = null;

    if (callback) {
        callback();
    }

    const coverup = window.GameSave?.state?.data?.story?.painterCoverup;
    if (coverup && completedNpcId) {
      let changed = false;
      if (completedNpcId === 'boy' || completedNpcId === 'girl') {
        changed = !coverup.alibiGap || !coverup.farmerRelationship;
        coverup.alibiGap = true;
        coverup.farmerRelationship = true;
      }
      if (completedNpcId === 'hunter') {
        changed = changed || !coverup.bloodyTowel;
        coverup.bloodyTowel = true;
      }
      if (changed) window.GameSave.saveGame().catch(error => console.error('[은폐 단서] 저장 실패:', error));
    }
  }

  // --- 오프닝 컷씬 ---
  // 1) 평화로운 마을 전경 -> 2) 성녀가 동상 옆에서 이장의 잘린 머리를 발견 ->
  // 3) 주인공이 마을에 들어서며 조작권을 넘겨받는다. 플레이어는 컷씬 내내 숨겨두고
  // 카메라 추적도 잠깐 끈다(성녀 쪽을 비춰야 하므로).
  playIntroCutscene(map) {
    this.isCutscene = true;
    this.introSkipped = false;
    // 스킵(Enter) 시 곧바로 이 자리로 보내야 하므로, 옮기기 전 위치를 미리 기억해둔다.
    this.introFinalX = this.player.x;
    this.introFinalY = this.player.y;
    this.player.setVisible(false);
    this.player.body.enable = false;
    this.cameras.main.stopFollow();

    const cam = this.cameras.main;
    // 중세풍 양피지/가죽 패널 색. 어디서든 같은 톤을 쓰도록 상수로 뺀다.
    const PANEL_FILL = 0x2a1f14;   // 어두운 가죽/양피지 색
    const PANEL_BORDER = 0xb8860b; // 청동/황동 테두리

    // 스킵 가능하다는 걸 알려주는 안내문. 화면 우하단에 계속 떠 있다가 스킵/컷씬 종료 시 지운다.
    this.introSkipHint = this.add.text(cam.width - 16, cam.height - 16, '[ENTER] 건너뛰기', {
      fontSize: '12px', fill: '#cbb994', backgroundColor: '#000000aa', padding: { x: 8, y: 4 },
    }).setOrigin(1, 1).setScrollFactor(0).setDepth(2200);

    // 자막 배경은 Text의 backgroundColor 대신 Graphics로 그린 양피지풍 패널을 쓴다.
    // 글자 크기가 바뀔 때마다 패널 크기도 다시 계산해서 그려야 하므로 helper로 뺀다.
    const captionPanel = this.add.graphics().setScrollFactor(0).setDepth(1999).setAlpha(0);
    const caption = this.add.text(cam.width / 2, cam.height / 2, '', {
      fontSize: '38px', fill: '#f2e6cf', align: 'center', letterSpacing: 3,
      padding: { x: 24, y: 34 },
      wordWrap: { width: cam.width - 160 },
      lineSpacing: 18,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2000).setAlpha(0);
    // 스킵 처리(skipIntroCutscene)에서 지워야 하니 인스턴스에도 걸어둔다.
    this.introCaption = caption;
    this.introCaptionPanel = captionPanel;
    const drawCaptionPanel = () => {
      const w = caption.width + 20;
      const h = caption.height + 16;
      const x = caption.x - w / 2;
      const y = caption.y - h / 2;
      captionPanel.clear();
      captionPanel.fillStyle(PANEL_FILL, 0.92);
      captionPanel.fillRoundedRect(x, y, w, h, 14);
      captionPanel.lineStyle(4, PANEL_BORDER, 1);
      captionPanel.strokeRoundedRect(x, y, w, h, 14);
    };

    // 자막 하나를 페이드인 -> 잠깐 유지 -> 페이드아웃까지 보여주고 끝나면 resolve되는 프로미스.
    const showCaption = (text, holdMs) => new Promise(resolve => {
      caption.setText(text);
      drawCaptionPanel();
      this.tweens.add({
        targets: [captionPanel, caption], alpha: 1, duration: 400,
        onComplete: () => {
          this.time.delayedCall(holdMs, () => {
            this.tweens.add({ targets: [captionPanel, caption], alpha: 0, duration: 400, onComplete: resolve });
          });
        },
      });
    });
    const wait = ms => new Promise(resolve => this.time.delayedCall(ms, resolve));

    // 발견 장면에서 잠깐 띄우는 블러 처리된 머리 그림. 배경/액자 없이 투명한 채로 그림에만
    // 블러를 걸어서 화면 중앙에 띄운다. 평소엔 숨김.
    const headImage = this.add.image(cam.width / 2, cam.height / 2, 'cutscene-head')
      .setScrollFactor(0).setDepth(2100).setAlpha(0).setDisplaySize(480, 720);
    this.introHeadImage = headImage;
    // 렌더러에 따라(특히 캔버스 폴백) FX가 아예 없을 수 있어 실패해도 컷씬이 안 멈추게 감싼다.
    try { headImage.postFX?.addBlur(0, 1, 1, 2, 0xffffff, 4); } catch (e) { console.warn('머리 이미지 블러 효과 실패:', e); }
    const flashHeadImage = holdMs => new Promise(resolve => {
      this.tweens.add({
        targets: headImage, alpha: 0.95, duration: 150,
        onComplete: () => {
          this.time.delayedCall(holdMs, () => {
            this.tweens.add({ targets: headImage, alpha: 0, duration: 500, onComplete: resolve });
          });
        },
      });
    });

    const statue = map.findObject('Portals', obj => obj.name === 'deco_village_statue');
    const saintEntry = this.npcById.get('saint');
    // 도망칠 때 원래 서 있던 자리까지 되짚어가야 하므로 이동하기 전 원위치를 미리 기억해둔다.
    const saintOriginalPos = saintEntry ? { x: saintEntry.sprite.x, y: saintEntry.sprite.y } : null;
    this.introSaintEntry = saintEntry;
    this.introSaintOriginalPos = saintOriginalPos;
    const statueX = statue ? statue.x + statue.width / 2 : this.player.x;
    const statueY = statue ? statue.y + statue.height / 2 - 40 : this.player.y;

    // 성녀가 걸어갈 길. Tiled에 "saint_path"라는 오브젝트 레이어를 만들고 그 안에
    // 폴리라인이나 폴리곤을 하나 그려두면 찍은 점들을 순서대로 따라가고(폴리곤이어도 시작점으로
    // 돌아가는 닫는 선은 무시한다), 없으면 동상까지 직선으로 이동한다.
    const pathObj = (map.getObjectLayer('saint_path')?.objects || []).find(obj => obj.polyline || obj.polygon);
    const pathPoints = pathObj?.polyline || pathObj?.polygon;
    const saintWaypoints = pathPoints
      ? pathPoints.map(p => ({ x: pathObj.x + p.x, y: pathObj.y + p.y }))
      : [{ x: statueX, y: statueY + 20 }];

    // 성녀가 도망갈 길. Tiled에 "saint_flee_path" 레이어를 만들고 그 안에 폴리라인/폴리곤을
    // 그려두면 그 경로로 도망가고, 없으면 왔던 길을 그대로 되짚어 원위치로 돌아간다.
    const fleePathObj = (map.getObjectLayer('saint_flee_path')?.objects || []).find(obj => obj.polyline || obj.polygon);
    const fleePathPoints = fleePathObj?.polyline || fleePathObj?.polygon;
    const saintFleeWaypoints = fleePathPoints
      ? fleePathPoints.map(p => ({ x: fleePathObj.x + p.x, y: fleePathObj.y + p.y }))
      : null;

    // 탐정이 걸어올 길. Tiled에 "detective_path"라는 오브젝트 레이어를 만들고 그 안에
    // 폴리라인/폴리곤을 그려두면 그 경로를 따라오고, 없으면 농장 포탈 자리에서 곧장 걸어온다.
    const farmPortal = map.findObject('Portals', obj => obj.name === 'To_Farm');
    const detectivePathObj = (map.getObjectLayer('detective_path')?.objects || []).find(obj => obj.polyline || obj.polygon);
    const detectivePathPoints = detectivePathObj?.polyline || detectivePathObj?.polygon;

    // 웨이포인트를 순서대로 지나가되, 꺾이는 지점마다 뚝뚝 끊기지 않도록 전체 경로를
    // 하나의 Path(직선 구간들의 연결)로 잇고 그 위를 단일 트윈으로 이동한다. 이전에
    // Phaser.Curves.Spline을 썼더니 점들 사이를 곡선으로 부풀리며 지나가서(오버슈트) 그린
    // 경로를 벗어나 이상하게 움직였다 — Path.lineTo는 직선 그대로 이어붙이면서도 구간 길이
    // 비례로 시간을 배분해줘서(등속) 지점마다 트윈을 새로 시작할 때 생기던 멈칫거림 없이
    // 정확히 그려둔 경로를 따라간다.
    // label을 넘기면(NPC용) 이름표도 같이 따라 움직이고, texKey를 넘기면(플레이어는 생략,
    // NPC는 ensureNpcAnims로 만들어둔 키 사용) 이동 방향에 맞는 걷기 애니메이션을 재생한다.
    const walkPath = (sprite, points, speed, label = null, texKey = null) => new Promise(resolve => {
      if (!points.length) { resolve(); return; }
      const allPoints = [{ x: sprite.x, y: sprite.y }, ...points];
      const path = new Phaser.Curves.Path(allPoints[0].x, allPoints[0].y);
      for (let i = 1; i < allPoints.length; i += 1) path.lineTo(allPoints[i].x, allPoints[i].y);
      const duration = Math.max(300, (path.getLength() / speed) * 1000);
      const animPrefix = texKey ? `${texKey}-` : '';
      // 다리 애니메이션 속도가 항상 고정 10fps였어서, 빠르게 움직일 때(도망칠 때 420 등)
      // 발은 천천히 움직이는데 몸만 쭉 미끄러지듯 이동해 부자연스러워 보였다. 이동 속도에
      // 비례해서 프레임레이트도 같이 올려준다.
      const animFrameRate = Phaser.Math.Clamp(Math.round(speed / 16), 8, 30);
      let lastDir = null;
      const progress = { t: 0 };
      this.tweens.add({
        // 등속 이동(직선 구간 길이 비례 시간 배분)이 목적이라 easing 없이 선형으로 진행한다.
        // easing을 넣으면 구간 중간에 부자연스럽게 빨라지거나 느려진다.
        targets: progress, t: 1, duration,
        onUpdate: () => {
          const p = path.getPoint(progress.t);
          const tangent = path.getTangent(progress.t);
          const dir = Math.abs(tangent.x) > Math.abs(tangent.y) ? (tangent.x > 0 ? 'right' : 'left') : (tangent.y > 0 ? 'down' : 'up');
          if (dir !== lastDir) {
            lastDir = dir;
            const animKey = `${animPrefix}walk-${dir}`;
            if (sprite.anims && this.anims.exists(animKey)) sprite.anims.play({ key: animKey, frameRate: animFrameRate }, true);
          }
          sprite.setPosition(p.x, p.y);
          label?.setPosition(p.x, p.y - sprite.displayHeight / 2 - 8);
        },
        onComplete: () => {
          if (sprite.anims) {
            sprite.anims.stop();
            const idleRow = { down: 0, left: 1, right: 2, up: 3 }[lastDir || 'down'];
            sprite.setFrame(idleRow * 5);
          }
          resolve();
        },
      });
    });

    (async () => {
      cam.centerOn(this.player.x, this.player.y);
      await showCaption('조용한 마을. 사람들은 여느 때처럼 하루를 보내고 있었다.', 2200);

      if (saintEntry) {
        cam.pan(statueX, statueY, 1400, 'Sine.easeInOut');
        await walkPath(saintEntry.sprite, saintWaypoints, 240, saintEntry.label, saintEntry.texKey);
        // 정지 물리 바디는 알아서 안 따라오므로 이동이 끝난 위치로 다시 맞춰준다.
        saintEntry.sprite.body.reset(saintEntry.sprite.x, saintEntry.sprite.y);
        // 도착하면 이동 방향과 상관없이 정면(아래쪽)을 보고 선다.
        saintEntry.sprite.anims.stop();
        saintEntry.sprite.setFrame(0);
      }

      cam.shake(300, 0.01);
      cam.flash(400, 120, 0, 0);
      await flashHeadImage(1600);
      await showCaption('"꺄아악...!"', 1400);
      await showCaption('성녀가 동상 옆에서 마을 이장의 잘린 머리를 발견했다.', 2200);

      // 발견 직후 성녀는 도망친다. saint_flee_path를 그려두셨으면 그 경로로, 아니면
      // saintWaypoints(도착 지점들만 있고 원위치는 없음)의 마지막 도착점(현재 위치)을 뺀
      // 나머지를 거꾸로 돈 다음 원위치를 마지막 목적지로 붙여서 왔던 길을 되짚어간다.
      if (saintEntry) {
        const fleeWaypoints = saintFleeWaypoints
          || [...saintWaypoints.slice(0, -1)].reverse().concat([saintOriginalPos]);
        const fleePromise = walkPath(saintEntry.sprite, fleeWaypoints, 420, saintEntry.label, saintEntry.texKey)
          .then(() => {
            saintEntry.sprite.body.reset(saintEntry.sprite.x, saintEntry.sprite.y);
          });
        await Promise.all([showCaption('성녀는 비명을 지르며 달아났다...', 1800), fleePromise]);
      }

      cam.pan(this.player.x, this.player.y, 1200, 'Sine.easeInOut');
      await wait(1200);
      await showCaption('그리고 낯선 발걸음이 마을 어귀에 들어섰다...', 2000);
      caption.destroy();
      captionPanel.destroy();

      // 탐정(주인공)이 아래 농장 쪽 길에서 걸어 올라온다. 직접 그려주신 detective_path가
      // 있으면 그 경로만 그대로 따라가고, 경로의 마지막 점이 곧 실제 게임 시작 위치가 된다
      // (원래 스폰 지점으로 보정하지 않음).
      const finalX = this.player.x;
      const finalY = this.player.y;
      const absDetectivePath = detectivePathPoints?.map(p => ({ x: detectivePathObj.x + p.x, y: detectivePathObj.y + p.y }));
      const entryPoint = absDetectivePath
        ? absDetectivePath[0]
        : (farmPortal ? { x: farmPortal.x + farmPortal.width / 2, y: farmPortal.y + farmPortal.height / 2 } : { x: finalX, y: finalY + 180 });
      const detectiveWaypoints = absDetectivePath
        ? absDetectivePath.slice(1)
        : [{ x: finalX, y: finalY }];

      this.player.setPosition(entryPoint.x, entryPoint.y);
      this.player.setVisible(true);
      // 카메라가 도착 지점에 고정된 채로 있으면, 그려주신 경로가 화면 축소 비율(0.35배)
      // 대비 짧을 때 탐정이 걷는 게 잘 안 보여서 마치 도착 지점에서 바로 시작하는 것처럼
      // 보인다. 걸어오는 동안은 카메라가 탐정을 따라가게 해서 이동이 확실히 보이게 한다.
      cam.pan(entryPoint.x, entryPoint.y, 500, 'Sine.easeInOut');
      await wait(500);
      cam.startFollow(this.player);
      await walkPath(this.player, detectiveWaypoints, 160);
      cam.stopFollow();

      // 좌우를 한 번씩 살핀다(walk-left/right 스프라이트시트의 첫 프레임을 정지 이미지로 사용).
      const idleFrame = { down: 0, left: 5, right: 10, up: 15 };
      this.player.setFrame(idleFrame.left);
      await wait(500);
      this.player.setFrame(idleFrame.right);
      await wait(500);
      this.player.setFrame(idleFrame.down);
      await wait(300);

      headImage.destroy();
      this.introSkipHint.destroy();
      this.player.body.enable = true;
      this.player.body.reset(this.player.x, this.player.y);
      this.lastValidPos = { x: this.player.x, y: this.player.y };
      cam.startFollow(this.player);
      this.isCutscene = false;
    })().catch(err => {
      // 컷씬 도중 뭔가 터지면 플레이어가 영원히 숨겨진 채로 남아 "탐정이 아예 없는"
      // 상태가 될 수 있어서, 실패해도 최소한 조작권은 반드시 돌려준다.
      console.error('오프닝 컷씬 중 오류 발생, 조작권을 돌려줍니다:', err);
      caption.destroy();
      captionPanel.destroy();
      headImage.destroy();
      this.introSkipHint.destroy();
      this.player.setVisible(true);
      this.player.body.enable = true;
      this.player.body.reset(this.player.x, this.player.y);
      this.lastValidPos = { x: this.player.x, y: this.player.y };
      cam.startFollow(this.player);
      this.isCutscene = false;
    });
  }

  // Enter를 누르면 오프닝 컷씬을 건너뛴다. 진행 중이던 트윈/타이머를 전부 죽이고
  // (그러면 컷씬의 async 시퀀스는 다음 await에서 영원히 멈춘 채 방치되지만, 화면엔
  // 아무 영향 없다) 성녀/탐정/카메라를 각자의 최종 상태로 즉시 맞춰준다.
  skipIntroCutscene() {
    if (!this.isCutscene || this.introSkipped) return;
    this.introSkipped = true;

    this.tweens.killAll();
    this.time.removeAllEvents();
    this.cameras.main.resetFX();

    this.introCaption?.destroy();
    this.introCaptionPanel?.destroy();
    this.introHeadImage?.destroy();
    this.introSkipHint?.destroy();

    if (this.introSaintEntry) {
      const { sprite, label } = this.introSaintEntry;
      const pos = this.introSaintOriginalPos;
      sprite.setPosition(pos.x, pos.y);
      sprite.body.reset(pos.x, pos.y);
      sprite.anims.stop();
      sprite.setFrame(0);
      label?.setPosition(pos.x, pos.y - sprite.displayHeight / 2 - 8);
    }

    this.player.setPosition(this.introFinalX, this.introFinalY);
    this.player.setVisible(true);
    this.player.anims.stop();
    this.player.setFrame(0);
    this.player.body.enable = true;
    this.player.body.reset(this.introFinalX, this.introFinalY);
    this.lastValidPos = { x: this.introFinalX, y: this.introFinalY };
    this.cameras.main.startFollow(this.player);
    this.isCutscene = false;
  }
}
