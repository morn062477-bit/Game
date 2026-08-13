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
      ['탐정', '범인은 농부입니다.'],
      ['내레이션', '방 안이 조용해진다.'],
      ['어부', '……농부가?'],
      ['이장 부인', '정말인가요?'],
      ['내레이션', '화가는 아무 말도 하지 못한 채 농부를 바라본다.'],
      ['농부', '근거가 있습니까?\n제가 이장과 사이가 좋지 않았다는 이유라면 여기 있는 누구에게나 똑같이 적용될 텐데요.'],
      ['탐정', '맞습니다. 당신이 이장을 미워했다는 사실만으로 당신을 범인이라 생각한 것은 아닙니다.'],
      ['탐정', '사건이 있기 전까지 당신과 이장의 갈등은 다른 용의자들과 크게 다르지 않았습니다.'],
      ['탐정', '하지만 사건 당일 상황이 달라졌습니다.'],
      ['탐정', '당신은 그날 이장에게 토지 수용이 최종 확정되었다는 통보를 받았습니다.'],
      ['탐정', '그 전날까지 협의 중이라고 믿었던 땅이 그날 갑자기 사라지게 된 겁니다.'],
      ['농부', '그건 동기일 뿐입니다.'],
      ['탐정', '맞습니다. 그래서 다른 것들도 확인했습니다.'],
      ['탐정', '어부의 장부에는 당신이 굵은 밧줄을 빌려간 기록이 있습니다. 반환 기록은 없습니다.'],
      ['농부', '농사짓는 사람이 밧줄을 빌리는 게 이상합니까?'],
      ['탐정', '그것도 이상하지 않습니다. 그리고 당신이 사건 당일 저녁까지 밭에서 일했다는 것도 사실입니다. 당신 딸이 확인했습니다.'],
      ['농부', '그렇다면…….'],
      ['탐정', '하지만 딸이 먼저 집으로 돌아간 뒤 당신의 행적을 증명하는 사람은 없습니다.'],
      ['탐정', '당신은 일을 끝낸 뒤 곧바로 집에 갔다고 말했지만 그걸 본 사람은 아무도 없습니다.'],
      ['탐정', '그리고 더 중요한 사실이 하나 있습니다. 당신은 사건 당시 이장이 어디에 있는지도 알고 있었습니다.'],
      ['농부', '…….'],
      ['탐정', '당신 딸은 이장 부인과 이장이 차례로 숲으로 가는 모습을 봤습니다. 그리고 그 이야기를 밭에 있던 당신에게 직접 말했습니다.'],
      ['탐정', '이장 부인은 숲에서 이장과 다툰 뒤 먼저 돌아왔습니다.'],
      ['탐정', '그러니까 그 순간 당신은 알고 있었던 겁니다. 이장이 혼자 숲에 남아 있다는 사실을.'],
      ['농부', '……그것만으로 제가 죽였다는 겁니까?'],
      ['탐정', '아닙니다. 밧줄. 사건 당일 갑자기 생긴 동기. 알리바이의 공백. 이장의 위치를 알고 있었다는 사실. 그리고 당신의 랜턴.'],
      ['탐정', '하나씩 떼어놓고 보면 어느 것도 완전한 증거가 아닙니다.'],
      ['탐정', '하지만 사건 전체를 하나의 흐름으로 놓고 보면 계속 같은 사람에게 돌아옵니다.'],
      ['농부', '…….'],
      ['탐정', '사건 당일 밤. 당신은 숲으로 갔습니까?'],
      ['농부', '…….'],
      ['탐정', '농부.'],
      ['농부', '……그만하십시오.'],
      ['탐정', '이장을 만났습니까?'],
      ['농부', '그만!'],
      ['내레이션', '농부가 갑자기 의자를 밀치고 일어난다.'],
      ['사냥꾼', '야!'],
      ['내레이션', '농부가 회관 밖으로 뛰쳐나간다.'],
      ['탐정', '농부!'],
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

const ENDING_IMAGE_BY_ROUTE = {
  bad: 'ending-bad',
  normal: 'ending-normal',
  true: 'ending-true',
};

// 화자 이름 -> asset/davinci의 용의자 초상화 키. 다빈치코드 대전 상대 초상화와
// 같은 그림을 재사용해서 "이 사람이 누구인지" 한눈에 알아보게 한다.
const SPEAKER_TO_DAVINCI_ID = {
  '농부': 'farmer',
  '어부': 'fisher',
  '사냥꾼': 'hunter',
  '화가': 'painter',
  '이장 부인': 'wife',
};

class EndingStoryScene extends Phaser.Scene {
  constructor() { super('EndingStoryScene'); }
  init(data) { this.route = data.route; }

