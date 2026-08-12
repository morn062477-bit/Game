// 다빈치코드 대전에서 이겼을 때 들어오는 "심문 선택지" 화면. SuspectVNScene과 같은
// 배경+일러스트 위에, 이번엔 대사가 아니라 여러 질문 중 하나를 골라 물어보고
// 대답을 듣는 시뮬레이션풍 화면이다. 지금은 구조(선택지 목록 UI + 방향키 탐색 +
// 응답 표시 + 나가기)만 만들어뒀고, 실제 질문/응답 내용은 SUSPECT_CHOICE_SCRIPTS에
// 채워 넣으면 된다. 배경/일러스트 이미지는 SuspectVNScene.js의 SUSPECT_VN_ASSETS를
// 그대로 재사용한다.

// 모든 용의자에게 공통으로 던지는 세 가지 고정 질문. 라벨은 공통이고 실제
// 대답(response)만 용의자별로 다르다 - makeChoices()에 순서대로 A/B/C 답을 넣는다.
const CHOICE_LABELS = [
  'A. 전날 밤 무엇을 하고 있었죠?',
  'B. 의심가는 사람은 누구죠?',
  'C. 피해자를 마지막으로 본 게 언제죠?',
];

function makeChoices([answerA, answerB, answerC]) {
  return [
    { label: CHOICE_LABELS[0], response: answerA },
    { label: CHOICE_LABELS[1], response: answerB },
    { label: CHOICE_LABELS[2], response: answerC },
  ];
}

