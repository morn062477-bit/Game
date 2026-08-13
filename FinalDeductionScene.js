const FINAL_DEDUCTION_STEPS = [
  { key: 'culprit', title: '1. 범인', options: [
    ['farmer', '농부'], ['wife', '이장 부인'], ['hunter', '사냥꾼'], ['painter', '화가'], ['fisher', '어부'],
  ] },
  { key: 'weapon', title: '2. 살해 도구', options: [
    ['hunterSickle', '사냥꾼의 작업용 낫'], ['fishingKnife', '어부의 칼'], ['stone', '숲의 돌'], ['poison', '독약'],
  ] },
  { key: 'motive', title: '3. 범행 동기', options: [
    ['landDevelopment', '농지 강제 수용과 개발 문제'], ['debt', '빚 문제'], ['revenge', '개인적인 복수'], ['inheritance', '유산 문제'],
  ] },
  { key: 'transport', title: '4. 시체 운반 수단/도구', options: [
    ['rope', '어부에게 빌린 굵은 밧줄'], ['boat', '호수의 배'], ['cart', '농장 수레'], ['bareHands', '직접 운반'],
  ] },
  { key: 'disposal', title: '5. 시체 유기 장소', options: [
    ['hiddenForest', '숨겨진 숲길 끝 폐쇄 구역'], ['lake', '호수'], ['farm', '농장'], ['port', '항구 창고'],
  ] },
  { key: 'coverupItem', title: '6. 피를 닦고 흔적을 숨기는 데 사용한 물건', options: [
    ['painterTowel', '화가에게 빌린 수건'], ['lantern', '농부의 랜턴'], ['coat', '낡은 외투'], ['none', '사용한 물건 없음'],
  ] },
  { key: 'coverupHelper', title: '7. 범행 은폐를 도운 사람', options: [
    ['painter', '화가'], ['wife', '이장 부인'], ['hunter', '사냥꾼'], ['fisher', '어부'], ['none', '없음'],
  ] },
];

class FinalDeductionScene extends Phaser.Scene {
  constructor() { super('FinalDeductionScene'); }

