// Player, MatchEngine, SkilledHumanInputStrategy, makeBotStrategy, Color,
// BOT_ITEM_ASSIGNMENT, BOT_NAMES, ITEM_SKILLS는 daVinciLogic.js가 만드는 전역 값들이다.
// (index.html에서 daVinciLogic.js를 이 파일보다 먼저 로드해야 한다.)

// 카드 전체 크기를 1.2배로 키웠다(요청사항) - 기존 58x84 기준에 CARD_SCALE만
// 곱해서 카드 관련 치수가 전부 같이 늘어나게 한다.
const CARD_SCALE = 1.2;
const TILE_W = Math.round(58 * CARD_SCALE);
const TILE_H = Math.round(84 * CARD_SCALE);
const FONT = 'Galmuri9, monospace';
const FONT_BOLD = 'Galmuri11, monospace';
// 숫자가 미리 그려진 카드 앞면 그림(asset/davinci/cards/=검정, cards-light/=흰색,
// 각각 card-01~12.png)의 텍스처 키. 파일명 번호와 실제 숫자가 어긋나 있어서
// (흰색은 card-01=0, card-02=1... 순서대로지만, 검정만 card-01=1, card-02=0으로
// 앞 두 장이 서로 바뀌어 있고 그 뒤(card-03~12)는 2~11로 정상 순서) 번호별로
// 파일 인덱스를 표로 만들어 변환한다.
const BLACK_CARD_FILE_INDEX = [2, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // number 0~11
const WHITE_CARD_FILE_INDEX = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // number 0~11
function cardFaceKey(isBlack, number) {
  return `card-${isBlack ? 'black' : 'white'}-${number}`;
}
function cardFaceFile(isBlack, number) {
  const idx = (isBlack ? BLACK_CARD_FILE_INDEX : WHITE_CARD_FILE_INDEX)[number];
  const folder = isBlack ? 'cards' : 'cards-light';
  return `asset/davinci/${folder}/card-${String(idx).padStart(2, '0')}.png`;
}
const REVEAL_LIFT = Math.round(20 * CARD_SCALE); // 내 카드가 상대에게 들켰을 때 이만큼 위로 들어올려서 표시한다

// 화면을 위(상대) / 가운데(매트) / 아래(주인공) 3단으로 나눈다.
// 위/아래 초상+대화창은 크기를 동일하게 맞췄고(요청사항 10), SKILL은 카드 줄 옆
// 원형 버튼 대신 각 대화창 모서리의 작은 버튼으로 옮겨서(요청사항 9) 매트 가운데를
// 더 넓게 비워 카드를 크게 키울 수 있게 했다(요청사항 8).
const TOP_H = 120;
const BOTTOM_H = 120;
const MAT_Y = TOP_H;
const MAT_H = 700 - TOP_H - BOTTOM_H;
const PORTRAIT_W = 140;

const BOT_ROW_Y = MAT_Y + 29; // 상대 패를 5px 아래로 내림
const PLAYER_ROW_Y = MAT_Y + MAT_H - TILE_H - 30; // 내 패를 10px 위로 올림
const CARD_STEP = TILE_W + Math.round(10 * CARD_SCALE);
const ACTION_X = 170;
const ACTION_Y = 230;

// 정장 모자를 쓴 '용의자 실루엣' 도트 그림. 실제 캐릭터 아트가 없는 대신
// 격자무늬 1/0 배열을 사각형으로 채워 픽셀아트 느낌의 자리표시 초상을 만든다.
const SUSPECT_SILHOUETTE = [
  '00111111100',
  '00011111000',
  '00001110000',
  '00011111000',
  '00011111000',
  '00011111000',
  '00000110000',
  '00111111100',
  '01111111110',
  '01111111110',
  '11111111111',
  '11111111111',
];

// 봇별 전용 대사 - 대전 시작 / 내가 처음으로 상대 카드를 맞혔을 때 /
// 내가 처음으로 틀렸을 때 / 봇이 처음으로 자기 스킬을 썼을 때, 딱 한 번씩만 나온다.
// 봇6은 아이템(스킬)이 없으므로 firstSkill 대사가 없다.
const BOT_FLAVOR_LINES = {
  봇1: {
    start: '...뭘 그렇게 빤히 보는 거지? 나는 숨길 거 없어.',
    firstCorrect: '어떻게... 그걸 어떻게 알았지?',
    firstWrong: '훗, 그렇게 쉽게 넘어갈 것 같았나?',
    firstSkill: '미안하지만... 이미 다 보고 있었거든.',
  },
  봇2: {
    start: '심문이라... 재밌겠네. 어디 한번 해보시지.',
    firstCorrect: '...운이 좋았을 뿐이야.',
    firstWrong: '역시, 그리 쉽지 않을걸?',
    firstSkill: '미안한데, 그건 가짜였어.',
  },
  봇3: {
    start: '빨리 끝내지. 시간 낭비하기 싫으니까.',
    firstCorrect: '제법인데. 하지만 딱 거기까지야.',
    firstWrong: '그럴 줄 알았지.',
    firstSkill: '한 번 더. 이번엔 진짜다.',
  },
  봇4: {
    start: '글쎄, 난 딱히 할 말이 없는데.',
    firstCorrect: '...그건, 못 본 걸로 해줄 수 없나?',
    firstWrong: '거봐, 내가 뭐랬어.',
    firstSkill: '방금 그건, 없었던 일로 하지.',
  },
  봇5: {
    start: '나, 나는 진짜 아무것도 안 했어요.',
    firstCorrect: '그, 그게 다가 아니에요! 오해라구요!',
    firstWrong: '거봐요! 제가 아니라니까요!',
    firstSkill: '자, 잠깐만요! 이건 보여줄 수 없어요!',
  },
  봇6: {
    start: '…심문? 좋아. 논리로 승부하지.',
    firstCorrect: '흥미롭군. 우연은 아닌 것 같은데.',
    firstWrong: '예상했던 결과다.',
  },
};

// 다빈치코드 대전 씬. 로직은 전부 daVinciLogic.js(MatchEngine)에 있고,
// 이 씬은 그 결과를 그리고 사람 플레이어의 클릭을 HumanInputStrategy로
// 전달하는 역할만 한다.
//
// 엔진은 사람이 아닌 쪽(봇) 턴에서는 UI를 전혀 기다려주지 않고 이벤트를
// 순식간에 다 쏟아낸다. 그래서 onEngineEvent에서 즉시 처리하지 않고
// 이벤트 큐에 쌓은 뒤, 하나씩 애니메이션이 끝날 때까지 기다렸다가 다음
// 이벤트를 처리하는 방식(drainQueue)으로 연출 속도를 맞춘다.
class DaVinciCodeScene extends Phaser.Scene {
  constructor() {
    super('DaVinciCodeScene');
  }

  init(data) {
    this.botName = (data && data.botName) || '봇1';
    // 이겼을 때 SuspectChoiceScene(심문 선택지 화면)으로 넘어가려면 어떤 용의자였는지
    // 알아야 하므로 SuspectVNScene이 넘겨준 npc 정보도 같이 들고 있는다.
    this.npcId = data && data.npcId;
    this.npcName = data && data.npcName;
    // 대전이 끝나고 "맵으로 돌아가기"를 누르면 원래 있던 맵/자리로 정확히 돌아가야
    // 하므로 SuspectVNScene이 넘겨준 맵 키와 좌표(대화를 걸었던 자리)를 기억해둔다.
    this.returnMapKey = (data && data.returnMapKey) || 'map_01_village';
    this.returnX = data && data.returnX;
    this.returnY = data && data.returnY;
    // 이 씬은 원래 800x600 레이아웃을 그대로 가정하고 만들어져 있었는데, 화면을
    // 1200x700으로 키워달라는 요청에 따라 카드/버튼 등 요소 크기는 그대로 두고
    // 화면 가장자리 기준 좌표(가운데점, 오른쪽/아래쪽 끝)만 1200x700에 맞게 다시
    // 잡았다. 마을 게임 화면은 960x540이라 크기가 다르므로(의도된 설계), 나중에
    // 맵으로 돌아갈 때 다시 960x540으로 되돌린다.
    this.scale.resize(1200, 700);
  }

  preload() {
    // 코인토스에 쓰는 금화 양면 이미지 (사용자가 제공한 그림에서 잘라낸 것).
    const v = Date.now();
    this.load.image('coinFaceA', `asset/davinci/coin_face_a.png?v=${v}`);
    this.load.image('coinFaceB', `asset/davinci/coin_face_b.png?v=${v}`);

    // 배경(원목 테이블) / 매트(초록 카드 매트) / 카드 뒷면 디자인.
    this.load.image('tableWood', `asset/davinci/wood_bg.png?v=${v}`);
    this.load.image('tableMat', `asset/davinci/mat_green.png?v=${v}`);
    this.load.image('cardBackWhite', `asset/davinci/card_back_white.png?v=${v}`);
    this.load.image('cardBackBlack', `asset/davinci/card_back_black.png?v=${v}`);
    // 카드 앞면: 0~11 숫자가 이미 그려진 그림을 색깔별로 그대로 불러온다(더 이상
    // 빈 템플릿 위에 폰트로 숫자를 렌더링하지 않는다 - cardFaceKey()/cardFaceFile() 참고).
    for (let n = 0; n <= 11; n++) {
      this.load.image(cardFaceKey(true, n), `${cardFaceFile(true, n)}?v=${v}`);
      this.load.image(cardFaceKey(false, n), `${cardFaceFile(false, n)}?v=${v}`);
    }

    this.load.audio('bgm-davinci', `asset/sound/davinci.mp3?v=${v}`);
  }

  create() {
    // 마을 배경음악(bgm-main과, 맵에 따라 같이 깔려있었을 bgm-water/bgm-port)은
    // 멈추고 다빈치코드 전용 배경음악으로 바꿔서 튼다.
    ['bgm-main', 'bgm-water', 'bgm-port'].forEach(key => {
      const bgm = this.sound.get(key);
      if (bgm && (bgm.isPlaying || bgm.isPaused)) bgm.pause();
    });
    this.bgmDavinci = this.sound.add('bgm-davinci', { loop: true, volume: 0.3 });
    this.bgmDavinci.play();

    this.drawWoodBackground();
    this.drawTableMat();

    const skillKey = BOT_ITEM_ASSIGNMENT[this.botName];
    this.skillInfo = skillKey ? ITEM_SKILLS[skillKey] : null;
    this.flavor = BOT_FLAVOR_LINES[this.botName] || {};

    const unlocked = this.registry.get('unlockedSkills') || [];

    // 위/아래 캐릭터 초상 + 대화창. 크기를 동일하게 맞췄고, 두 대화창 모두
    // 이제 '주인공/봇이 서로 대화하는' 용도의 짧은 한 줄 텍스트만 표시한다
    // (로그·스크롤 기능은 폐기).
    // Galmuri9는 도트(비트맵) 폰트라 fontSize를 키우면(예: 24px) 한글 자모 조합이
    // 깨져서 엉뚱한 글자로 보인다(테스트로 확인됨). 그래서 크기는 원래 그대로
    // 12px에 정확히 그리고, 다 그려진 텍스트 객체 자체를 2배로 확대(setScale)한다 -
    // 래스터라이즈 이후에 확대하는 거라 글자가 깨지지 않는다. wordWrap 너비는
    // 확대 후 폭이 원래와 같아지도록 절반(260)으로 줄여둔다.
    this.drawPortraitBox(0, 0, PORTRAIT_W, TOP_H, 0xd8cfae, 0x2b2620);
    this.drawDialogueBox(PORTRAIT_W + 10, 10, 1200 - PORTRAIT_W - 24, TOP_H - 20);
    this.opponentDialogueText = this.add.text(PORTRAIT_W + 24, 22, '', {
      fontFamily: FONT, fontSize: '12px', color: '#2b2620', lineSpacing: 4,
      wordWrap: { width: 260 },
    }).setScale(2);

    this.drawPortraitBox(0, 700 - BOTTOM_H, PORTRAIT_W, BOTTOM_H, 0xc9dce0, 0x1a3a52);
    this.drawDialogueBox(PORTRAIT_W + 10, 700 - BOTTOM_H + 10, 1200 - PORTRAIT_W - 24, BOTTOM_H - 20);
    this.playerDialogueText = this.add.text(PORTRAIT_W + 24, 700 - BOTTOM_H + 22, '', {
      fontFamily: FONT, fontSize: '12px', color: '#2b2620', lineSpacing: 4,
      wordWrap: { width: 260 },
    }).setScale(2);

    this.dynamicLayer = this.add.container(0, 0);

    // 뒤집기/오답 연출은 그 자리의 카드 위에 임시 오버레이를 얹는데, 그 동안
    // 아래에 있는 '진짜' 타일이 비쳐 보이면 카드가 두 장인 것처럼 된다. 숨겨야
    // 할 자리의 키('side:index')를 여기 모아두고 render()가 매번 참고한다.
    this.hiddenTiles = new Set();


    // 대화창 모서리에 붙는 SKILL 버튼용 설명 팝업. 매치 내내 내용이 바뀌지
    // 않으므로 한 번만 만들어두고 hover로 보이기/숨기기만 한다.
    const oppLines = this.skillInfo
      ? `${this.botName}\n소지품: ${this.skillInfo.item}\n능력: ${this.skillInfo.skill}\n${this.skillInfo.description}`
      : `${this.botName}\n특별한 소지품이 없습니다.`;
    this.oppInfoPopup = this.makeInfoPopup(480, 300, TOP_H + 8, oppLines, false);
    this.oppInfoPopup.setVisible(false);

    const mySkillLines = unlocked.length
      ? unlocked.map((k) => `${ITEM_SKILLS[k].skill}: ${ITEM_SKILLS[k].description}`).join('\n\n')
      : '보유한 능력이 없습니다.';
    this.mySkillsPopup = this.makeInfoPopup(460, 320, 700 - BOTTOM_H - 8, mySkillLines, true);
    this.mySkillsPopup.setVisible(false);

    this.human = new Player('나');
    this.bot = new Player(this.botName);
    this.humanStrategy = new SkilledHumanInputStrategy(unlocked);
    this.botStrategy = makeBotStrategy(this.botName);

    this.firstPlayerCorrectShown = false;
    this.firstPlayerWrongShown = false;
    this.firstBotSkillShown = false;

    // 엔진 이벤트 큐
    this.eventQueue = [];
    this.draining = false;
    this.pendingUIUpdate = null;

    this.mode = 'idle';
    // coin_toss | idle | pick_slot | pick_number | continue_choice
    // | wrong_guess_decision | wrong_guess_reveal_pick | rewind_decision | over
    this.selectedSlotPos = null;
    this.insightPickActive = false;
    this.menuOpen = false;
    this.rulesOpen = false;

    this.humanStrategy.onNeedGuess = (obs) => {
      this.pendingUIUpdate = () => {
        this.mode = 'pick_slot';
        this.currentObs = obs;
        this.render();
      };
      this.applyPendingUIUpdateIfIdle();
    };
    this.humanStrategy.onNeedContinueDecision = () => {
      this.pendingUIUpdate = () => {
        this.mode = 'continue_choice';
        this.setPlayerLine('정답이다! 계속 도전할까?');
        this.render();
      };
      this.applyPendingUIUpdateIfIdle();
    };
    this.humanStrategy.onNeedWrongGuessDecision = (obs, usable) => {
      this.pendingUIUpdate = () => {
        this.wrongGuessUsable = usable;
        if (usable.length > 0) {
          // 쓸 수 있는 능력이 있으면 먼저 능력 사용 여부부터 물어본다.
          this.mode = 'wrong_guess_decision';
          this.setPlayerLine('오답이다! 보유한 능력을 사용할까?');
        } else {
          // 쓸 수 있는 능력이 없으면 곧바로 '공개할 카드 선택' 단계로 간다.
          this.mode = 'wrong_guess_reveal_pick';
          this.setPlayerLine('틀렸다...');
        }
        this.render();
      };
      this.applyPendingUIUpdateIfIdle();
    };
    this.humanStrategy.onNeedRewindDecision = () => {
      this.pendingUIUpdate = () => {
        this.mode = 'rewind_decision';
        this.setPlayerLine('내 블록이 공개됐다. 되감기를 사용할까?');
        this.render();
      };
      this.applyPendingUIUpdateIfIdle();
    };

    // '수사 시작' 배너 -> 주인공 대사 한 번 -> 상대 대사 한 번(둘 다 한 글자씩
    // 타이핑되는 연출) -> '선공 결정' 배너 -> 코인토스, 순서로 진행한다.
    this.showBanner('수사 시작', `vs ${this.botName}`);
    this.time.delayedCall(2300, () => {
      this.typewriterText(this.playerDialogueText, '반드시 당신의 정체를 밝혀내겠어.', () => {
        this.time.delayedCall(900, () => {
          this.typewriterText(
            this.opponentDialogueText,
            this.flavor.start || `${this.botName}과(와)의 대전이 시작됩니다.`,
            () => {
              this.time.delayedCall(900, () => {
                this.showBanner('선공 결정');
                this.time.delayedCall(2300, () => this.startCoinToss());
              });
            },
          );
        });
      });
    });
  }

  // 순서 결정용 코인토스 애니메이션. 끝나면 startingPlayer를 정해서 매치를 시작한다.
  startCoinToss() {
    this.mode = 'coin_toss';
    this.setPlayerLine('선공을 정하는 중... 동전을 던진다.');

    const startX = 600;
    const groundY = MAT_Y + MAT_H / 2;
    const peakY = 150;

    this.coinShadow = this.add.ellipse(startX, groundY + 44, 60, 14, 0x000000, 0.35);
    this.coinSprite = this.add.image(0, 0, 'coinFaceA').setDisplaySize(78, 78);
    this.coinContainer = this.add.container(startX, groundY, [this.coinSprite]);

    const startingPlayer = Math.random() < 0.5 ? 0 : 1;
    const winnerLabel = startingPlayer === 0 ? '나' : this.botName;

    const baseScaleX = this.coinSprite.scaleX;
    let showHuman = true;
    // 회전 중엔 "나"/상대 이름 라벨을 굳이 같이 뒤집지 않는다 - 착지 직후 대사창과
    // "선공/후공" 배너로 결과를 바로 알려주므로, 동전 자체는 순수 뒤집기 연출만 맡는다.
    const toggleFace = () => {
      showHuman = !showHuman;
      this.coinSprite.setTexture(showHuman ? 'coinFaceA' : 'coinFaceB');
    };
    this.spinTween = this.tweens.add({
      targets: this.coinSprite,
      scaleX: { from: baseScaleX, to: baseScaleX * 0.15 },
      // 회전 수를 2배로: 던지는 전체 체공 시간(1200+1100ms)은 그대로 두고,
      // 한 번 뒤집는 데 걸리는 시간만 절반으로 줄여서 같은 시간에 두 배 더 돈다.
      duration: 90,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onYoyo: toggleFace,
      onRepeat: toggleFace,
    });

    const updateShadow = () => {
      const t = Phaser.Math.Clamp((groundY - this.coinContainer.y) / (groundY - peakY), 0, 1);
      this.coinShadow.setScale(1 - t * 0.5, 1 - t * 0.5);
      this.coinShadow.setAlpha(0.35 - t * 0.25);
    };

    this.tweens.add({
      targets: this.coinContainer,
      y: peakY,
      duration: 1200,
      ease: 'Sine.easeOut',
      onUpdate: updateShadow,
      onComplete: () => {
        this.tweens.add({
          targets: this.coinContainer,
          y: groundY,
          duration: 1100,
          ease: 'Sine.easeIn',
          onUpdate: updateShadow,
          onComplete: () => {
            this.spinTween.stop();
            this.coinSprite.setDisplaySize(78, 78);
            this.coinSprite.setTexture(startingPlayer === 0 ? 'coinFaceA' : 'coinFaceB');
            this.coinShadow.setScale(1, 1).setAlpha(0.35);

            this.tweens.add({
              targets: this.coinContainer,
              y: groundY - 12,
              duration: 200,
              yoyo: true,
              ease: 'Quad.easeOut',
            });

            const iAmFirst = startingPlayer === 0;
            this.setPlayerLine(`${winnerLabel}이(가) 선공이다!`);
            this.showBanner(iAmFirst ? '선공' : '후공', null, iAmFirst ? 0xe24b4b : 0x4b8ee2);
            this.time.delayedCall(2300, () => this.beginMatch(startingPlayer));
          },
        });
      },
    });
  }

  beginMatch(startingPlayer) {
    this.coinContainer.destroy();
    this.coinShadow.destroy();
    this.mode = 'idle';

    this.engine = new MatchEngine(
      this.human,
      this.bot,
      this.humanStrategy,
      this.botStrategy,
      startingPlayer,
      (event) => this.onEngineEvent(event),
    );

    // 엔진 생성자 안에서 초기 4장씩(총 8장)이 이미 다 정해졌다 - 여기서는 그걸
    // 셔플 후 한 장씩 번갈아 나눠주는 연출로 "보여주기"만 한다. 연출이 끝난
    // 뒤에야 실제 인터랙티브 렌더링과 매치 진행을 시작한다.
    this.playInitialDealAnimation(startingPlayer, () => {
      (this._dealPlaceholders || []).forEach((t) => t.destroy());
      this._dealPlaceholders = [];
      this._prevBotSlotIds = new Set(this.bot.hand.slots.map((s) => s.slotId));
      this._prevHumanSlotIds = new Set(this.human.hand.slots.map((s) => s.slotId));
      this.render();
      // 초기 4장 배분 연출이 완전히 끝난 뒤에야 '엿보기' 같은 대전-시작 스킬을
      // 발동시킨다(안 그러면 카드가 다 나눠지기도 전에 스킬 배너부터 뜬다).
      this.engine.triggerMatchStart();
      // 엔진은 사람 입력을 기다리는 지점 외에는 UI를 전혀 기다려주지 않고
      // 즉시 진행한다 - 결과(누가 이겼는지)는 이벤트 큐를 다 소비한 뒤
      // this.engine.winner를 보고 처리한다(drainQueue 참고).
      this.engine.playFullMatch();
    });
  }

  // 대전 시작 직후 초기 4장씩 배분을 보여준다. "나의 턴"/"상대 턴" 배너는 실제
  // 턴이 시작될 때만 쓰는 표시라서, 아직 턴이 시작되지도 않은 이 초기 배분
  // 단계에서 같이 띄우면 실제 턴과 헷갈린다(코인토스로 막 정해진 선공 순서와도
  // 어긋나 보일 수 있다). 그래서 여기서는 배너 없이 순서만 - 코인토스로 정해진
  // 실제 선공 쪽부터 - 맞춰서 카드만 조용히 나눠준다.
  playInitialDealAnimation(startingPlayer, onComplete) {
    const firstSide = startingPlayer === 0 ? 'player' : 'bot';
    const secondSide = firstSide === 'player' ? 'bot' : 'player';
    const dealSide = (side, next) => {
      this.playInitialSpreadDeal(side, next);
    };
    dealSide(firstSide, () => this.time.delayedCall(400, () => dealSide(secondSide, onComplete)));
  }

  // 카드 더미를 한 줄로 펼쳐 보여준 뒤, 그 중 4장을 side의 손패 자리로 하나씩
  // 날려 보낸다(초기 배분 전용 - 실제 값은 이미 정해져 있어 클릭 선택은 없다).
  playInitialSpreadDeal(side, onComplete) {
    const count = (this.engine ? this.engine.deck.length : 0) + 1;
    const centerX = 600;
    const centerY = MAT_Y + MAT_H / 2;
    const rowY = centerY - TILE_H / 2;
    const step = count > 1 ? TILE_W * 0.5 : TILE_W + 14;
    const startX = centerX - ((count - 1) * step + TILE_W) / 2;

    const group = this.add.container(0, 0);
    group.setDepth(920);
    this.dynamicLayer.add(group);
    const cards = [];
    for (let i = 0; i < count; i++) {
      const x = startX + i * step;
      const back = this.makeDeckCardBack(x, rowY, i % 2 === 0 ? Color.BLACK : Color.WHITE);
      group.add(back);
      cards.push({
        back, x, y: rowY, cx: x + TILE_W / 2, cy: rowY + TILE_H / 2,
      });
    }
    cards.forEach((c, i) => {
      this.tweens.add({
        targets: c.back, y: c.cy - 14, duration: 220, delay: i * 25, yoyo: true, ease: 'Sine.easeOut',
      });
    });

    const hand = side === 'bot' ? this.bot.hand : this.human.hand;
    const dealCardIdxs = Phaser.Utils.Array.Shuffle(cards.map((_, i) => i)).slice(0, MatchEngine.INITIAL_HAND_SIZE);
    this._dealPlaceholders = this._dealPlaceholders || [];

    const dealOne = (step2) => {
      if (step2 >= dealCardIdxs.length) {
        group.destroy();
        this.time.delayedCall(200, onComplete);
        return;
      }
      const handIndex = step2;
      const slot = hand.slots[handIndex];
      const target = this.tileScreenPos(side, handIndex, false);
      const chosen = cards[dealCardIdxs[step2]];
      // 셔플용 장식 뒷면은 실제 카드 색과 다를 수 있다 - 손패로 날아가기 전에
      // 진짜 색으로 바꿔서, 놓일 때 색이 바뀌는 것처럼 보이던 버그를 없앤다.
      const realBackTexture = slot.block.color === Color.BLACK ? 'cardBackBlack' : 'cardBackWhite';
      chosen.back.faceImage?.setTexture(realBackTexture);

      this.tweens.add({
        targets: chosen.back,
        x: target.x + TILE_W / 2,
        y: target.y + TILE_H / 2,
        duration: 380,
        ease: 'Back.easeIn',
        onComplete: () => {
          chosen.back.destroy();
          const displayBlock = side === 'player'
            ? slot.block
            : { color: slot.block.color, number: null };
          const landed = this.makeTile(target.x, target.y, displayBlock, null);
          landed.setDepth(905);
          this._dealPlaceholders.push(landed);
          this.time.delayedCall(160, () => dealOne(step2 + 1));
        },
      });
    };

    this.time.delayedCall(500, () => dealOne(0));
  }

  async runMatchEnd(winner) {
    this.mode = 'over';
    const win = winner === this.human;
    this.matchWon = win;

    if (win && this.skillInfo) {
      const skillKey = BOT_ITEM_ASSIGNMENT[this.botName];
      const unlocked = new Set(this.registry.get('unlockedSkills') || []);
      if (!unlocked.has(skillKey)) {
        unlocked.add(skillKey);
        this.registry.set('unlockedSkills', Array.from(unlocked));
        this.setPlayerLine(`승리! ${this.botName}의 소지품 [${this.skillInfo.item}]과 능력 '${this.skillInfo.skill}'을(를) 손에 넣었다.`);
      } else {
        this.setPlayerLine('승리! 사건의 단서를 얻었다.');
      }
    } else {
      this.setPlayerLine(win ? '승리! 사건의 단서를 얻었다.' : '패배했다...');
    }
    this.render();
  }

  // ---- 엔진 이벤트 큐: 봇 턴처럼 이벤트가 한꺼번에 몰아쳐도, 하나씩 연출이
  // 끝날 때까지 기다렸다가 다음 이벤트를 처리한다.
  //
  // onEngineEvent가 반환하는 Promise를 daVinciLogic.js의 MatchEngine이 await한다 -
  // 이 자리가 엔진과 화면 연출의 속도를 묶어주는 유일한 지점이다. 이게 없으면(예전
  // 처럼 fire-and-forget이면) 엔진은 사람 입력을 기다리는 지점 외엔 즉시 몇 턴이고
  // 데이터를 앞질러 진행해버려서, 아직 이 연출 큐가 재생하지 못한 카드의 revealed
  // 여부 같은 "미래 상태"가 render()에 그대로 새어나간다(상대가 방금 뽑은 카드
  // 숫자가 나중 턴에 이미 공개돼버린 탓에 뽑는 순간부터 보이는 등). ----

  onEngineEvent(event) {
    return new Promise((resolve) => {
      this.eventQueue.push({ event, resolve });
      this.drainQueue();
    });
  }

  async drainQueue() {
    if (this.draining) return;
    this.draining = true;
    while (this.eventQueue.length > 0) {
      const { event, resolve } = this.eventQueue.shift();
      // eslint-disable-next-line no-await-in-loop
      await this.handleEvent(event);
      resolve();
      if (this.engine && this.engine.winner && this.eventQueue.length === 0) {
        // match_over 이벤트까지 다 처리한 뒤에 결과 화면으로 넘어간다.
        this.runMatchEnd(this.engine.winner);
      }
    }
    this.draining = false;
    this.applyPendingUIUpdateIfIdle();
  }

  applyPendingUIUpdateIfIdle() {
    if (!this.draining && this.pendingUIUpdate) {
      const fn = this.pendingUIUpdate;
      this.pendingUIUpdate = null;
      fn();
    }
  }

  handleEvent(event) {
    return new Promise((resolve) => {
      const finish = (delay = 0) => {
        this.render();
        if (delay > 0) this.time.delayedCall(delay, resolve);
        else resolve();
      };

      // reveal_opponent는 정답 처리를 'guess'에서 이미 다 하므로 중복 처리하지 않는다.
      if (event.kind === 'reveal_opponent') {
        resolve();
        return;
      }

      if (event.kind === 'draw') {
        const side = event.data.player === this.botName ? 'bot' : 'player';
        this.showBanner(side === 'player' ? '나의 턴' : '상대 턴');
        const hand = side === 'bot' ? this.bot.hand : this.human.hand;
        const prevIds = side === 'bot' ? (this._prevBotSlotIds || new Set()) : (this._prevHumanSlotIds || new Set());
        const newIndex = hand.slots.findIndex((s) => !prevIds.has(s.slotId));
        this.setPlayerLine('');
        this.setOpponentLine('');

        this.time.delayedCall(1300, () => {
          if (newIndex === -1) { finish(); return; }
          if (side === 'player') this.setGuide('뽑을 카드를 고르세요');
          this.playDrawPickSequence(side, newIndex, () => {
            this.setGuide('');
            finish();
          });
        });
        return;
      }

      if (event.kind === 'guess') {
        const side = event.data.target === this.botName ? 'bot' : 'player';
        const guesserIsBot = event.data.guesser === this.botName;

        const showReactionLine = () => {
          if (side === 'bot') {
            if (event.data.correct && !this.firstPlayerCorrectShown) {
              this.firstPlayerCorrectShown = true;
              this.setOpponentLine(this.flavor.firstCorrect || '...맞았다.');
            } else if (!event.data.correct && !this.firstPlayerWrongShown) {
              this.firstPlayerWrongShown = true;
              this.setOpponentLine(this.flavor.firstWrong || '틀렸다!');
            } else {
              this.setOpponentLine(event.data.correct ? '...맞았다.' : '틀렸다!');
            }
          } else {
            this.setPlayerLine(event.data.correct ? '정답이다!' : '틀렸다...');
          }
        };

        const reveal = () => {
          if (event.data.correct) {
            const targetPlayer = side === 'bot' ? this.bot : this.human;
            const block = targetPlayer.hand.slots[event.data.position].block;
            showReactionLine();
            // 뒤집기 -> (내 카드라면) 들어올리기 순서로 자연스럽게 이어지도록,
            // 그 연출이 다 끝난 뒤에야 다음 이벤트로 넘어간다(finish 즉시 호출 X).
            this.flipCorrectTile(side, event.data.position, block, () => finish());
          } else {
            this.flashWrongTile(side, event.data.position);
            showReactionLine();
            finish(800);
          }
        };

        if (guesserIsBot) {
          this.showBotCursorSuspense(event.data.position, reveal);
        } else {
          reveal();
        }
        return;
      }

      if (event.kind === 'reveal_self') {
        const side = event.data.player === this.botName ? 'bot' : 'player';
        const owner = side === 'bot' ? this.bot : this.human;
        const block = owner.hand.slots[event.data.position].block;
        this.flipCorrectTile(side, event.data.position, block, () => finish());
        return;
      }

      if (event.kind === 'skill_used') {
        if (event.data.player === this.botName) {
          this.showBanner('상대의 스킬 사용', event.data.skill);
          if (!this.firstBotSkillShown) {
            this.firstBotSkillShown = true;
            if (this.flavor.firstSkill) {
              this.time.delayedCall(2300, () => this.setOpponentLine(this.flavor.firstSkill));
            }
          }
          finish(2300);
        } else {
          this.setPlayerLine(`능력 '${event.data.skill}' 사용!`);
          finish(600);
        }
        return;
      }

      finish();
    });
  }

  // 아래쪽(주인공) 대화창에 한 줄을 표시한다.
  setPlayerLine(text) {
    this.playerDialogueText.setText(text);
  }

  // 위쪽(상대) 대화창에 한 줄을 표시한다.
  setOpponentLine(text) {
    this.opponentDialogueText.setText(text);
  }

  // 안내문("지목할 숫자를 고르세요" 등)을 주인공 대화창에 띄운다. 매트 중앙에
  // 따로 띄우던 걸 주인공 대화창으로 옮겼다. 안내할 게 없을 때(빈 문자열)는
  // 아무것도 안 한다 - 여기서 매번 지워버리면 방금 setPlayerLine()으로 띄운
  // "정답이다!" 같은 반응 대사가 render() 직후 바로 지워져 버린다.
  setGuide(text) {
    if (text) this.playerDialogueText.setText(text);
  }

  // 대화창 텍스트를 한 글자씩 타이핑하듯 출력한다. 대전 시작 시 인트로 대사에 쓴다.
  typewriterText(target, fullText, onComplete, charDelay = 45) {
    target.setText('');
    let i = 0;
    const step = () => {
      if (i > fullText.length) {
        if (onComplete) onComplete();
        return;
      }
      target.setText(fullText.slice(0, i));
      i += 1;
      this.time.delayedCall(charDelay, step);
    };
    step();
  }

  // 화면 중앙에서 팝업처럼 커지며 나타났다가 잠시 뒤 사라지는 배너.
  showBanner(mainText, subText, borderColor = 0xe8c86a) {
    const cx = 600;
    const cy = MAT_Y + MAT_H / 2;
    const w = 340;
    const h = subText ? 104 : 80;

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillRect(-w / 2 + 5, -h / 2 + 5, w, h);
    g.fillStyle(0x1a1410, 0.94);
    g.fillRect(-w / 2, -h / 2, w, h);
    g.lineStyle(4, borderColor, 1);
    g.strokeRect(-w / 2, -h / 2, w, h);
    g.lineStyle(1, borderColor, 0.5);
    g.strokeRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16);

    const children = [g];
    const mainLabel = this.add.text(0, subText ? -14 : 0, mainText, {
      fontFamily: FONT_BOLD, fontSize: '24px', color: '#f5e9c8',
    }).setOrigin(0.5);
    children.push(mainLabel);
    if (subText) {
      const subLabel = this.add.text(0, 22, subText, { fontFamily: FONT, fontSize: '12px', color: '#cbb98a' }).setOrigin(0.5);
      children.push(subLabel);
    }

    const banner = this.add.container(cx, cy, children);
    banner.setScale(0);
    banner.setDepth(1000);

    this.tweens.add({
      targets: banner,
      scale: 1,
      duration: 520,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1300, () => {
          this.tweens.add({
            targets: banner,
            scale: 0,
            alpha: 0,
            duration: 400,
            ease: 'Back.easeIn',
            onComplete: () => banner.destroy(),
          });
        });
      },
    });
  }

  // side 손패의 장수에 맞춰 줄 전체가 매트 가로 중앙(600)에 오도록 시작 x를
  // 계산한다 - 카드가 몇 장이든(4장이든 10장이든) 줄이 항상 가운데 정렬되고,
  // 카드가 늘어나면 줄 전체가 양옆으로 고르게 넓어진다.
  rowStartX(side) {
    const count = Math.max(1, (side === 'bot' ? this.bot : this.human).hand.slots.length);
    const rowWidth = (count - 1) * CARD_STEP + TILE_W;
    return 600 - rowWidth / 2;
  }

  // side('bot'|'player') + index로 화면상의 타일 좌상단 좌표를 구한다.
  // 내 카드(player)가 상대에게 들켰을 때만 REVEAL_LIFT만큼 위로 들어올린다.
  // 상대(bot) 쪽은 나중에 카드 뒷면 디자인 자체가 공개 여부를 구분해줄 것이므로
  // 들어올리지 않는다.
  tileScreenPos(side, index, revealed) {
    const x = this.rowStartX(side) + index * CARD_STEP;
    const baseY = side === 'bot' ? BOT_ROW_Y : PLAYER_ROW_Y;
    const lift = side === 'player' && revealed ? REVEAL_LIFT : 0;
    return { x, y: baseY - lift };
  }

  // 연출 오버레이가 얹히는 동안 그 자리의 진짜 타일을 숨긴다. 연출 도중에도
  // render()가 다시 돌 수 있으므로(오답 연출은 바로 뒤에서 finish()가 render()를
  // 호출한다) 숨김 상태를 hiddenTiles에 남겨서 새로 그려지는 타일에도 계속
  // 적용되게 한다. 반환한 키를 restoreTile()에 그대로 넘기면 복구된다.
  suppressTile(side, index) {
    const key = `${side}:${index}`;
    this.hiddenTiles.add(key);
    const tile = this.tileRefs ? this.tileRefs.get(key) : null;
    if (tile && tile.scene) tile.setVisible(false);
    return key;
  }

  restoreTile(key) {
    this.hiddenTiles.delete(key);
    const tile = this.tileRefs ? this.tileRefs.get(key) : null;
    if (tile && tile.scene) tile.setVisible(true);
  }

  // 오답 연출: 그 자리 카드 위에 빨간 테두리 + 좌우 진동을 재생하는 임시 오버레이.
  // 이 오버레이는 render()가 그 자리에 그리는 타일과 색/숫자/위치가 똑같아야 한다.
  // 예전엔 검정 배경 + '?'로 하드코딩돼 있어서, 흰 카드에서 틀리면 색이 바뀐 것처럼
  // 보이고 좌우로 흔들릴 때 아래 타일이 가장자리로 삐져나왔다.
  flashWrongTile(side, index) {
    const owner = side === 'bot' ? this.bot : this.human;
    const slot = owner.hand.slots[index];
    const block = slot ? slot.block : null;
    const revealed = slot ? slot.revealed : false;
    // 내 패는 항상 숫자까지 보이고, 상대 패는 공개된 자리만 숫자가 보인다(render()와 동일).
    const showNumber = block != null && (side === 'player' || revealed);

    const { x, y } = this.tileScreenPos(side, index, revealed);
    const cx = x + TILE_W / 2;
    const cy = y + TILE_H / 2;

    const isBlack = !block || block.color === Color.BLACK;
    const cardKey = showNumber
      ? cardFaceKey(isBlack, block.number)
      : (isBlack ? 'cardBackBlack' : 'cardBackWhite');

    const hiddenKey = this.suppressTile(side, index);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(-TILE_W / 2 + 3, -TILE_H / 2 + 3, TILE_W, TILE_H, 6);
    const face = this.add.image(0, 0, cardKey).setDisplaySize(TILE_W, TILE_H);

    const border = this.add.graphics();
    const drawBorder = (alpha) => {
      border.clear();
      border.lineStyle(4, 0xe23b3b, alpha);
      border.strokeRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
    };
    drawBorder(1);

    const overlay = this.add.container(cx, cy, [shadow, face, border]);
    overlay.setDepth(900);

    const shakeOffsets = [7, -7, 5, -5, 3, -3, 0];
    let step = 0;
    const doShake = () => {
      if (step >= shakeOffsets.length) return;
      this.tweens.add({
        targets: overlay,
        x: cx + shakeOffsets[step],
        duration: 90,
        ease: 'Sine.easeInOut',
        onComplete: doShake,
      });
      step += 1;
    };
    doShake();

    this.tweens.addCounter({
      from: 100,
      to: 0,
      duration: 900,
      delay: 300,
      onUpdate: (tw) => drawBorder(tw.getValue() / 100),
      onComplete: () => {
        this.restoreTile(hiddenKey);
        overlay.destroy();
      },
    });
  }

  // 정답/공개 연출: 카드가 세로축으로 접히듯 좁아졌다 다시 넓어지면서
  // 뒷면 -> 앞면(숫자 공개)으로 바뀌는 뒤집기 애니메이션. 내 카드(player)라면
  // 뒤집기가 완전히 끝난 뒤에야 위로 들어올려서, 뒤집기+들어올리기가 동시에
  // 일어나 카드 2장이 겹친 것처럼 보이던 문제를 없앤다. onComplete는 이 연출이
  // (뒤집기 + 필요하면 들어올리기까지) 전부 끝난 뒤 호출된다.
  flipCorrectTile(side, index, block, onComplete) {
    const { x, y } = this.tileScreenPos(side, index, false);
    const cx = x + TILE_W / 2;
    const cy = y + TILE_H / 2;

    const isBlack = block.color === Color.BLACK;
    const backKey = isBlack ? 'cardBackBlack' : 'cardBackWhite';
    const frontKey = cardFaceKey(isBlack, block.number);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(-TILE_W / 2 + 3, -TILE_H / 2 + 3, TILE_W, TILE_H, 6);
    const face = this.add.image(0, 0, backKey).setDisplaySize(TILE_W, TILE_H);

    const drawFace = (revealed) => {
      if (revealed) {
        face.setTexture(frontKey);
      } else {
        // 뒤집기 전엔 뒷면 그림을 그대로 보여준다 - 실제 손패 타일(makeTile)의
        // 미공개 상태와 똑같아서, 뒤집히기 직전까지 다른 곳과 이질감이 없다.
        face.setTexture(backKey);
      }
      face.setDisplaySize(TILE_W, TILE_H);
    };
    drawFace(false);

    const overlay = this.add.container(cx, cy, [shadow, face]);
    overlay.setDepth(900);

    // 이 오버레이는 render()가 이미 그려둔 '진짜' 타일 위에 얹힌다. 오버레이가
    // scaleX 0까지 접히는 순간이나 위로 들어올려지는 동안 아래 타일이 그대로
    // 드러나서, 카드 뒤에 카드가 한 장 더 있는 것처럼 보인다. 연출이 끝날
    // 때까지 아래 타일을 숨겨두고, 오버레이를 치울 때 함께 되돌린다.
    const hiddenKey = this.suppressTile(side, index);

    const clearOverlay = () => {
      this.restoreTile(hiddenKey);
      overlay.destroy();
      if (onComplete) onComplete();
    };

    const lift = side === 'player' ? REVEAL_LIFT : 0;

    this.tweens.add({
      targets: overlay,
      scaleX: 0,
      duration: 300,
      ease: 'Sine.easeIn',
      onComplete: () => {
        drawFace(true);
        this.tweens.add({
          targets: overlay,
          scaleX: 1,
          duration: 340,
          ease: 'Back.easeOut',
          onComplete: () => {
            if (lift > 0) {
              // 뒤집기가 다 끝난 뒤에야 위로 들어올린다.
              this.tweens.add({
                targets: overlay,
                y: cy - lift,
                duration: 260,
                ease: 'Sine.easeOut',
                onComplete: () => {
                  this.time.delayedCall(300, clearOverlay);
                },
              });
            } else {
              this.time.delayedCall(600, clearOverlay);
            }
          },
        });
      },
    });
  }

  // 상대가 내 카드를 지목할 때, 실제 결과를 보여주기 전에 커서가 몇 장을
  // 훑고 지나가듯 움직이며 긴장감을 준다. 마지막에 실제 지목 위치에서 멈춘다.
  showBotCursorSuspense(targetIndex, onComplete) {
    const hiddenIndices = this.human.hand.slots
      .map((s, i) => (!s.revealed && i !== targetIndex ? i : null))
      .filter((i) => i !== null);
    const decoys = Phaser.Utils.Array.Shuffle(hiddenIndices.slice()).slice(0, 2);
    const sequence = [...decoys, targetIndex];
    const rowStartX = this.rowStartX('player');
    const positions = sequence.map((pos) => ({
      x: rowStartX + pos * CARD_STEP + TILE_W / 2,
      y: PLAYER_ROW_Y - 26,
    }));
    this.playCursorSweep(positions, onComplete);
  }

  // 화살표 커서가 좌표 목록을 순서대로 훑고 지나가다 마지막 좌표에서 살짝
  // 튀어오르며 멈추는 공용 '고민하는 척' 연출. 상대가 내 카드를 고를 때(위)와
  // 상대가 카드 더미에서 뽑을 카드를 고를 때(아래) 둘 다에 쓴다.
  playCursorSweep(positions, onComplete) {
    const first = positions[0];
    const cursor = this.add.text(first.x, first.y - 30, '▼', {
      fontFamily: FONT_BOLD, fontSize: '26px', color: '#e8c86a',
    }).setOrigin(0.5).setAlpha(0);
    cursor.setDepth(950);
    this.dynamicLayer.add(cursor);

    this.tweens.add({ targets: cursor, alpha: 1, duration: 200 });

    let i = 0;
    const step = () => {
      if (i >= positions.length) {
        this.time.delayedCall(400, () => {
          cursor.destroy();
          onComplete();
        });
        return;
      }
      const p = positions[i];
      const isLast = i === positions.length - 1;
      i += 1;
      this.tweens.add({
        targets: cursor,
        x: p.x,
        y: p.y,
        duration: 500,
        ease: 'Quad.easeInOut',
        onComplete: () => {
          if (isLast) {
            this.tweens.add({
              targets: cursor, scale: 1.4, duration: 220, yoyo: true, ease: 'Sine.easeOut',
            });
          }
          this.time.delayedCall(isLast ? 500 : 260, step);
        },
      });
    };
    step();
  }

  // 남은 카드 더미에서 카드를 뽑을 때, 더미를 섞어서 가운데에 한 줄로 펼친 뒤
  // (플레이어라면) 마음에 드는 카드를 직접 고르게 하고, (봇이라면) 잠깐의
  // '고민' 뒤 하나를 골라 손패 자리로 날아가게 하는 연출.
  playDrawPickSequence(side, newIndex, onComplete) {
    const hand = side === 'bot' ? this.bot.hand : this.human.hand;
    const newSlot = hand.slots[newIndex];
    const { x: targetX, y: targetY } = this.tileScreenPos(side, newIndex, false);

    // 남은 카드 더미 전체 중에서 고를 수 있어야 하므로, 개수는 6장 고정이 아니라
    // 지금 뽑기 직전 시점에 더미에 있던 카드 수(엔진에서 이미 한 장 뽑아간 뒤이므로 +1)로 맞춘다.
    const count = (this.engine ? this.engine.deck.length : 0) + 1;
    const centerX = 600;
    const centerY = MAT_Y + MAT_H / 2;
    const rowY = centerY - TILE_H / 2;
    // 카드 폭의 절반만큼 겹치게 펼쳐서(초반엔 최대 16장), 화면 밖으로 잘리는 일 없이
    // 항상 한 줄에 다 들어오게 한다.
    const step = count > 1 ? TILE_W * 0.5 : TILE_W + 14;
    // 스프레드 전체 폭(카드 한 장 너비까지 포함)이 화면 중앙(centerX)에 오도록 계산.
    const startX = centerX - ((count - 1) * step + TILE_W) / 2;

    const group = this.add.container(0, 0);
    group.setDepth(920);
    this.dynamicLayer.add(group);
    const cards = [];
    for (let i = 0; i < count; i++) {
      const x = startX + i * step;
      // 실제로 뽑힐 카드의 색과는 무관한 장식용 흑/백 번갈이 - 셔플된 더미처럼 보이게 한다.
      const back = this.makeDeckCardBack(x, rowY, i % 2 === 0 ? Color.BLACK : Color.WHITE);
      group.add(back);
      cards.push({
        back, x, y: rowY, cx: x + TILE_W / 2, cy: rowY + TILE_H / 2,
      });
    }

    // 셔플 연출: 순서대로 살짝 튀어오르는 웨이브
    cards.forEach((c, i) => {
      this.tweens.add({
        targets: c.back,
        y: c.cy - 14,
        duration: 220,
        delay: i * 70,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    });

    const pickOne = (chosenIdx) => {
      cards.forEach((c, i) => {
        if (i === chosenIdx) return;
        this.tweens.add({
          targets: c.back,
          alpha: 0,
          y: c.cy - 30,
          duration: 300,
          ease: 'Sine.easeIn',
          onComplete: () => c.back.destroy(),
        });
      });
      const chosen = cards[chosenIdx];
      // 셔플용 장식 뒷면(홀짝 번갈이 흑/백)은 실제 뽑힌 카드 색과 다를 수 있다 -
      // 고른 순간 진짜 색으로 바꿔서, 손패에 놓일 때 갑자기 색이 바뀌는 것처럼
      // 보이던 버그를 없앤다.
      const realBackTexture = newSlot.block.color === Color.BLACK ? 'cardBackBlack' : 'cardBackWhite';
      chosen.back.faceImage?.setTexture(realBackTexture);
      this.tweens.add({
        targets: chosen.back,
        x: targetX + TILE_W / 2,
        y: targetY + TILE_H / 2,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        delay: 200,
        ease: 'Back.easeIn',
        onComplete: () => {
          chosen.back.destroy();
          group.destroy();
          const prevSet = side === 'bot'
            ? (this._prevBotSlotIds || (this._prevBotSlotIds = new Set()))
            : (this._prevHumanSlotIds || (this._prevHumanSlotIds = new Set()));
          prevSet.add(newSlot.slotId);
          // 새 카드가 손에 합류하면서 자리가 밀린 기존 카드들도, 뜬금없이 순간이동하지
          // 않도록 한 번 가운데로 모였다가 새 순서로 다시 펼쳐지는 연출을 거친다.
          this.time.delayedCall(200, () => this.reflowHandMerge(side, onComplete));
        },
      });
    };

    this.time.delayedCall(900, () => {
      if (side === 'player') {
        cards.forEach((c, i) => {
          const hit = this.add.zone(c.x, c.y, TILE_W, TILE_H).setOrigin(0, 0).setInteractive({ useHandCursor: true });
          hit.on('pointerdown', () => {
            cards.forEach((cc) => { if (cc.hit) cc.hit.destroy(); });
            pickOne(i);
          });
          // 뽑을 카드를 고르는 줄에서도 손패 카드와 똑같이, 마우스를 올린
          // 카드만 확대되게 한다.
          hit.on('pointerover', () => {
            c.back.setDepth(950);
            this.tweens.add({
              targets: c.back, scaleX: 1.18, scaleY: 1.18, duration: 120, ease: 'Sine.easeOut',
            });
          });
          hit.on('pointerout', () => {
            c.back.setDepth(920);
            this.tweens.add({
              targets: c.back, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.easeOut',
            });
          });
          c.hit = hit;
          group.add(hit);
        });
      } else {
        // 봇도 카드 더미 위에서 몇 장을 훑어보며 고민하는 척 하다가 하나를 고른다.
        const finalIdx = Phaser.Math.Between(0, count - 1);
        const otherIdxs = cards.map((_, i) => i).filter((i) => i !== finalIdx);
        const decoyIdxs = Phaser.Utils.Array.Shuffle(otherIdxs).slice(0, 2);
        const sweepIdxs = [...decoyIdxs, finalIdx];
        const positions = sweepIdxs.map((i) => ({
          x: cards[i].x + TILE_W / 2,
          y: rowY - 26,
        }));
        this.time.delayedCall(400, () => this.playCursorSweep(positions, () => pickOne(finalIdx)));
      }
    });
  }

  // 카드를 뽑아 손패에 합류시킨 뒤, 삽입 때문에 자리가 밀린 기존 카드들이 순간이동
  // 하듯 뚝 튀지 않도록 - 손패 전체가 잠깐 가운데로 모였다가(합쳐지고) 다시 새
  // 순서로 좌르륵 펼쳐지는(정렬되는) 연출. 끝나면 실제 렌더링으로 넘어간다.
  reflowHandMerge(side, onComplete) {
    const hand = side === 'bot' ? this.bot.hand : this.human.hand;
    if (hand.slots.length === 0) {
      this.render();
      onComplete();
      return;
    }

    const positions = hand.slots.map((slot, i) => {
      const { x, y } = this.tileScreenPos(side, i, slot.revealed);
      const displayBlock = side === 'bot'
        ? { color: slot.block.color, number: slot.revealed ? slot.block.number : null }
        : slot.block;
      return { x, y, displayBlock };
    });

    // 손패가 원래 놓여 있던 줄의 한가운데(카드 중심 기준). 여기로 모였다가 섞이고
    // 다시 제자리로 펼쳐진다. rowY는 들켜서 위로 들린 카드에 휘둘리지 않도록
    // positions[0]가 아니라 줄의 기준선을 그대로 쓴다.
    const rowY = side === 'bot' ? BOT_ROW_Y : PLAYER_ROW_Y;
    const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
    const mergeX = centerX + TILE_W / 2;
    const mergeY = rowY + TILE_H / 2;

    // 연출 내내 직전 렌더의 진짜 타일이 오버레이 뒤에 그대로 남아 있어서, 카드가
    // 가운데로 모이는 순간 원래 자리에 카드가 한 겹 더 보인다. 다 숨겼다가
    // 마지막 render()에서 새 배치로 다시 그린다.
    const hiddenKeys = positions.map((_, i) => this.suppressTile(side, i));

    const overlays = positions.map((p) => {
      // makeTile의 컨테이너 원점이 카드 중심이라(호버 확대가 카드 자기 자신을
      // 기준으로 커지게 하려고 그렇게 만들어뒀다), 축소/확대가 자연히 카드
      // 자리에서 일어난다 - 여기서 따로 중심을 맞춰줄 필요가 없다.
      const tile = this.makeTile(p.x, p.y, p.displayBlock, null);
      tile.setDepth(910);
      this.dynamicLayer.add(tile);
      return { tile, homeX: tile.x, homeY: tile.y };
    });

    const finishReflow = () => {
      overlays.forEach((o) => o.tile.destroy());
      hiddenKeys.forEach((k) => this.restoreTile(k));
      this.render();
      onComplete();
    };

    const spreadOut = () => {
      let doneCount = 0;
      overlays.forEach((o, idx) => {
        this.tweens.add({
          targets: o.tile,
          x: o.homeX,
          y: o.homeY,
          scaleX: 1,
          scaleY: 1,
          duration: 360,
          delay: idx * 40,
          ease: 'Back.easeOut',
          onComplete: () => {
            doneCount += 1;
            if (doneCount === overlays.length) finishReflow();
          },
        });
      });
    };

    // 가운데 겹쳐진 상태에서 좌우로 한 번 엇갈렸다 돌아오는 짧은 '섞기'.
    const shuffleAtCenter = (onDone) => {
      let doneCount = 0;
      overlays.forEach((o, idx) => {
        this.tweens.add({
          targets: o.tile,
          x: mergeX + (idx % 2 === 0 ? -16 : 16),
          duration: 90,
          delay: idx * 12,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            doneCount += 1;
            if (doneCount === overlays.length) onDone();
          },
        });
      });
    };

    let mergedCount = 0;
    overlays.forEach((o) => {
      this.tweens.add({
        targets: o.tile,
        x: mergeX,
        y: mergeY,
        scaleX: 0.55,
        scaleY: 0.55,
        duration: 260,
        ease: 'Sine.easeIn',
        onComplete: () => {
          mergedCount += 1;
          if (mergedCount === overlays.length) {
            this.time.delayedCall(120, () => shuffleAtCenter(spreadOut));
          }
        },
      });
    });
  }

  // 현재 모드에 맞는 짧은 안내문. 주인공 대화창에 표시된다(setGuide 참고).
  static GUIDE_BY_MODE = {
    pick_slot: '상대의 카드 숫자 선택',
    pick_number: '지목할 숫자를 고르세요',
    continue_choice: '계속 도전하시겠습니까?',
    wrong_guess_decision: '사용할 능력을 선택하세요',
    wrong_guess_reveal_pick: '공개할 내 카드를 선택하세요',
    rewind_decision: '되감기를 사용하시겠습니까?',
  };

  render() {
    this.dynamicLayer.removeAll(true);
    // 규칙 창은 씬 루트에 직접 그려서(위 removeAll로는 안 지워짐) 매번 직접 치운다.
    if (this._rulesPopupObjects) {
      this._rulesPopupObjects.forEach((o) => o.destroy());
      this._rulesPopupObjects = null;
    }
    // 뒤집기 같은 연출 오버레이가 "그 자리의 진짜 타일"을 잠시 숨길 수 있도록
    // side+index -> 타일 컨테이너 참조를 들고 있는다. 위 removeAll(true)가 매
    // 렌더마다 이전 타일을 파괴하므로 맵도 여기서 같이 새로 만든다.
    this.tileRefs = new Map();
    this.setGuide(DaVinciCodeScene.GUIDE_BY_MODE[this.mode] || '');

    // 새로 뽑혀서 손패에 추가된 카드(이전 render()엔 없던 slotId)는
    // 톡 튀어오르듯 등장하는 애니메이션을 태운다(draw-pick 연출이 이미 처리한
    // 카드는 prevIds에 미리 추가돼 있어 여기서 다시 애니메이션되지 않는다).
    const prevBotIds = this._prevBotSlotIds || new Set();
    const prevHumanIds = this._prevHumanSlotIds || new Set();
    const curBotIds = new Set();
    const curHumanIds = new Set();

    // 상대(봇) 패 - 미공개는 뒷면. pick_slot/pick_number 모드에서 지목(또는
    // 다른 카드로 재지목)용으로, insightPickActive면 '엿보기' 대상 선택용으로
    // 클릭 가능해진다.
    this.bot.hand.slots.forEach((slot, i) => {
      curBotIds.add(slot.slotId);
      const { x, y } = this.tileScreenPos('bot', i, slot.revealed);
      let onClick = null;
      const pickable = (this.mode === 'pick_slot' || this.mode === 'pick_number') && !slot.revealed;
      if (pickable) {
        onClick = this.insightPickActive ? () => this.onUseInsight(i) : () => this.onPickSlot(i);
      }
      const displayBlock = { color: slot.block.color, number: slot.revealed ? slot.block.number : null };
      const tile = this.makeTile(x, y, displayBlock, onClick);
      this.dynamicLayer.add(tile);
      this.tileRefs.set(`bot:${i}`, tile);
      if (this.hiddenTiles.has(`bot:${i}`)) tile.setVisible(false);
      if (this.mode === 'pick_number' && i === this.selectedSlotPos) {
        const hg = this.add.graphics();
        hg.lineStyle(4, 0xe8c86a, 1);
        hg.strokeRect(x - 4, y - 4, TILE_W + 8, TILE_H + 8);
        this.dynamicLayer.add(hg);
      }
      if (!prevBotIds.has(slot.slotId)) this.playCardEnterAnim(tile);
    });

    // 내 패 - 항상 전부 공개된 상태로 표시. 오답 페널티로 공개할 카드를 직접
    // 고를 때 클릭 가능해진다.
    this.human.hand.slots.forEach((slot, i) => {
      curHumanIds.add(slot.slotId);
      const { x, y } = this.tileScreenPos('player', i, slot.revealed);
      const isRevealPick = this.mode === 'wrong_guess_reveal_pick' && !slot.revealed;
      let onClick = null;
      if (isRevealPick) onClick = () => this.onPickWrongGuessReveal(i);
      const tile = this.makeTile(x, y, slot.block, onClick);
      this.dynamicLayer.add(tile);
      this.tileRefs.set(`player:${i}`, tile);
      if (this.hiddenTiles.has(`player:${i}`)) tile.setVisible(false);
      if (!prevHumanIds.has(slot.slotId)) this.playCardEnterAnim(tile);
    });

    this._prevBotSlotIds = curBotIds;
    this._prevHumanSlotIds = curHumanIds;

    this.drawDeckPile();

    // 대화창 모서리의 SKILL 버튼. 위(상대) 버튼은 상대 소지품 설명 팝업을,
    // 아래(내) 버튼은 지금 당장 쓸 수 있는 능력(엿보기)이 있으면 클릭으로 바로
    // 발동, 아니면 내가 보유한 능력 설명 팝업을 보여준다.
    const oppBtnX = PORTRAIT_W + 10 + (1200 - PORTRAIT_W - 24) - 70;
    this.dynamicLayer.add(this.makeSmallSkillButton(oppBtnX, 18, 60, 26, false, null, this.oppInfoPopup));

    const lanternUsableNow = this.mode === 'pick_slot' && this.humanStrategy.hasSkill('lantern') && !this.insightPickActive;
    const myBtnX = PORTRAIT_W + 10 + (1200 - PORTRAIT_W - 24) - 70;
    const myBtnY = 700 - BOTTOM_H + 18;
    this.dynamicLayer.add(this.makeSmallSkillButton(myBtnX, myBtnY, 60, 26, lanternUsableNow, lanternUsableNow ? () => {
      this.insightPickActive = true;
      this.setPlayerLine('엿볼 상대 블록을 클릭하세요.');
      this.mySkillsPopup.setVisible(false);
      this.render();
    } : null, this.mySkillsPopup));

    // SKILL 버튼 바로 아래의 메뉴 버튼 - 누르면 '나가기' 버튼이 펼쳐진다.
    const menuBtnY = myBtnY + 26 + 8;
    this.dynamicLayer.add(this.makeSmallSkillButton(myBtnX, menuBtnY, 60, 26, false, () => {
      this.menuOpen = !this.menuOpen;
      this.render();
    }, null, '메뉴'));

    if (this.menuOpen) {
      this.dynamicLayer.add(this.makeSmallSkillButton(myBtnX - 78, menuBtnY, 70, 26, true, () => {
        this.bgmDavinci.stop();
        this.scale.resize(960, 540);
        this.scene.start('MapScene', {
          mapKey: this.returnMapKey, returnX: this.returnX, returnY: this.returnY,
        });
      }, null, '나가기'));
      this.dynamicLayer.add(this.makeSmallSkillButton(myBtnX - 78 - 78, menuBtnY, 70, 26, false, () => {
        this.rulesOpen = true;
        this.render();
      }, null, '규칙'));
    }

    if (this.rulesOpen) {
      this.drawRulesPopup();
    }

    if (this.mode === 'pick_number' && this.selectedSlotPos != null) {
      // 지목한 카드 바로 아래에 숫자 선택창이 뜨도록, 위치를 카드 좌표 기준으로 맞춘다.
      const sel = this.tileScreenPos('bot', this.selectedSlotPos, false);
      const cardCenterX = sel.x + TILE_W / 2;
      const cols = 6;
      const btnW = 32;
      const btnH = 32;
      const gap = 4;
      const gridW = cols * btnW + (cols - 1) * gap;
      const gridH = 2 * btnH + gap;
      const pad = 12;
      const titleH = 20;
      const panelW = gridW + pad * 2;
      const panelH = gridH + pad * 2 + titleH;
      const panelX = Phaser.Math.Clamp(cardCenterX - panelW / 2, 8, 1200 - 8 - panelW);
      const panelY = sel.y + TILE_H + 14;

      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.35);
      g.fillRect(panelX + 3, panelY + 3, panelW, panelH);
      g.fillStyle(0x000000, 0.96);
      g.fillRect(panelX, panelY, panelW, panelH);
      g.lineStyle(3, 0xe8c86a, 1);
      g.strokeRect(panelX, panelY, panelW, panelH);
      this.dynamicLayer.add(g);

      const title = this.add.text(panelX + panelW / 2, panelY + 10, '숫자 선택', {
        fontFamily: FONT, fontSize: '10px', color: '#ffffff',
      }).setOrigin(0.5, 0);
      this.dynamicLayer.add(title);

      const gridStartX = panelX + pad;
      const gridStartY = panelY + titleH + pad / 2;
      for (let n = 0; n <= 11; n++) {
        const col = n % cols;
        const row = Math.floor(n / cols);
        const x = gridStartX + col * (btnW + gap);
        const y = gridStartY + row * (btnH + gap);
        this.dynamicLayer.add(this.makeNumberButton(x, y, n, () => this.onPickNumber(n)));
      }
    }

    if (this.mode === 'continue_choice') {
      this.dynamicLayer.add(this.makeChoiceButton(ACTION_X, ACTION_Y, '계속 도전', () => {
        this.mode = 'idle';
        this.humanStrategy.resolveContinue(true);
      }, true));
      this.dynamicLayer.add(this.makeChoiceButton(ACTION_X + 170, ACTION_Y, '턴 넘기기', () => {
        this.mode = 'idle';
        this.humanStrategy.resolveContinue(false);
      }, true));
    }

    if (this.mode === 'wrong_guess_decision') {
      let y = ACTION_Y;
      this.wrongGuessUsable.forEach((key) => {
        const label = ITEM_SKILLS[key].skill;
        this.dynamicLayer.add(this.makeChoiceButton(ACTION_X, y, `${label} 사용`, () => this.onChooseWrongGuessSkill(key)));
        y += 34;
      });
      this.dynamicLayer.add(this.makeChoiceButton(ACTION_X, y, '사용 안 함', () => this.onChooseWrongGuessSkill(null)));
    }

    if (this.mode === 'rewind_decision') {
      this.dynamicLayer.add(this.makeChoiceButton(ACTION_X, ACTION_Y, '되감기 사용', () => {
        this.mode = 'idle';
        this.humanStrategy.resolveRewindDecision(true);
        this.render();
      }));
      this.dynamicLayer.add(this.makeChoiceButton(ACTION_X + 170, ACTION_Y, '그냥 두기', () => {
        this.mode = 'idle';
        this.humanStrategy.resolveRewindDecision(false);
        this.render();
      }));
    }

    if (this.mode === 'over') {
      // 이기면 심문 선택지 화면(SuspectChoiceScene)으로, 지면 예전처럼 대화를
      // 걸었던 자리로 바로 돌아간다.
      const label = this.matchWon ? '심문 계속하기' : '맵으로 돌아가기';
      this.dynamicLayer.add(this.makeChoiceButton(ACTION_X, ACTION_Y + 40, label, () => {
        this.bgmDavinci.stop();
        this.scale.resize(960, 540);
        if (this.matchWon) {
          this.scene.start('SuspectChoiceScene', {
            npcId: this.npcId, npcName: this.npcName, returnMapKey: this.returnMapKey,
            returnX: this.returnX, returnY: this.returnY,
          });
        } else {
          this.scene.start('MapScene', {
            mapKey: this.returnMapKey, returnX: this.returnX, returnY: this.returnY,
          });
        }
      }));
    }
  }

  onPickSlot(pos) {
    this.selectedSlotPos = pos;
    this.mode = 'pick_number';
    this.render();
  }

  onPickNumber(n) {
    this.mode = 'idle';
    this.humanStrategy.resolveGuess(this.selectedSlotPos, n);
  }

  onUseInsight(pos) {
    const number = this.humanStrategy.useInsight(pos);
    this.insightPickActive = false;
    if (number != null) {
      this.setPlayerLine(`엿보기 결과: 이 위치는 [${number}]다. 이어서 지목하세요.`);
    }
    this.render();
  }

  onChooseWrongGuessSkill(key) {
    if (key === null) {
      // 능력을 안 쓰기로 했어도 자동으로 공개되지 않는다 - 공개할 카드를 직접 고른다.
      this.mode = 'wrong_guess_reveal_pick';
      this.render();
      return;
    }
    if (key === 'bloodyTowel') {
      this.humanStrategy.markUsed('bloodyTowel');
      this.mode = 'idle';
      this.humanStrategy.resolveWrongGuessDecision({ skipReveal: true, retryWithoutPenalty: false, skillLabel: ITEM_SKILLS.bloodyTowel.skill });
      this.render();
      return;
    }
    if (key === 'sickle' || key === 'speedRead') {
      this.humanStrategy.markUsed(key);
      this.mode = 'idle';
      this.humanStrategy.resolveWrongGuessDecision({ skipReveal: false, retryWithoutPenalty: true, skillLabel: ITEM_SKILLS[key].skill });
      this.render();
    }
  }

  // 능력을 안 썼을 때(또는 애초에 쓸 능력이 없을 때) 오답 페널티로 공개할
  // 내 카드를 직접 고르는 단계. 스킬을 소모하지 않으므로 skill_used 이벤트 없이
  // revealIndex로만 엔진에 전달한다.
  onPickWrongGuessReveal(idx) {
    this.mode = 'idle';
    this.humanStrategy.resolveWrongGuessDecision({
      skipReveal: false, revealIndex: idx, retryWithoutPenalty: false,
    });
    this.render();
  }

  // ---- 픽셀아트 스타일 UI 조각들: 전부 각진 모서리 + 굵은 테두리 + 그림자 오프셋으로 그린다 ----

  // block: { color, number } 형태. number가 null이면 미공개 - 색은 그대로 칠하되 숫자만 비운다.
  // x,y는 여전히 타일의 좌상단(다른 모든 호출부와 동일)이지만, 실제로는 카드
  // 중심을 기준으로 그린 뒤 컨테이너를 그 중심 좌표에 놓는다 - 클릭 가능한
  // 카드에 호버 확대 효과를 줄 때, 카드 자기 자신을 기준으로 커지게 하려면
  // (다른 방향으로 밀리지 않고 제자리에서 커지려면) 컨테이너의 원점이 카드
  // 중심과 같아야 하기 때문이다.
  // 미공개(block.number === null)면 카드 뒷면 그림을, 공개면 숫자가 이미 그려진
  // 카드 앞면 그림(black-0~11.png / white-0~11.png)을 쓴다. 흰/검 카드 색은
  // block.color로 고른다.
  makeTile(x, y, block, onClick) {
    const isHidden = block.number === null;
    const isBlack = block.color === Color.BLACK;
    const cardKey = isHidden
      ? (isBlack ? 'cardBackBlack' : 'cardBackWhite')
      : cardFaceKey(isBlack, block.number);

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(-TILE_W / 2 + 3, -TILE_H / 2 + 3, TILE_W, TILE_H, 6);
    const face = this.add.image(0, 0, cardKey).setDisplaySize(TILE_W, TILE_H);

    const children = [shadow, face];

    let hitZone = null;
    if (onClick) {
      hitZone = this.add.zone(0, 0, TILE_W, TILE_H).setOrigin(0.5).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', onClick);
      children.push(hitZone);
    }

    const container = this.add.container(x + TILE_W / 2, y + TILE_H / 2, children);

    if (hitZone) {
      // 클릭 가능한 카드에 마우스를 올리면 그 카드만 살짝 확대되며 앞으로
      // 나온다 - 지금 고를 수 있는 카드라는 걸 알려주는 힌트.
      hitZone.on('pointerover', () => {
        container.setDepth(950);
        this.tweens.add({
          targets: container, scaleX: 1.18, scaleY: 1.18, duration: 120, ease: 'Sine.easeOut',
        });
      });
      hitZone.on('pointerout', () => {
        container.setDepth(0);
        this.tweens.add({
          targets: container, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.easeOut',
        });
      });
    }

    return container;
  }

  // 남은 카드 더미 표시나 draw-pick 스프레드에 쓰는 카드 뒷면 그림.
  // makeTile과 마찬가지로 컨테이너 원점을 카드 중심에 둔다 - 카드 뭉치에서
  // 뽑을 카드를 고를 때도 호버로 확대하면 카드 자기 자신을 기준으로 커져야
  // 하기 때문이다.
  makeDeckCardBack(x, y, color = Color.BLACK) {
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.35);
    shadow.fillRoundedRect(-TILE_W / 2 + 3, -TILE_H / 2 + 3, TILE_W, TILE_H, 6);
    const backTexture = color === Color.BLACK ? 'cardBackBlack' : 'cardBackWhite';
    const face = this.add.image(0, 0, backTexture).setDisplaySize(TILE_W, TILE_H);
    const container = this.add.container(x + TILE_W / 2, y + TILE_H / 2, [shadow, face]);
    // 뽑기 연출에서 "고른 순간" 실제 색으로 바꿔줄 수 있도록 얼굴 이미지를 노출해둔다
    // (playDrawPickSequence의 pickOne 참고 - 안 그러면 셔플용 장식 색(홀짝 번갈이)이
    // 카드가 손패에 실제로 놓일 때의 진짜 색과 달라 보이는 버그가 생긴다).
    container.faceImage = face;
    return container;
  }

  // 새로 뽑힌 카드가 손패에 나타날 때 톡 튀어오르듯 커지는 등장 연출.
  playCardEnterAnim(tile) {
    tile.setAlpha(0);
    tile.setScale(0.5);
    tile.y -= 18;
    this.tweens.add({
      targets: tile,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      y: tile.y + 18,
      duration: 520,
      ease: 'Back.easeOut',
    });
  }

  // 상대 카드의 숫자(0~11)를 지목하는 버튼 - 검은 배경 + 흰 글자.
  makeNumberButton(x, y, n, onClick) {
    const w = 32;
    const h = 32;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRect(x + 2, y + 2, w, h);
    g.fillStyle(0x000000, 1);
    g.fillRect(x, y, w, h);
    g.lineStyle(2, 0xe8c86a, 1);
    g.strokeRect(x, y, w, h);
    const text = this.add.text(x + w / 2, y + h / 2, String(n), { fontFamily: FONT_BOLD, fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    const hitZone = this.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', onClick);
    return this.add.container(0, 0, [g, text, hitZone]);
  }

  // dark: true면 검은 배경 + 흰 글자('계속 도전'/'턴 넘기기' 등 핵심 선택지용),
  // 기본은 초록 배경(스킬/되감기 등 그 외 선택 버튼용).
  makeChoiceButton(x, y, label, onClick, dark = false) {
    const w = 150;
    const h = 30;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRect(x + 3, y + 3, w, h);
    g.fillStyle(dark ? 0x000000 : 0x2f9e6e, 1);
    g.fillRect(x, y, w, h);
    g.lineStyle(2, dark ? 0xe8c86a : 0x1a1a1a, 1);
    g.strokeRect(x, y, w, h);
    const text = this.add.text(x + w / 2, y + h / 2, label, { fontFamily: FONT, fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);
    const hitZone = this.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', onClick);
    return this.add.container(0, 0, [g, text, hitZone]);
  }

  // 대화창 모서리에 붙는 작은 버튼(SKILL/메뉴 공용). highlight면 지금 바로 쓸 수
  // 있는 능력이 있다는 뜻이라 주황색으로 강조한다. 마우스를 올리면 popup이 뜬다.
  makeSmallSkillButton(x, y, w, h, highlight, onClick, popup, label = 'SKILL') {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRect(x + 2, y + 2, w, h);
    g.fillStyle(highlight ? 0xd98c3a : 0x33414a, 1);
    g.fillRect(x, y, w, h);
    g.lineStyle(2, 0x1a1a1a, 1);
    g.strokeRect(x, y, w, h);
    const text = this.add.text(x + w / 2, y + h / 2, label, { fontFamily: FONT, fontSize: '9px', color: '#ffffff' }).setOrigin(0.5);
    const children = [g, text];
    const hitZone = this.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: onClick != null });
    if (onClick) hitZone.on('pointerdown', onClick);
    if (popup) {
      hitZone.on('pointerover', () => popup.setVisible(true));
      hitZone.on('pointerout', () => popup.setVisible(false));
    }
    children.push(hitZone);
    return this.add.container(0, 0, children);
  }

  // 설명 팝업. 내용 길이에 맞춰 높이를 자동으로 계산한다.
  // growUp이 true면 anchorY를 '아래쪽 기준점'으로 보고 위로 자라난다,
  // 아니면 anchorY를 '위쪽 기준점'으로 보고 아래로 자라난다.
  makeInfoPopup(x, w, anchorY, text, growUp) {
    const t = this.add.text(0, 0, text, { fontFamily: FONT, fontSize: '10px', color: '#e8e2c8', lineSpacing: 6, wordWrap: { width: w - 24 } });
    const h = t.height + 24;
    const topY = growUp ? anchorY - h : anchorY;
    t.setPosition(x + 12, topY + 12);

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35);
    g.fillRect(x + 3, topY + 3, w, h);
    g.fillStyle(0x0c1a10, 0.97);
    g.fillRect(x, topY, w, h);
    g.lineStyle(3, 0x4a6b52, 1);
    g.strokeRect(x, topY, w, h);

    const container = this.add.container(0, 0, [g, t]);
    container.setDepth(850);
    return container;
  }

  // 메뉴 안 '규칙' 버튼으로 여는 게임 설명 창. 화면 전체를 어둡게 덮어서 뒤의
  // 카드/버튼이 클릭되지 않게 막고, 우측 상단 X를 눌러야 닫힌다.
  //
  // dynamicLayer 안이 아니라 씬 루트에 직접 그린다 - 턴 배너(depth 1000)나
  // 카드 뒤집기/뽑기 연출(dynamicLayer.add를 안 거치는 것들)처럼 render()의
  // dynamicLayer.removeAll() 주기 밖에서 자기 타이머로 사라지는 연출들이
  // 씬 루트에 남아 있으면, dynamicLayer 안에 아무리 depth를 높여 넣어도
  // (dynamicLayer 자체 depth가 0이라) 그 위로 못 올라가 뒤에서 비쳐 보인다.
  drawRulesPopup() {
    // 800x600 기준으로 만들어진 창을 우리 씬 크기(1200x700)의 가운데로 옮겨왔다
    // (가로/세로 여백을 원래 비율 그대로 유지: 가로 70px, 세로 36px 여백).
    const boxX = 270;
    const boxY = 86;
    const boxW = 660;
    const boxH = 528;

    // 뒤의 카드/버튼 클릭을 막는 어두운 배경(그 자체도 클릭을 먹어서 아래로 안 새게 한다).
    const backdrop = this.add.zone(0, 0, 1200, 700).setOrigin(0, 0).setInteractive();
    const dim = this.add.graphics();
    dim.fillStyle(0x000000, 0.65);
    dim.fillRect(0, 0, 1200, 700);
    dim.setDepth(1500);
    backdrop.setDepth(1500);

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35);
    g.fillRect(boxX + 4, boxY + 4, boxW, boxH);
    g.fillStyle(0x1a1410, 0.98);
    g.fillRect(boxX, boxY, boxW, boxH);
    g.lineStyle(3, 0xe8c86a, 1);
    g.strokeRect(boxX, boxY, boxW, boxH);
    g.setDepth(1501);

    const title = this.add.text(boxX + boxW / 2, boxY + 26, '게임 규칙', {
      fontFamily: FONT_BOLD, fontSize: '18px', color: '#e8c86a',
    }).setOrigin(0.5).setDepth(1501);

    const rulesText = [
      '0~11 숫자가 적힌 흑/백 블록 24개로 1:1 대결합니다.',
      '',
      '시작할 때 각자 4장씩 받고, 자기 차례마다 카드 뭉치에서 1장을 뽑아',
      '왼쪽부터 작은 수가 되도록 자기 패에 끼워 넣습니다.',
      '',
      '색은 항상 보이지만, 숫자는 공개되기 전까지 자신 외에는 보이지 않습니다.',
      '',
      '자기 차례에 상대의 미공개 블록 하나를 골라 숫자를 지목합니다.',
      '맞히면 그 블록이 공개되고, "계속 도전" 또는 "턴 넘기기"를 고를 수',
      '있습니다. 계속 도전하면 오답이 나올 때까지 계속 지목할 수 있습니다.',
      '',
      '틀리면 방금 뽑은 자신의 블록이 공개되고 턴이 상대에게 넘어갑니다.',
      '',
      '자신의 블록이 모두 공개되면 패배합니다.',
      '',
      '용의자(상대)를 이기면 그들이 가진 특수 능력을 얻어, 이후 대결에서',
      '쓸 수 있습니다.',
    ].join('\n');

    const body = this.add.text(boxX + 24, boxY + 58, rulesText, {
      fontFamily: FONT, fontSize: '13px', color: '#e8e2c8', lineSpacing: 9,
      wordWrap: { width: boxW - 48 },
    }).setDepth(1501);

    // 우측 상단 닫기(X) 버튼 - 규칙을 다 읽고 나서야 닫도록 다른 곳엔 닫는 방법이 없다.
    const closeSize = 30;
    const closeX = boxX + boxW - closeSize - 10;
    const closeY = boxY + 10;
    const closeG = this.add.graphics();
    closeG.fillStyle(0x2b2620, 1);
    closeG.fillRect(closeX, closeY, closeSize, closeSize);
    closeG.lineStyle(2, 0xe8c86a, 1);
    closeG.strokeRect(closeX, closeY, closeSize, closeSize);
    closeG.setDepth(1501);
    const closeText = this.add.text(closeX + closeSize / 2, closeY + closeSize / 2, 'X', {
      fontFamily: FONT_BOLD, fontSize: '16px', color: '#e8c86a',
    }).setOrigin(0.5).setDepth(1501);
    const closeZone = this.add.zone(closeX, closeY, closeSize, closeSize)
      .setOrigin(0, 0).setInteractive({ useHandCursor: true });
    closeZone.setDepth(1501);
    closeZone.on('pointerdown', () => {
      this.rulesOpen = false;
      this.render();
    });

    // dynamicLayer 밖(씬 루트)에 직접 두므로, render()의 dynamicLayer.removeAll()로는
    // 안 지워진다 - 다음 render() 맨 앞에서 직접 치워줘야 한다(render() 쪽 참고).
    this._rulesPopupObjects = [backdrop, dim, g, title, body, closeG, closeText, closeZone];
  }

  // 상단/하단의 '캐릭터 초상' 자리 - 진짜 아트가 없으므로 격자 실루엣을 픽셀 단위로 채운다.
  drawPortraitBox(x, y, w, h, bgColor, silColor) {
    const g = this.add.graphics();
    g.fillStyle(bgColor, 1);
    g.fillRect(x, y, w, h);

    const cols = SUSPECT_SILHOUETTE[0].length;
    const rows = SUSPECT_SILHOUETTE.length;
    const inset = 14;
    const px = Math.floor(Math.min(w - inset * 2, h - inset * 2) / rows);
    const gridW = px * cols;
    const gridH = px * rows;
    const offsetX = x + (w - gridW) / 2;
    const offsetY = y + (h - gridH) / 2;
    g.fillStyle(silColor, 1);
    SUSPECT_SILHOUETTE.forEach((row, ry) => {
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] === '1') g.fillRect(offsetX + rx * px, offsetY + ry * px, px, px);
      }
    });
  }

  // 대화창 - 종이 색 바탕에 굵은 테두리, 안쪽에 얇은 라인을 하나 더 둘러서
  // 도트 게임 대화창 특유의 이중 테두리 느낌을 낸다.
  drawDialogueBox(x, y, w, h) {
    const g = this.add.graphics();
    g.fillStyle(0xf5f0e0, 1);
    g.fillRect(x, y, w, h);
    g.lineStyle(1, 0xc9bfa0, 1);
    g.strokeRect(x + 5, y + 5, w - 10, h - 10);
  }

  // ---- 배경 연출 (원목 테이블 위에 초록 카드 매트를 펼쳐놓은 느낌) ----
  // 사용자가 제공한 원목 사진을 화면 전체 배경으로 깔고, 그 위에 초록 매트
  // 이미지를 대전이 벌어지는 가운데 띠(매트 영역)에만 올린다 - 매트 가장자리
  // 밖으로 원목이 살짝 비쳐서 "테이블 위에 매트를 깔았다"는 느낌을 낸다.
  drawWoodBackground() {
    this.add.image(600, 350, 'tableWood').setDisplaySize(1200, 700);
  }

  drawTableMat() {
    const margin = 8; // 매트를 살짝(약 2px씩) 더 크게
    const cx = 600;
    const cy = MAT_Y + MAT_H / 2;
    this.add.image(cx, cy, 'tableMat').setDisplaySize(1200 - margin * 2, MAT_H - margin * 2);
  }

  // 남은 덱을 매트 왼쪽 중단에 쌓인 카드 더미로 표시한다 (장식용, 클릭 불가).
  // 남은 장수 표기는 더미 아래에 따로 자리를 차지하지 않고 맨 위 카드 위에
  // 겹쳐서 보여준다.
  drawDeckPile() {
    const deckCount = this.engine ? this.engine.deck.length : 0;
    const stackX = 100;
    const stackY = MAT_Y + MAT_H / 2 - TILE_H / 2;
    const layers = deckCount > 0 ? Math.min(4, Math.ceil(deckCount / 6)) : 0;
    for (let i = 0; i < layers; i++) {
      const back = this.makeDeckCardBack(stackX - i * 3, stackY - i * 3, i % 2 === 0 ? Color.BLACK : Color.WHITE);
      this.dynamicLayer.add(back);
    }
    // 맨 위(가장 앞) 카드는 층이 쌓일수록 -i*3만큼 왼쪽 위로 밀려 있으므로,
    // 텍스트도 그 실제 맨 위 카드의 중심(topX,topY)에 맞춰야 카드 중앙에
    // 제대로 얹힌다 - 항상 stackX,stackY(맨 아래 층 기준)에 두면 층이 많을 때
    // 카드 중심에서 아래-오른쪽으로 어긋나 보인다.
    const topLayerOffset = Math.max(0, layers - 1) * 3;
    const topX = stackX - topLayerOffset;
    const topY = stackY - topLayerOffset;
    const countText = this.add
      .text(topX + TILE_W / 2, topY + TILE_H / 2, `${deckCount}`, {
        fontFamily: FONT_BOLD, fontSize: '18px', color: '#e8c86a', stroke: '#1a1410', strokeThickness: 4,
      })
      .setOrigin(0.5);
    this.dynamicLayer.add(countText);
  }
}