  preload() {
    const v = Date.now();
    this.load.image('ending-bad', `asset/endings/bad-ending.png?v=${v}`);
    this.load.image('ending-normal', `asset/endings/normal-ending.png?v=${v}`);
    this.load.image('ending-true', `asset/endings/true-ending.png?v=${v}`);
    this.load.image('farmer-confession', `asset/endings/farmer-confession.png?v=${v}`);
    // 대화창 옆 초상화: 용의자는 다빈치코드에서 쓰는 asset/davinci 그림을 그대로,
    // 탐정은 마을 기본 대화창과 같은 전용 일러스트를 쓴다.
    Object.values(SPEAKER_TO_DAVINCI_ID).forEach((id) => {
      this.load.image(`davinci-${id}`, `asset/davinci/${id}.png?v=${v}`);
    });
    this.load.image('dialogue-ill-탐정', `asset/characters/대화창 일러스트/detective_ill_transparent_v2.png?v=${v}`);
  }

  create() {
    this.scale.resize(960, 540);
    this.cameras.main.setBackgroundColor('#080706');
    this.script = ENDING_STORY_ROUTES[this.route] || ENDING_STORY_ROUTES.bad;
    this.index = 0;
    this.finished = false;
    this.add.rectangle(480, 270, 960, 540, 0x080706);
    if (this.route === 'bodyConfession' && this.textures.exists('farmer-confession')) {
      const sceneImage = this.add.image(480, 270, 'farmer-confession').setOrigin(0.5);
      sceneImage.setScale(Math.max(960 / sceneImage.width, 540 / sceneImage.height));
    }

    // 마을 기본 NPC 대화창과 같은 레이아웃/색(가죽색 배경 + 금색 테두리, 왼쪽에
    // 정사각형 초상화, "[이름]" 이름표, 하단 중앙 ▼)으로 통일했다 - 예전엔 여기만
    // 다른 색(진한 남색조) 대화창을 따로 쓰고 있었다.
    const dialogBoxW = 960;
    const dialogBoxH = 170;
    const dialogBoxX = 0;
    const dialogBoxY = 540 - dialogBoxH;
    const DIALOG_FILL = 0x2a1f14;
    const DIALOG_BORDER = 0xb8860b;
    const portraitSize = dialogBoxH;
    const textStartX = portraitSize + 24;

    const box = this.add.graphics();
    box.fillStyle(DIALOG_FILL, 0.95);
    box.fillRect(dialogBoxX, dialogBoxY, dialogBoxW, dialogBoxH);
    box.lineStyle(3, DIALOG_BORDER, 1);
    box.lineBetween(dialogBoxX, dialogBoxY, dialogBoxX + dialogBoxW, dialogBoxY);

    this.portraitSize = portraitSize;
    const portraitBg = this.add.graphics();
    portraitBg.fillStyle(DIALOG_FILL, 0.95);
    portraitBg.fillRect(0, dialogBoxY, portraitSize, portraitSize);
    portraitBg.lineStyle(3, DIALOG_BORDER, 1);
    portraitBg.strokeRect(0, dialogBoxY, portraitSize, portraitSize);
    this.portraitImage = this.add.image(portraitSize / 2, dialogBoxY + portraitSize / 2, 'dialogue-ill-탐정')
      .setVisible(false);

    this.nameText = this.add.text(textStartX, dialogBoxY + 16, '', {
      fontFamily: 'Galmuri11, sans-serif', fontSize: '17px', color: '#e8b34d', fontStyle: 'bold',
    });
    this.bodyText = this.add.text(textStartX, dialogBoxY + 48, '', {
      fontFamily: 'Galmuri11, sans-serif', fontSize: '16px', color: '#f2e6cf',
      wordWrap: { width: dialogBoxW - 20 - textStartX }, lineSpacing: 8,
    });
    this.hintText = this.add.text(dialogBoxX + dialogBoxW / 2, dialogBoxY + dialogBoxH - 14, '▼', {
      fontFamily: 'Galmuri11, sans-serif', fontSize: '16px', color: '#e8b34d',
    }).setOrigin(0.5, 1);

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

    // 화자에 맞는 초상화로 바꾼다 - 탐정은 전용 일러스트, 용의자는 asset/davinci
    // 그림, 그 외(내레이션 등)는 초상화 없이 숨긴다.
    const davinciId = SPEAKER_TO_DAVINCI_ID[speaker];
    const texKey = speaker === '탐정' ? 'dialogue-ill-탐정' : (davinciId ? `davinci-${davinciId}` : null);
    if (texKey && this.textures.exists(texKey)) {
      this.portraitImage.setTexture(texKey).setVisible(true);
      const src = this.portraitImage;
      this.portraitImage.setScale(this.portraitSize / Math.max(src.width, src.height));
    } else {
      this.portraitImage.setVisible(false);
    }
  }

