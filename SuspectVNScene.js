// 용의자 심문 진입용 미연시(비주얼노벨)풍 화면. 배경 위에 그 용의자의 일러스트를
// 덮어 씌우고, 대사가 넘어갈 때마다(나중에) 표정이 다른 일러스트로 바꿔치기해서
// 생동감을 준다. 지금은 배경/일러스트 이미지가 아직 없어서 자리표시용 도형으로
// 대신 그리고, DIALOGUE_SCRIPTS(MapScene.js에 있음)의 대사를 그대로 재사용한다.
// 대사가 끝나면 다빈치코드 대전으로 넘어간다.

// npc id -> 배경/일러스트 이미지 경로. 지금은 다 비어있어서 전부 자리표시로 그려지고,
// 나중에 이미지 받으면 여기에 경로만 채우면 된다(예: saint: { bg: 'asset/vn/saint_bg.png',
// illust: 'asset/vn/saint_normal.png' }).
const SUSPECT_VN_ASSETS = {
  wife  : {bg:'asset/Suspect_Scene/suspect_wife.png',illust: 'asset/characters/용의자들-wife/suspect_wife_ill.png'},
  hunter: {bg:'asset/Suspect_Scene/suspect_hunter.png',illust: 'asset/characters/용의자들-hunter/suspect_hunter_ill.png'},
  farmer: {bg:'asset/Suspect_Scene/suspect_farmer.png',illust: 'asset/characters/용의자들-farmer/suspect_farmer_ill.png'},
  painter: {bg:'asset/Suspect_Scene/suspect_painter.png',illust: 'asset/characters/용의자들-painter/suspect_painter_ill.png'},
  fisher: {bg:'asset/Suspect_Scene/suspect_fisher.png',illust: 'asset/characters/용의자들-fisher/suspect_fisher_ill.png', illustScale: 1.2},
};

class SuspectVNScene extends Phaser.Scene {
  constructor() {
    super('SuspectVNScene');
  }

  init(data) {
    this.npcId = data.npcId;
    this.npcName = data.npcName || data.npcId;
    this.returnMapKey = data.returnMapKey || 'map_01_village';
  }

  preload() {
    const assets = SUSPECT_VN_ASSETS[this.npcId];
    this.bgKey = null;
    this.illustKey = null;
    if (assets?.bg) {
      this.bgKey = `vn-bg-${this.npcId}`;
      this.load.image(this.bgKey, assets.bg);
    }
    if (assets?.illust) {
      this.illustKey = `vn-illust-${this.npcId}`;
      this.load.image(this.illustKey, assets.illust);
    }
  }

  create() {
    const cam = this.cameras.main;

    // 배경: 이미지 있으면 화면 꽉 채우고, 없으면 어두운 단색 + 안내 문구로 대신한다.
    if (this.bgKey && this.textures.exists(this.bgKey)) {
      this.add.image(cam.width / 2, cam.height / 2, this.bgKey).setDisplaySize(cam.width, cam.height);
    } else {
      this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x1a1622);
      this.add.text(cam.width / 2, 30, '(배경 이미지 준비중)', {
        fontSize: '13px', fill: '#66607a',
      }).setOrigin(0.5);
    }

    // 캐릭터 일러스트: 원본이 전신 세로 그림이라 그대로 쓰면 화면보다 훨씬 커서
    // 상반신만 잘려 보였다. 세로 높이를 화면에 맞는 크기로 줄이고 화면 중앙에 둔다.
    this.illustImage = null;
    if (this.illustKey && this.textures.exists(this.illustKey)) {
      // 용의자별로 그림 비율이 달라서 좀 더 크게/작게 보이면 좋겠으면 SUSPECT_VN_ASSETS의
      // illustScale로 개별 조정한다(기본 1배).
      const illustScale = SUSPECT_VN_ASSETS[this.npcId]?.illustScale || 1;
      const illustH = 420 * illustScale; // 대화창 위 공간에 맞춘 목표 높이(상반신 정도만 보이는 크기)
      const naturalH = this.textures.get(this.illustKey).getSourceImage().height;
      this.illustImage = this.add.image(cam.width / 2, cam.height / 2 - 30, this.illustKey)
        .setOrigin(0.5, 0.5)
        .setScale(illustH / naturalH);
    } else {
      const g = this.add.graphics();
      g.fillStyle(0x3a3550, 1);
      g.fillRect(cam.width / 2 - 160, cam.height - 440, 320, 440);
      g.lineStyle(3, 0x5a5470, 1);
      g.strokeRect(cam.width / 2 - 160, cam.height - 440, 320, 440);
      this.add.text(cam.width / 2, cam.height - 230, `${this.npcName}\n(일러스트 준비중)`, {
        fontSize: '18px', fill: '#cfc9e0', align: 'center',
      }).setOrigin(0.5);
    }

    // 대화창. 마을 대화창이랑 같은 가죽/청동 톤으로 화면 하단에 띄운다.
    const boxW = cam.width - 80;
    const boxH = 150;
    const boxX = 40;
    const boxY = cam.height - boxH - 20;
    const box = this.add.graphics();
    box.fillStyle(0x2a1f14, 0.95);
    box.fillRoundedRect(boxX, boxY, boxW, boxH, 12);
    box.lineStyle(4, 0xb8860b, 1);
    box.strokeRoundedRect(boxX, boxY, boxW, boxH, 12);

    this.nameText = this.add.text(boxX + 20, boxY + 14, this.npcName, {
      fontSize: '16px', fill: '#e8b34d', fontStyle: 'bold',
    });
    this.lineText = this.add.text(boxX + 20, boxY + 42, '', {
      fontSize: '15px', fill: '#f2e6cf', wordWrap: { width: boxW - 40 },
    });
    this.hintText = this.add.text(boxX + boxW - 20, boxY + boxH - 22, '[SPACE] 다음', {
      fontSize: '12px', fill: '#cbb994',
    }).setOrigin(1, 0);

    this.dialogueLines = DIALOGUE_SCRIPTS[this.npcId] || [`(${this.npcName})... 별다른 말이 없다.`];
    this.dialogueIndex = 0;
    this.showLine();

    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  showLine() {
    const isLast = this.dialogueIndex >= this.dialogueLines.length - 1;
    this.lineText.setText(this.dialogueLines[this.dialogueIndex]);
    this.hintText.setText(isLast ? '[SPACE] 수사 시작' : '[SPACE] 다음');
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.dialogueIndex += 1;
      if (this.dialogueIndex >= this.dialogueLines.length) {
        const botName = NPC_TO_BOT_NAME[this.npcId] || '봇1';
        this.scale.resize(800, 600);
        this.scene.start('DaVinciCodeScene', { botName, returnMapKey: this.returnMapKey });
      } else {
        this.showLine();
      }
    }
  }
}
