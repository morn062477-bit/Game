const ENDING_STORY_ROUTES = {
  bad: {
    lines: [
      ['탐정', '저의 결론은 정해졌습니다. 당신이 범인입니다.'],
      ['내레이션', '사건은 지목된 사람을 중심으로 종결되었다.'],
      ['내레이션', '하지만 이장의 몸통은 끝내 발견되지 않았다.'],
      ['내레이션', '시간이 흐른 뒤, 농부는 아무도 없는 곳에서 조용히 손을 씻었다.'],
    ], ending: ['BAD END', '「진실은 묻혔다」'], endingValue: 'bad',
  },
  farmerConfrontation: {
    lines: [
      ['탐정', '농부와 이장의 갈등만으로 당신을 지목한 것이 아닙니다.'],
      ['탐정', '사건 당일, 농지 전체 수용이 확정됐습니다.'],
      ['탐정', '어부에게서 굵은 밧줄을 빌린 기록도 있습니다.'],
      ['탐정', '딸이 먼저 집에 간 뒤 당신의 알리바이에는 공백이 생겼습니다.'],
      ['탐정', '딸에게서 이장 부부가 숲으로 갔다는 말을 들었지요. 이장이 혼자 남을 것도 알았습니다.'],
      ['탐정', '그리고 당신의 랜턴도 사건의 흐름과 연결됩니다.'],
      ['농부', '……그만하십시오.'], ['탐정', '이장을 만났습니까?'], ['농부', '그만!'],
      ['내레이션', '농부가 갑자기 자리에서 뛰쳐나간다.'], ['사냥꾼', '야!'], ['탐정', '농부!'],
    ], next: 'forest',
  },
  forestDiscovery: {
    lines: [
      ['탐정', '……이쪽에 길이 있었나?'],
      ['내레이션', '나무와 수풀 사이로 좁은 길이 이어져 있다. 그러나 안쪽에는 빛이 전혀 들지 않는다.'],
      ['탐정', '농부의 랜턴…… 스위치를 눌러도 불이 들어오지 않는다.'],
      ['탐정', '농부는 이 랜턴이 고장났다고 했다.'],
      ['내레이션', '마지막 조사에서 확보한 배터리를 끼워 넣었다.'],
      ['탐정', '……고장난 게 아니었군.'], ['탐정', '배터리가 다 된 것뿐이야.'],
      ['내레이션', '랜턴 불빛이 숨겨진 숲길을 드러냈다.'],
    ], next: 'forestUnlocked',
  },
  bodyConfession: {
    lines: [
      ['내레이션', '오래된 폐쇄 구역. 무너진 돌담과 버려진 개발 표지판이 보인다.'],
      ['내레이션', '풀숲 속에는 머리가 없는 이장의 몸통이 놓여 있다.'],
      ['탐정', '……이장.'],
      ['내레이션', '주변에는 시신을 끌고 온 흔적과 몸에 남은 밧줄 자국이 선명하다.'],
      ['농부', '결국 여기까지 오셨군요.'],
      ['농부', '사건 전날까지 이장은 농지 문제를 계속 협의 중이라고 했습니다.'],
      ['농부', '하지만 사건 당일, 외부 업체와 계약이 끝났고 농지를 전부 수용한다고 통보했지요.'],
      ['농부', '처음부터 죽이려 한 것은 아니었습니다. 딸에게 이장 부부가 숲으로 갔다는 말을 들었고, 한 번 더 만나야겠다고 생각했습니다.'],
      ['농부', '숲길 근처에 있던 사냥꾼의 작업용 낫을 들고 갔습니다.'],
      ['농부', '범행 뒤에는 어부에게 빌린 밧줄로 시신을 묶어 끌었습니다.'],
      ['농부', '랜턴으로 숨겨진 길을 지나 몸통은 이 폐쇄 구역에 숨겼습니다.'],
      ['농부', '머리는…… 마을 광장의 초대 이장 동상에 두었습니다.'],
    ], next: 'endingBranch',
  },
  normal: {
    lines: [
      ['내레이션', '농부는 체포됐고, 폐쇄 구역의 시신도 수습됐다.'],
      ['탐정', '범인은 농부. 낫으로 살해하고, 빌린 밧줄로 시신을 옮겼다. 랜턴으로 폐쇄 구역까지 들어갔지.'],
      ['탐정', '하지만 농부가 피를 닦는 데 이 수건을 사용했다면…….'],
      ['탐정', '왜 이 물건이 다시 화가에게 있었던 거지?'],
    ], ending: ['NORMAL END', '「범인은 밝혀졌다」'], endingValue: 'normal',
  },
  true: {
    lines: [
      ['탐정', '농부는 당신에게서 빌린 수건으로 피를 닦고 돌려줬습니다.'],
      ['탐정', '당신은 이장의 죽음과 농부의 상태를 보고 얼룩의 정체를 알아챘습니다.'],
      ['탐정', '그리고 수건에 남은 흔적을 감추려고 일부러 붉은 물감을 덧칠했습니다.'],
      ['화가', '……맞아요. 농부는 제가 처음 이 마을에 왔을 때 유일하게 저를 챙겨준 사람이었어요.'],
      ['화가', '그 사람을 감싸고 싶었습니다. 그래서 흔적을 숨겼습니다.'],
      ['탐정', '범인을 찾는 것과 그날 있었던 모든 일을 밝히는 것은 전혀 다른 일이었습니다. 이번에는…… 둘 다 찾았습니다.'],
      ['수녀', '그렇다면 이제 이 마을도 그 진실을 안고 살아가야겠군요.'],
      ['탐정', '그건 제가 해결할 수 있는 문제가 아니겠죠.'], ['수녀', '예. 그건 남은 사람들의 몫입니다.'],
    ], ending: ['TRUE END', '「모든 진실」'], endingValue: 'true',
  },
};