  advance() {
    // 엔딩 타이틀까지 다 본 뒤 한 번 더 입력하면, 새 게임/이어하기를 고르는
    // 세이브 화면으로 돌아간다.
    if (this.endingTitleShown) { this.returnToSaveScreen(); return; }
    if (this.finished) return;
    this.index += 1;
    if (this.index < this.script.lines.length) { this.showLine(); return; }
    this.finishRoute();
  }

  returnToSaveScreen() {
    if (this.returning) return;
    this.returning = true;
    window.showSaveScreen?.();
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
      this.replaceRewardClue(save, '농부의 랜턴', '고장난 농부의 랜턴');
      await this.safeSave();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        // 농부가 달아난 뒤 마을에서 조작권을 돌려준다. 플레이어가 북쪽 숲 출구로
        // 직접 쫓아가면 MapScene의 farmer_escape 전용 포탈이 숲 장면을 시작한다.
        this.scene.start('MapScene', { mapKey: 'map_01_village' });
      });
      return;
    }
    if (this.script.next === 'forestUnlocked') {
      save.story.farmerLantern = 'lit';
      save.story.hiddenForestUnlocked = true;
      save.story.phase = 'hidden_forest';
      this.replaceRewardClue(save, '고장난 농부의 랜턴', '고쳐진 농부의 랜턴');
      await this.safeSave();
      // 랜턴 수리 뒤 숲 맵으로 돌아가 탐정이 숨겨진 입구까지 실제로 걸어가는
      // 컷신을 보여준 다음 시체 맵으로 전환한다.
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('MapScene', { mapKey: 'map_02_forest', storyEvent: 'walkToHiddenForest' });
      });
      return;
    }
    if (this.script.next === 'endingBranch') {
      save.story.bodyFound = true;
      save.story.phase = 'confession';
      await this.safeSave();
      // 히든(TRUE) 엔딩도 노말 엔딩과 똑같이 농부 자백까지 진행한 뒤 분기한다.
      // 예전에는 일반 시민 대화에서만 채워지는 painterCoverup 4종을 전부 요구해
      // 최종 추리를 정확히 맞혀도 히든 엔딩에 진입하지 못하는 경우가 있었다.
      // 모든 범행 단서와 화가의 은폐까지 전부 맞혀야 히든(TRUE) 엔딩이다.
      // 범인만 농부로 맞히고 나머지 중 하나라도 틀리면 공통 장면 뒤 Normal로 간다.
      const deduction = save.finalDeduction;
      const perfectDeduction = deduction?.culprit === 'farmer'
        && deduction?.weapon === 'hunterSickle'
        && deduction?.motive === 'landDevelopment'
        && deduction?.transport === 'rope'
        && deduction?.disposal === 'hiddenForest'
        && deduction?.coverupItem === 'painterTowel'
        && deduction?.coverupHelper === 'painter';
      this.scene.start('EndingStoryScene', { route: perfectDeduction ? 'true' : 'normal' });
    }
  }

  async safeSave() {
    try { await window.GameSave.saveGame(); } catch (error) { console.error(`[엔딩:${this.route}] 저장 실패:`, error); }
  }

  replaceRewardClue(save, oldName, newName) {
    if (!Array.isArray(save.rewardClues)) save.rewardClues = [];
    const oldIndex = save.rewardClues.indexOf(oldName);
    if (oldIndex >= 0) save.rewardClues.splice(oldIndex, 1, newName);
    else if (!save.rewardClues.includes(newName)) save.rewardClues.push(newName);
  }

  showEndingTitle([title, subtitle]) {
    this.children.removeAll(true);
    const textureKey = ENDING_IMAGE_BY_ROUTE[this.route];
    if (textureKey && this.textures.exists(textureKey)) {
      const image = this.add.image(480, 270, textureKey).setOrigin(0.5);
      image.setScale(Math.max(960 / image.width, 540 / image.height));
    } else {
      this.add.text(480, 225, title, { fontFamily: 'Galmuri11, sans-serif', fontSize: '44px', color: '#d9b66f' }).setOrigin(0.5);
      this.add.text(480, 300, subtitle, { fontFamily: 'Galmuri11, sans-serif', fontSize: '23px', color: '#f1eadf' }).setOrigin(0.5);
    }
    this.add.text(480, 500, '[SPACE / ENTER] 메뉴로 돌아가기', {
      fontFamily: 'Galmuri11, sans-serif', fontSize: '13px', color: '#cbb994',
    }).setOrigin(0.5);
    // 다음 입력(스페이스/엔터/클릭)은 advance()가 endingTitleShown을 보고
    // 세이브 화면으로 돌려보낸다.
    this.endingTitleShown = true;
  }
}