// npc id -> { intro, choices }.
const SUSPECT_CHOICE_SCRIPTS = {
  wife: {
    intro: '무엇을 물어볼까?',
    choices: makeChoices([
      '저는 평소에 마을 밖을 밤에 돌아다닌 적이 없어서... 평소 일을 남편에게 맡겨서 숲이랑 논밭도 어떻게 가는지 몰라요...',
      '사냥꾼이 그런 거 같아요. 저희 집사람이 발견되었을 때, 목이 잘려있었다고 해요. 그 사냥꾼 분은 활과 화살, 그리고 낫까지 들고 있으니 순식간에 죽이고 목을 잘라버린 거 아닐까요?',
      '낮에 마을 어귀에서 잠깐 마주쳤던 게 마지막이었어요. 별다른 얘기는 안 나눴고, 그냥 인사만 하고 지나쳤죠.',
    ]),
  },
  hunter: {
    intro: '무엇을 물어볼까?',
    choices: makeChoices([
      '숲에 설치한 덫을 점검하고 있었어. 시간이 굉장히 오래 걸리는 작업이라 다른 걸 할 시간도 없었지.',
      '난 화가 녀석이 수상해. 오늘 화가 녀석이 숲에 그림을 그리러 와서 잠깐 봤는데 피가 묻은 수건을 들고 있더군, 빨간 물감이 묻은 거 아니냐고?\n(몇 초 지나고) .................. 그럴지도 모르지.',
      '평소 숲 근처만 돌아다니다보니 이장을 보는 일은 흔치 않아. 마지막으로 본 건 일주일 전이군.',
    ]),
  },
  farmer: {
    intro: '무엇을 물어볼까?',
    choices: makeChoices([
      '늦게까지 논에서 일하고 바로 집에 갔어요. 집에 딸아이가 있어서요.',
      '이장부인이요. 평소에 외도를 하고 있다는 소문이 돌기도 하고요, 최근에는 밤에 크게 싸운 적도 있다고 하더군요.',
      '어제 저물녘에 얼핏 본 게 마지막이었을 거예요. 이장댁 쪽으로 걸어가고 있었거든요.',
    ]),
  },
  painter: {
    intro: '무엇을 물어볼까?',
    choices: makeChoices([
      '그림을 그리고 있었죠. 전 외지인이라 평소 주위에서 반겨주는 사람이 별로 없어요.',
      '의심가는 사람이요? 어부인 거 같네요. 발견된 시체는 머리 부분만 있었다고 들었어요. 그럼 몸통부분을 어딘가 숨겨놓았다는 건데, 항구에 있는 바다에 숨겨놓았을 가능성도 있지 않을까요?',
      '이곳에 처음 왔을 때 말곤 본 기억이 없네요.',
    ]),
  },
  fisher: {
    intro: '무엇을 물어볼까?',
    choices: makeChoices([
      '배에서 그물 손질을 하고 있었지. 아침에 쓸 그물을 미리 정리해두는 편이야.',
      '난 농부가 의심스럽군. 어젯밤에 나에게 밧줄을 빌려갔는데, 밧줄의 길이가 줄어들어 있더군. 밧줄을 사용해서 할 수 있는 일은 많거든.',
      '이장을 마지막으로 본 게... 사흘 전 포구에서였을 거야. 그물값을 물어보러 왔었지.',
    ]),
  },
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
    if (choices.length === 0) {
      this.bodyText.setText(`${this.npcName}에게 아직 물어볼 질문이 준비되지 않았다.\n(SUSPECT_CHOICE_SCRIPTS에 내용을 채워주세요)`);
      this.hintText.setText('[SPACE] 나가기');
      return;
    }

    // =============================================
    // 이미 선택한 질문이 있는지 세이브 데이터에서 확인
    // =============================================

    const suspectProgress =
        window.GameSave?.state?.data?.suspects?.[this.npcId];

    const lockedIndex =
        suspectProgress?.selectedQuestion;

    if (lockedIndex != null) {
        this.showResponse(lockedIndex);
        return;
    }

    this.bodyText.setText(this.script.intro || '무엇을 물어볼까?');
    this.hintText.setText('[↑/↓] 선택  [SPACE] 확정');
    const startY = boxY + 78;
    choices.forEach((choice, i) => {
      const btn = this.makeListItem(boxX + 20, startY + i * 30, boxW - 40, 26, choice.label, () => this.showResponse(i));
      this.choiceButtons.push(btn);
    });
    this.selectedIndex = 0;
    this.refreshListHighlight();
  }

  async showResponse(index) {
      this.mode = 'response';

      this.choiceButtons.forEach(
          b => b.container.setVisible(false)
      );

      const choice = this.script.choices[index];

      this.bodyText.setText(
          choice.response || '(응답 내용이 아직 없다)'
      );

      this.hintText.setText('[SPACE] 나가기');

      // =============================================
      // 현재 용의자의 세이브 진행도 가져오기
      // =============================================

      const save =
          window.GameSave?.state?.data;

      const suspectProgress =
          save?.suspects?.[this.npcId];

      if (!save || !suspectProgress) {
          console.warn(
              `[조사 진행] 세이브에 없는 용의자 ID: ${this.npcId}`
          );
          return;
      }

      // =============================================
      // 처음 질문을 선택했을 때만 조사 완료 처리
      // =============================================

      if (suspectProgress.selectedQuestion == null) {

          // 어떤 질문을 골랐는지 저장
          suspectProgress.selectedQuestion = index;

          // 이 용의자의 조사를 완료한 것으로 처리
          suspectProgress.clueObtained = true;

          console.log(
              `[조사 진행] ${this.npcId} 조사 완료`,
              {
                  selectedQuestion: index,
                  clueObtained: true
              }
          );

          // =============================================
          // 용의자 5명 조사가 모두 끝났는지 확인
          // =============================================

          const suspectIds = [
              'wife',
              'hunter',
              'farmer',
              'painter',
              'fisher'
          ];

          const allInvestigated =
              suspectIds.every((id) =>
                  save.suspects[id]?.clueObtained === true
              );

          if (allInvestigated) {
              save.finalDeductionUnlocked = true;

              save.story.phase = 'final_gather';

              console.log(
                  '[조사 진행] 용의자 5명 조사 완료 → 최종 추리 조건 충족'
              );
          }

          // =============================================
          // Supabase에 저장
          // =============================================

          try {
              await window.GameSave.saveGame();

              console.log(
                  `[조사 진행] ${this.npcId} 질문/단서 저장 완료`
              );
          } catch (error) {
              console.error(
                  `[조사 진행] ${this.npcId} 저장 실패`,
                  error
              );
          }
      }
  }

  exitToMap() {
      const save =
          window.GameSave?.state?.data;

      // =============================================
      // 용의자 5명 조사 완료 후 최종 집합 이벤트 시작
      // =============================================
      const shouldStartFinalGather =
          save?.finalDeductionUnlocked === true &&
          save?.story?.phase === 'final_gather' &&
          save?.story?.finalGatherPlayed === false;

      if (shouldStartFinalGather) {

          // 중복 입력 방지
          this.input.enabled = false;

          // 화면을 검게 암전
          this.cameras.main.fadeOut(
              300,
              0,
              0,
              0
          );

          this.cameras.main.once(
              Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
              () => {
                  this.scene.start('MapScene', {
                      mapKey: 'map_01_village',

                      // MapScene에서
                      // "최종 집합 이벤트로 들어온 것"임을 알기 위한 값
                      endingGather: true
                  });
              }
          );

          return;
      }

      // =============================================
      // 평소 조사 종료
      // 기존 위치로 복귀
      // =============================================
      this.scene.start('MapScene', {
          mapKey: this.returnMapKey,
          returnX: this.returnX,
          returnY: this.returnY,
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
      // 이미 질문 하나를 골랐으면 더 고를 수 있는 다른 질문이 없으므로, 응답
      // 화면에서 SPACE/ENTER는 목록으로 돌아가지 않고 바로 나간다.
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || Phaser.Input.Keyboard.JustDown(this.enterKey)) {
        this.exitToMap();
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