class EndingStoryScene extends Phaser.Scene {
  constructor() { super('EndingStoryScene'); }
  init(data) { this.route = data.route; }

  create() {
    this.scale.resize(960, 540);
    this.cameras.main.setBackgroundColor('#080706');
    this.script = ENDING_STORY_ROUTES[this.route] || ENDING_STORY_ROUTES.bad;
    this.index = 0;
    this.finished = false;
    this.add.rectangle(480, 270, 960, 540, 0x080706);
    this.add.rectangle(480, 430, 920, 185, 0x14100d, 0.98).setStrokeStyle(2, 0x9d7442);
    this.nameText = this.add.text(55, 358, '', { fontFamily: 'Galmuri11, sans-serif', fontSize: '19px', color: '#e9c77b' });
    this.bodyText = this.add.text(55, 397, '', {
      fontFamily: 'Galmuri11, sans-serif', fontSize: '17px', color: '#f1eadf', wordWrap: { width: 850 }, lineSpacing: 7,
    });
    this.hintText = this.add.text(900, 505, '[SPACE / ENTER]', { fontFamily: 'Galmuri11, sans-serif', fontSize: '12px', color: '#998b78' }).setOrigin(1);
    this.input.keyboard.on('keydown-SPACE', () => this.advance());
    this.input.keyboard.on('keydown-ENTER', () => this.advance());
    this.input.on('pointerdown', () => this.advance());
    if (this.route === 'bodyConfession') {
      const save = window.GameSave?.state?.data;
      if (save) {
        save.story.bodyFound = true;
        save.story.phase = 'confession';
        this.safeSave();
      }
    }
    this.showLine();
  }

  showLine() {
    const [speaker, text] = this.script.lines[this.index];
    this.nameText.setText(`[${speaker}]`);
    this.bodyText.setText(text);
  }

  advance() {
    if (this.finished) return;
    this.index += 1;
    if (this.index < this.script.lines.length) { this.showLine(); return; }
    this.finishRoute();
  }

  async finishRoute() {
    if (this.finished) return;
    this.finished = true;
    const save = window.GameSave?.state?.data;
    if (!save) return;

    if (this.script.endingValue) {
      save.ending = this.script.endingValue;
      save.story.phase = 'ending';
      await this.safeSave();
      this.showEndingTitle(this.script.ending);
      return;
    }
    if (this.script.next === 'forest') {
      save.story.phase = 'farmer_escape';
      save.story.farmerLantern = 'dead';
      save.story.batteryObtained = true;
      await this.safeSave();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('MapScene', { mapKey: 'map_02_forest', storyEvent: 'forestDiscovery' });
      });
      return;
    }
    if (this.script.next === 'forestUnlocked') {
      save.story.farmerLantern = 'lit';
      await this.safeSave();
      save.story.hiddenForestUnlocked = true;
      save.story.phase = 'hidden_forest';
      await this.safeSave();
      this.scene.start('MapScene', { mapKey: 'map_02_forest' });
      return;
    }
    if (this.script.next === 'endingBranch') {
      save.story.bodyFound = true;
      save.story.phase = 'confession';
      await this.safeSave();
      const evidence = save.story.painterCoverup;
      const trueEvidence = evidence && Object.values(evidence).every((value) => value === true);
      const helperCorrect = save.finalDeduction?.coverupHelper === 'painter';
      this.scene.start('EndingStoryScene', { route: trueEvidence && helperCorrect ? 'true' : 'normal' });
    }
  }

  async safeSave() {
    try { await window.GameSave.saveGame(); } catch (error) { console.error(`[엔딩:${this.route}] 저장 실패:`, error); }
  }

  showEndingTitle([title, subtitle]) {
    this.children.removeAll(true);
    this.add.text(480, 225, title, { fontFamily: 'Galmuri11, sans-serif', fontSize: '44px', color: '#d9b66f' }).setOrigin(0.5);
    this.add.text(480, 300, subtitle, { fontFamily: 'Galmuri11, sans-serif', fontSize: '23px', color: '#f1eadf' }).setOrigin(0.5);
  }
}
