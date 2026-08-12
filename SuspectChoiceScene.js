// 다빈치코드 대전에서 이겼을 때 들어오는 "심문 선택지" 화면. SuspectVNScene과 같은
// 배경+일러스트 위에, 이번엔 대사가 아니라 여러 질문 중 하나를 골라 물어보고
// 대답을 듣는 시뮬레이션풍 화면이다. 지금은 구조(선택지 목록 UI + 방향키 탐색 +
// 응답 표시 + 나가기)만 만들어뒀고, 실제 질문/응답 내용은 SUSPECT_CHOICE_SCRIPTS에
// 채워 넣으면 된다. 배경/일러스트 이미지는 SuspectVNScene.js의 SUSPECT_VN_ASSETS를
// 그대로 재사용한다.

// npc id -> { intro, choices: [{ label, response }] }. 지금은 다 비어있어서
// "아직 물어볼 게 없다" 자리표시만 뜬다. 항목만 채우면 그대로 동작한다.
// 예시:
// wife: {
//   intro: '무엇을 물어볼까?',
//   choices: [
//     { label: '사건 당일 행적을 물어본다', response: '...' },
//     { label: '이장과의 관계를 물어본다', response: '...' },
//   ],
// },
const SUSPECT_CHOICE_SCRIPTS = {
  wife: null,
  hunter: null,
  farmer: null,
  painter: null,
  fisher: null,
};

class SuspectChoiceScene extends Phaser.Scene {
  constructor() {
    super('SuspectChoiceScene');
  }

  init(data) {
    this.npcId = data.npcId;
    this.npcName = data.npcName || data.npcId;
    this.returnMapKey = data.returnMapKey || 'map_01_village';
    this.returnX = data.returnX;
    this.returnY = data.returnY;
  }

  preload() {
    // SuspectVNScene과 같은 배경/일러스트 이미지를 그대로 쓴다.
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

    // 배경: 이미지 있으면 화면 꽉 채우고, 없으면 어두운 단색.
    if (this.bgKey && this.textures.exists(this.bgKey)) {
      this.add.image(cam.width / 2, cam.height / 2, this.bgKey).setDisplaySize(cam.width, cam.height);
    } else {
      this.add.rectangle(cam.width / 2, cam.height / 2, cam.width, cam.height, 0x1a1622);
    }

    // 일러스트: SuspectVNScene과 같은 크기/위치 규칙(상반신 정도, 화면 중앙 위쪽).
    if (this.illustKey && this.textures.exists(this.illustKey)) {
      const illustScale = SUSPECT_VN_ASSETS[this.npcId]?.illustScale || 1;
      const illustH = 420 * illustScale;
      const naturalH = this.textures.get(this.illustKey).getSourceImage().height;
      this.add.image(cam.width / 2, cam.height / 2 - 30, this.illustKey)
        .setOrigin(0.5, 0.5)
        .setScale(illustH / naturalH);
    }

    // 대화창(SuspectVNScene과 같은 가죽/청동 톤). 여기서 질문 목록 -> 응답을 보여준다.
    const boxW = cam.width - 80;
    const boxH = 190;
    const boxX = 40;
    const boxY = cam.height - boxH - 20;
    const box = this.add.graphics();
    box.fillStyle(0x2a1f14, 0.95);
    box.fillRoundedRect(boxX, boxY, boxW, boxH, 12);
    box.lineStyle(4, 0xb8860b, 1);
    box.strokeRoundedRect(boxX, boxY, boxW, boxH, 12);

    this.nameText = this.add.text(boxX + 20, boxY + 12, `${this.npcName} 심문`, {
      fontSize: '16px', fill: '#e8b34d', fontStyle: 'bold',
    });
    this.bodyText = this.add.text(boxX + 20, boxY + 40, '', {
      fontSize: '15px', fill: '#f2e6cf', wordWrap: { width: boxW - 40 }, lineSpacing: 6,
    });
    this.hintText = this.add.text(boxX + boxW - 20, boxY + boxH - 22, '', {
      fontSize: '12px', fill: '#cbb994',
    }).setOrigin(1, 0);

    // 화면 우상단에 항상 떠 있는 "나가기" 버튼 - 질문을 몇 개 골랐든 언제든 맵으로
    // 돌아갈 수 있게 한다.
    this.exitButton = this.makeButton(cam.width - 110, 28, 140, 32, '나가기', () => this.exitToMap());

    this.script = SUSPECT_CHOICE_SCRIPTS[this.npcId];
    this.choiceButtons = [];
    this.selectedIndex = 0;
    this.mode = 'list'; // 'list' | 'response'

    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);

