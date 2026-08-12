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
    // 대화를 걸었던 자리. 맵으로 돌아갈 때(직접 돌아가기든, 다빈치코드 갔다 오든)
    // 이 자리에 그대로 세우기 위해 계속 들고 다닌다.
    this.returnX = data.returnX;
    this.returnY = data.returnY;
  }

  preload() {
    // 다른 곳(MapScene.js 등)과 마찬가지로 캐시 무효화 파라미터를 붙인다 - 안 그러면
    // 그림을 새로 바꿔 올려도 브라우저가 예전에 받아둔 캐시된 이미지를 계속 써서
    // 새로고침해도 반영이 안 된 것처럼 보인다.
    const v = Date.now();
    const assets = SUSPECT_VN_ASSETS[this.npcId];
    this.bgKey = null;
    this.illustKey = null;
    if (assets?.bg) {
      this.bgKey = `vn-bg-${this.npcId}`;
      this.load.image(this.bgKey, `${assets.bg}?v=${v}`);
    }
    if (assets?.illust) {
      this.illustKey = `vn-illust-${this.npcId}`;
      this.load.image(this.illustKey, `${assets.illust}?v=${v}`);
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

    // 버튼이 들어갈 자리를 미리 기억해둔다(대화창 안, 힌트 문구 바로 위쪽).
    this.boxCenterX = boxX + boxW / 2;
    this.buttonY = boxY + boxH - 40;

    this.dialogueLines = DIALOGUE_SCRIPTS[this.npcId] || [`(${this.npcName})... 별다른 말이 없다.`];
    this.dialogueIndex = 0;
    this.choiceButtons = null;
    this.selectedButtonIndex = 0;
    this.showLine();

    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
  }

  showLine() {
    const isLast = this.dialogueIndex >= this.dialogueLines.length - 1;
    this.lineText.setText(this.dialogueLines[this.dialogueIndex]);
    if (isLast) {
      this.hintText.setText('');
      this.showChoiceButtons();
    } else {
      this.hintText.setText('[SPACE] 다음');
    }
  }

  // 마지막 대사에 도달하면 "수사하기"/"맵으로 돌아가기" 버튼을 띄운다. 클릭이 아니라
  // 방향키(←/→)로 고르고 [SPACE]나 [ENTER]로 확정하는 방식 - 선택된 쪽은 테두리를
  // 밝게 칠해서 표시한다.
  showChoiceButtons() {
    if (this.choiceButtons) return;
    const gap = 20;
    const btnW = 180;
    const investigateBtn = this.makeButton(
      this.boxCenterX - btnW / 2 - gap / 2, this.buttonY, btnW, 36, '수사하기',
      () => {
        const botName = NPC_TO_BOT_NAME[this.npcId] || '봇1';
        this.scale.resize(800, 600);
        this.scene.start('DaVinciCodeScene', {
          botName, npcId: this.npcId, npcName: this.npcName, returnMapKey: this.returnMapKey,
          returnX: this.returnX, returnY: this.returnY,
        });
      },
    );
    const backBtn = this.makeButton(
      this.boxCenterX + btnW / 2 + gap / 2, this.buttonY, btnW, 36, '맵으로 돌아가기',
      () => this.scene.start('MapScene', {
        mapKey: this.returnMapKey, returnX: this.returnX, returnY: this.returnY,
      }),
    );
    this.choiceButtons = [investigateBtn, backBtn];
    this.selectedButtonIndex = 0;
    this.refreshButtonHighlight();
  }

  // 가죽/청동 톤 버튼 하나. cx/cy는 버튼 중심 좌표. 방향키 선택 방식이라 클릭은
  // 보조 수단으로만 남겨둔다(마우스로도 여전히 누를 수 있음).
  makeButton(cx, cy, w, h, label, onClick) {
    const g = this.add.graphics();
    const text = this.add.text(cx, cy, label, { fontSize: '15px', fill: '#f2e6cf' }).setOrigin(0.5);
    const zone = this.add.zone(cx - w / 2, cy - h / 2, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onClick);
    zone.on('pointerover', () => {
      this.selectedButtonIndex = this.choiceButtons.findIndex(b => b.zone === zone);
      this.refreshButtonHighlight();
    });
    const container = this.add.container(0, 0, [g, text, zone]);
    return { container, g, cx, cy, w, h, zone, onClick };
  }

  // 선택된 버튼은 밝은 청동 테두리 + 굵은 선으로, 나머지는 어두운 테두리로 다시 그린다.
  refreshButtonHighlight() {
    this.choiceButtons.forEach((btn, i) => {
      const selected = i === this.selectedButtonIndex;
      btn.g.clear();
      btn.g.fillStyle(selected ? 0x3a2c1a : 0x2a1f14, 0.95);
      btn.g.fillRoundedRect(btn.cx - btn.w / 2, btn.cy - btn.h / 2, btn.w, btn.h, 8);
      btn.g.lineStyle(selected ? 4 : 2, selected ? 0xf0c860 : 0x8a6a2a, 1);
      btn.g.strokeRoundedRect(btn.cx - btn.w / 2, btn.cy - btn.h / 2, btn.w, btn.h, 8);
    });
  }

  update() {
    if (this.choiceButtons) {
      // 버튼이 떠 있으면 ←/→로 고르고 SPACE/ENTER로 확정한다.
      if (Phaser.Input.Keyboard.JustDown(this.leftKey) || Phaser.Input.Keyboard.JustDown(this.rightKey)) {
        this.selectedButtonIndex = 1 - this.selectedButtonIndex;
        this.refreshButtonHighlight();
      }
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this.choiceButtons[this.selectedButtonIndex].onClick();
      }
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) && this.dialogueIndex < this.dialogueLines.length - 1) {
      this.dialogueIndex += 1;
      this.showLine();
    }
  }
}