  create() {
    this.scale.resize(960, 540);
    this.answers = {};
    this.stepIndex = 0;
    this.selectedIndex = 0;
    this.optionObjects = [];
    this.cameras.main.setBackgroundColor('#090807');

    this.add.rectangle(480, 270, 900, 490, 0x17120e, 0.98).setStrokeStyle(3, 0xb8864b);
    this.add.text(480, 38, '최종 추리', {
      fontFamily: 'Galmuri11, sans-serif', fontSize: '30px', color: '#e9c77b', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.titleText = this.add.text(90, 92, '', { fontFamily: 'Galmuri11, sans-serif', fontSize: '20px', color: '#ffffff' });
    this.helpText = this.add.text(870, 98, '↑↓ 선택  SPACE/ENTER 확인', {
      fontFamily: 'Galmuri11, sans-serif', fontSize: '12px', color: '#a9987d',
    }).setOrigin(1, 0);
    this.messageText = this.add.text(480, 470, '', {
      fontFamily: 'Galmuri11, sans-serif', fontSize: '15px', color: '#e9b0a2', align: 'center',
    }).setOrigin(0.5);

    this.keys = this.input.keyboard.addKeys({ up: 'UP', down: 'DOWN', space: 'SPACE', enter: 'ENTER' });
    this.input.keyboard.on('keydown-UP', () => this.moveSelection(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(1));
    this.input.keyboard.on('keydown-SPACE', () => this.confirmSelection());
    this.input.keyboard.on('keydown-ENTER', () => this.confirmSelection());
    this.showStep();
  }

  clearOptions() {
    this.optionObjects.forEach((item) => item.destroy());
    this.optionObjects = [];
  }

  showStep(message = '') {
    this.clearOptions();
    this.mode = 'select';
    this.selectedIndex = 0;
    const step = FINAL_DEDUCTION_STEPS[this.stepIndex];
    this.titleText.setText(step.title);
    this.helpText.setVisible(true);
    this.messageText.setText(message);
    step.options.forEach((option, index) => {
      const text = this.add.text(130, 142 + index * 54, option[1], {
        fontFamily: 'Galmuri11, sans-serif', fontSize: '17px', color: '#d8cbb8',
        backgroundColor: '#241d17', padding: { x: 18, y: 11 }, fixedWidth: 700,
      }).setInteractive({ useHandCursor: true });
      text.on('pointerover', () => { this.selectedIndex = index; this.refreshSelection(); });
      text.on('pointerdown', () => { this.selectedIndex = index; this.confirmSelection(); });
      this.optionObjects.push(text);
    });
    this.refreshSelection();
  }

  moveSelection(delta) {
    if (this.mode === 'summary') {
      this.selectedIndex = (this.selectedIndex + delta + this.summaryButtons.length) % this.summaryButtons.length;
      this.refreshSummarySelection();
      return;
    }
    if (this.mode !== 'select') return;
    const count = FINAL_DEDUCTION_STEPS[this.stepIndex].options.length;
    this.selectedIndex = (this.selectedIndex + delta + count) % count;
    this.refreshSelection();
  }

  refreshSelection() {
    this.optionObjects.forEach((text, index) => text.setStyle({
      color: index === this.selectedIndex ? '#ffffff' : '#d8cbb8',
      backgroundColor: index === this.selectedIndex ? '#765127' : '#241d17',
    }));
  }

  confirmSelection() {
    if (this.mode === 'summary') {
      this.summaryActions[this.selectedIndex]();
      return;
    }
    if (this.mode !== 'select') return;
    const step = FINAL_DEDUCTION_STEPS[this.stepIndex];
    const [value, label] = step.options[this.selectedIndex];
    this.answers[step.key] = value;
    this.answers[`${step.key}Label`] = label;
    if (this.stepIndex < FINAL_DEDUCTION_STEPS.length - 1) {
      this.stepIndex += 1;
      this.showStep();
    } else {
      this.showSummary();
    }
  }

  makeButton(x, y, label, callback) {
    const button = this.add.text(x, y, label, {
      fontFamily: 'Galmuri11, sans-serif', fontSize: '16px', color: '#f2e6cf',
      backgroundColor: '#50371f', padding: { x: 18, y: 12 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setStyle({ backgroundColor: '#8a6231' }));
    button.on('pointerout', () => button.setStyle({ backgroundColor: '#50371f' }));
    button.on('pointerdown', callback);
    this.optionObjects.push(button);
  }

  showSummary() {
    this.clearOptions();
    this.mode = 'summary';
    this.titleText.setText('추리 확인');
    this.helpText.setVisible(false);
    this.messageText.setText('');
    const a = this.answers;
    const helperSentence = a.coverupHelper === 'none'
      ? '범행 은폐를 도운 인물은 없다고 판단합니다.'
      : `또한 ${a.coverupHelperLabel}는 ${a.coverupItemLabel}의 흔적을 알고도 이를 감추어 사건의 진실을 은폐하는 데 일조했습니다.`;
    const summary = [
      `범인은 ${a.culpritLabel}입니다.`,
      `범인은 ${a.motiveLabel}로 인해 격한 감정을 품고 ${a.weaponLabel}을 사용해 이장을 살해했습니다.`,
      `이후 ${a.coverupItemLabel}(으)로 범행 흔적을 감추고, ${a.transportLabel}을 이용해 시신을 옮겼습니다.`,
      `고쳐진 농부의 랜턴으로 길을 밝혀 시신을 ${a.disposalLabel}에 유기했습니다.`,
      helperSentence,
    ].join('\n\n');
    const body = this.add.text(100, 125, summary, {
      fontFamily: 'Galmuri11, sans-serif', fontSize: '17px', color: '#eee5d4',
      wordWrap: { width: 760 }, lineSpacing: 6,
    });
    this.optionObjects.push(body);
    this.selectedIndex = 0;
    this.summaryButtons = [];
    this.summaryActions = [() => this.submitDeduction(), () => {
      this.answers = {}; this.stepIndex = 0; this.showStep();
    }];
    this.makeButton(335, 485, '이 추리로 지목한다', this.summaryActions[0]);
    this.makeButton(625, 485, '다시 선택한다', this.summaryActions[1]);
    this.summaryButtons = this.optionObjects.slice(-2);
    this.summaryButtons.forEach((button, index) => button.on('pointerover', () => {
      this.selectedIndex = index;
      this.refreshSummarySelection();
    }));
    this.refreshSummarySelection();
  }

  refreshSummarySelection() {
    this.summaryButtons.forEach((button, index) => button.setStyle({
      backgroundColor: index === this.selectedIndex ? '#8a6231' : '#50371f',
    }));
  }

  async submitDeduction() {
    if (this.mode !== 'summary') return;
    this.mode = 'saving';
    const save = window.GameSave?.state?.data;
    if (!save) return;
    save.finalDeduction = { ...this.answers };
    try { await window.GameSave.saveGame(); } catch (error) { console.error('[최종 추리] 저장 실패:', error); }

    if (this.answers.culprit !== 'farmer') {
      this.scene.start('EndingStoryScene', { route: 'bad', deduction: this.answers });
      return;
    }
    // 범인을 농부로 맞혔다면 나머지 단서가 틀려도 선택 화면으로 되돌리지 않는다.
    // 이후 공통 추적/자백 장면을 모두 보여주고, 정확도에 따라 Normal/True만 나눈다.
    this.scene.start('EndingStoryScene', { route: 'farmerConfrontation' });
  }
}