    this.showList(boxX, boxY, boxW);
  }

  // 질문 목록을 세로로 늘어놓는다. ↑/↓로 고르고 SPACE/ENTER로 확정한다.
  showList(boxX, boxY, boxW) {
    this.mode = 'list';
    this.choiceButtons.forEach(b => b.container.destroy());
    this.choiceButtons = [];

    const choices = this.script?.choices || [];
    this.bodyText.setText(
      choices.length
        ? (this.script.intro || '무엇을 물어볼까?')
        : `${this.npcName}에게 아직 물어볼 질문이 준비되지 않았다.\n(SUSPECT_CHOICE_SCRIPTS에 내용을 채워주세요)`,
    );

    if (choices.length === 0) {
      this.hintText.setText('[SPACE] 나가기');
      return;
    }

    this.hintText.setText('[↑/↓] 선택  [SPACE] 확정');
    const startY = boxY + 78;
    choices.forEach((choice, i) => {
      const btn = this.makeListItem(boxX + 20, startY + i * 30, boxW - 40, 26, choice.label, () => this.showResponse(i));
      this.choiceButtons.push(btn);
    });
    this.selectedIndex = 0;
    this.refreshListHighlight();
  }

  // 고른 질문의 응답을 보여준다. SPACE로 목록으로 돌아간다.
  showResponse(index) {
    this.mode = 'response';
    this.choiceButtons.forEach(b => b.container.setVisible(false));
    const choice = this.script.choices[index];
    this.bodyText.setText(choice.response || '(응답 내용이 아직 없다)');
    this.hintText.setText('[SPACE] 목록으로');
  }

  exitToMap() {
    this.scene.start('MapScene', {
      mapKey: this.returnMapKey, returnX: this.returnX, returnY: this.returnY,
    });
  }

  // 질문 목록의 항목 하나(가로로 긴 얇은 버튼).
  makeListItem(x, y, w, h, label, onClick) {
    const g = this.add.graphics();
    const text = this.add.text(x + 12, y + h / 2, label, { fontSize: '13px', fill: '#f2e6cf' }).setOrigin(0, 0.5);
    const zone = this.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onClick);
    zone.on('pointerover', () => {
      this.selectedIndex = this.choiceButtons.findIndex(b => b.zone === zone);
      this.refreshListHighlight();
    });
    const container = this.add.container(0, 0, [g, text, zone]);
    return { container, g, x, y, w, h, zone, onClick };
  }

  refreshListHighlight() {
    this.choiceButtons.forEach((btn, i) => {
      const selected = i === this.selectedIndex;
      btn.g.clear();
      btn.g.fillStyle(selected ? 0x3a2c1a : 0x2a1f14, selected ? 0.9 : 0);
      btn.g.fillRoundedRect(btn.x, btn.y, btn.w, btn.h, 6);
      if (selected) {
        btn.g.lineStyle(2, 0xf0c860, 1);
        btn.g.strokeRoundedRect(btn.x, btn.y, btn.w, btn.h, 6);
      }
    });
  }

  // 가죽/청동 톤 버튼(화면 상단 "나가기" 전용).
  makeButton(cx, cy, w, h, label, onClick) {
    const g = this.add.graphics();
    g.fillStyle(0x2a1f14, 0.95);
    g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    g.lineStyle(3, 0xb8860b, 1);
    g.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 8);
    const text = this.add.text(cx, cy, label, { fontSize: '14px', fill: '#f2e6cf' }).setOrigin(0.5);
    const zone = this.add.zone(cx - w / 2, cy - h / 2, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    zone.on('pointerdown', onClick);
    return { container: this.add.container(0, 0, [g, text, zone]), zone };
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.exitToMap();
      return;
    }

    if (this.mode === 'response') {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this.choiceButtons.forEach(b => b.container.setVisible(true));
        this.mode = 'list';
        this.bodyText.setText(this.script.intro || '무엇을 물어볼까?');
        this.hintText.setText('[↑/↓] 선택  [SPACE] 확정');
        this.refreshListHighlight();
      }
      return;
    }

    // mode === 'list'
    if (this.choiceButtons.length === 0) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this.exitToMap();
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.upKey) || Phaser.Input.Keyboard.JustDown(this.downKey)) {
      const dir = Phaser.Input.Keyboard.JustDown(this.downKey) ? 1 : -1;
      this.selectedIndex = (this.selectedIndex + dir + this.choiceButtons.length) % this.choiceButtons.length;
      this.refreshListHighlight();
    }
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.choiceButtons[this.selectedIndex].onClick();
    }
  }
}
