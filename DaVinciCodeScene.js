// Player, MatchEngine, SkilledHumanInputStrategy, makeBotStrategy, Color,
// BOT_ITEM_ASSIGNMENT, ITEM_SKILLS는 daVinciLogic.js가 만드는 전역 값들이다.
// (index.html에서 daVinciLogic.js를 이 파일보다 먼저 로드해야 한다.)

const TILE_W = 66;
const TILE_H = 96;
const FONT = 'Galmuri9, monospace';
const FONT_BOLD = 'Galmuri11, monospace';
const REVEAL_LIFT = 20; // 내 카드가 상대에게 들켰을 때 이만큼 위로 들어올려서 표시한다

// botName -> 카드 배경 이미지 테마. 그림 없는 봇(봇2=docter)은 기존처럼 색깔 사각형으로
// 그려진다. 새 용의자 카드 그림을 받으면 여기 항목만 추가하면 된다.
const CARD_THEME_BY_BOT = {
  봇1: 'wife',
  봇3: 'hunter',
  봇4: 'farmer',
  봇5: 'painter',
  봇6: 'fisher',
};

// 화면을 위(상대) / 가운데(매트) / 아래(주인공) 3단으로 나눈다.
// 위/아래 초상+대화창은 크기를 동일하게 맞췄고(요청사항 10), SKILL은 카드 줄 옆
// 원형 버튼 대신 각 대화창 모서리의 작은 버튼으로 옮겨서(요청사항 9) 매트 가운데를
// 더 넓게 비워 카드를 크게 키울 수 있게 했다(요청사항 8).
const TOP_H = 120;
const BOTTOM_H = 120;
const MAT_Y = TOP_H;
const MAT_H = 600 - TOP_H - BOTTOM_H;
const PORTRAIT_W = 140;

const BOT_ROW_Y = MAT_Y + 24; // 144
const PLAYER_ROW_Y = MAT_Y + MAT_H - TILE_H - 20; // 376
const CARD_START_X = 150;
const CARD_STEP = TILE_W + 10;
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
    start: '수사이라... 재밌겠네. 어디 한번 해보시지.',
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
    start: '…수사? 좋아. 논리로 승부하지.',
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
    // 대전이 끝나고 "맵으로 돌아가기"를 누르면 원래 있던 맵으로 정확히 돌아가야 하므로
    // MapScene이 launchNextGame()에서 넘겨준 원래 맵 키를 기억해둔다.
    this.returnMapKey = (data && data.returnMapKey) || 'map_01_village';
    // 이 씬은 800x600 레이아웃을 그대로 가정하고 만들어져 있는데, 마을 게임 화면은
    // 960x540이라 크기가 다르다(의도된 설계). 씬이 시작될 때만 캔버스를 800x600으로
    // 바꾸고, 나중에 맵으로 돌아갈 때 다시 960x540으로 되돌린다.
    this.scale.resize(800, 600);
  }

  preload() {
    // 코인토스에 쓰는 금화 양면 이미지 (사용자가 제공한 그림에서 잘라낸 것).
    const v = Date.now();
    this.load.image('coinFaceA', `asset/davinci/coin_face_a.png?v=${v}`);
    this.load.image('coinFaceB', `asset/davinci/coin_face_b.png?v=${v}`);

    // 카드 배경 그림. 지금 상대(botName)에 해당하는 테마가 있을 때만 불러온다.
    this.cardTheme = CARD_THEME_BY_BOT[this.botName] || null;
    if (this.cardTheme) {
      this.load.image('cardBlack', `asset/davinci/card-black-${this.cardTheme}.png?v=${v}`);
      this.load.image('cardWhite', `asset/davinci/card-white-${this.cardTheme}.png?v=${v}`);
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
    this.drawForestMat();

    const skillKey = BOT_ITEM_ASSIGNMENT[this.botName];
    this.skillInfo = skillKey ? ITEM_SKILLS[skillKey] : null;
    this.flavor = BOT_FLAVOR_LINES[this.botName] || {};

    const unlocked = this.registry.get('unlockedSkills') || [];

    // 위/아래 캐릭터 초상 + 대화창. 크기를 동일하게 맞췄고, 두 대화창 모두
    // 이제 '주인공/봇이 서로 대화하는' 용도의 짧은 한 줄 텍스트만 표시한다
    // (로그·스크롤 기능은 폐기).
    this.drawPortraitBox(0, 0, PORTRAIT_W, TOP_H, 0xd8cfae, 0x2b2620);
    this.drawDialogueBox(PORTRAIT_W + 10, 10, 800 - PORTRAIT_W - 24, TOP_H - 20);
    this.opponentDialogueText = this.add.text(PORTRAIT_W + 24, 22, '', {
      fontFamily: FONT, fontSize: '12px', color: '#2b2620', lineSpacing: 4,
      wordWrap: { width: 520 },
    });

    this.drawPortraitBox(0, 600 - BOTTOM_H, PORTRAIT_W, BOTTOM_H, 0xc9dce0, 0x1a3a52);
    this.drawDialogueBox(PORTRAIT_W + 10, 600 - BOTTOM_H + 10, 800 - PORTRAIT_W - 24, BOTTOM_H - 20);
    this.playerDialogueText = this.add.text(PORTRAIT_W + 24, 600 - BOTTOM_H + 22, '', {
      fontFamily: FONT, fontSize: '12px', color: '#2b2620', lineSpacing: 4,
      wordWrap: { width: 520 },
    });

    this.dynamicLayer = this.add.container(0, 0);

    // 대화창은 이제 대사/반응 전용이라(로그·안내문 폐기), 지금 뭘 해야 하는지
    // 알려주는 짧은 안내문은 대신 매트 상단, 턴 배너가 지나간 자리 아래에 둔다.
    this.guideText = this.add.text(400, MAT_Y + 5, '', {
      fontFamily: FONT, fontSize: '11px', color: '#ffe9a8',
    }).setOrigin(0.5, 0);
    this.guideText.setDepth(5);

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
    this.mySkillsPopup = this.makeInfoPopup(460, 320, 600 - BOTTOM_H - 8, mySkillLines, true);
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
    // | wrong_guess_decision | letter_redirect_pick | rewind_decision | over
    this.selectedSlotPos = null;
    this.insightPickActive = false;
    this.menuOpen = false;

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
    this.humanStrategy.onNeedWrongGuessDecision = (obs, usable, drawnIndex) => {
      this.pendingUIUpdate = () => {
        this.wrongGuessUsable = usable;
        this.wrongGuessDrawnIndex = drawnIndex;
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

    // '심문 시작' 배너 -> 주인공 대사 한 번 -> 상대 대사 한 번(둘 다 한 글자씩
    // 타이핑되는 연출) -> '선공 결정' 배너 -> 코인토스, 순서로 진행한다.
    this.showBanner('심문 시작', `vs ${this.botName}`);
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

    const startX = 400;
    const groundY = 300;
    const peakY = 150;

    this.coinShadow = this.add.ellipse(startX, groundY + 44, 60, 14, 0x000000, 0.35);
    this.coinSprite = this.add.image(0, 0, 'coinFaceA').setDisplaySize(78, 78);
    this.coinLabel = this.add.text(0, 52, '나', { fontFamily: FONT_BOLD, fontSize: '13px', color: '#ffe9a8' }).setOrigin(0.5);
    this.coinContainer = this.add.container(startX, groundY, [this.coinSprite, this.coinLabel]);

    const startingPlayer = Math.random() < 0.5 ? 0 : 1;
    const winnerLabel = startingPlayer === 0 ? '나' : this.botName;

    const baseScaleX = this.coinSprite.scaleX;
    let showHuman = true;
    const toggleFace = () => {
      showHuman = !showHuman;
      this.coinSprite.setTexture(showHuman ? 'coinFaceA' : 'coinFaceB');
      this.coinLabel.setText(showHuman ? '나' : this.botName);
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
            this.coinLabel.setText(winnerLabel);
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
    this.playInitialDealAnimation(() => {
      (this._dealPlaceholders || []).forEach((t) => t.destroy());
      this._dealPlaceholders = [];
      this._prevBotSlotIds = new Set(this.bot.hand.slots.map((s) => s.slotId));
      this._prevHumanSlotIds = new Set(this.human.hand.slots.map((s) => s.slotId));
      this.render();
      // 엔진은 사람 입력을 기다리는 지점 외에는 UI를 전혀 기다려주지 않고
      // 즉시 진행한다 - 결과(누가 이겼는지)는 이벤트 큐를 다 소비한 뒤
      // this.engine.winner를 보고 처리한다(drainQueue 참고).
      this.engine.playFullMatch();
    });
  }

  // 대전 시작 직후 초기 4장씩 배분을, 실제 턴 진행과 똑같은 방식으로 보여준다:
  // "나의 턴" 배너 -> 카드 뭉치 정렬 -> 그 자리에서 주인공 카드 4장이 채워짐,
  // 그 다음 "상대 턴" 배너 -> 카드 뭉치 정렬 -> 봇 카드 4장이 채워짐. 실제 패
  // 구성은 이미 엔진 생성자가 다 정해뒀으므로, 여기서는 순수 시각 연출만 담당한다.
  playInitialDealAnimation(onComplete) {
    const dealSide = (side, next) => {
      this.showBanner(side === 'player' ? '나의 턴' : '상대 턴');
      this.time.delayedCall(1300, () => this.playInitialSpreadDeal(side, next));
    };
    dealSide('player', () => dealSide('bot', onComplete));
  }

  // 카드 더미를 한 줄로 펼쳐 보여준 뒤, 그 중 4장을 side의 손패 자리로 하나씩
  // 날려 보낸다(초기 배분 전용 - 실제 값은 이미 정해져 있어 클릭 선택은 없다).
  playInitialSpreadDeal(side, onComplete) {
    const count = (this.engine ? this.engine.deck.length : 0) + 1;
    const centerX = 400;
    const centerY = MAT_Y + MAT_H / 2;
    const rowY = centerY - TILE_H / 2;
    const step = count > 1 ? TILE_W * 0.5 : TILE_W + 14;
    const startX = centerX - ((count - 1) * step + TILE_W) / 2;

    const group = this.add.container(0, 0);
    group.setDepth(920);
    const cards = [];
    for (let i = 0; i < count; i++) {
      const x = startX + i * step;
      const back = this.makeDeckCardBack(x, rowY, i % 2 === 0 ? Color.BLACK : Color.WHITE);
      group.add(back);
      cards.push({ back, x, y: rowY });
    }
    cards.forEach((c, i) => {
      this.tweens.add({
        targets: c.back, y: -14, duration: 220, delay: i * 25, yoyo: true, ease: 'Sine.easeOut',
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
      const dx = target.x - chosen.x;
      const dy = target.y - chosen.y;

      this.tweens.add({
        targets: chosen.back,
        x: dx,
        y: dy,
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
  // 끝날 때까지 기다렸다가 다음 이벤트를 처리한다. ----

  onEngineEvent(event) {
    this.eventQueue.push(event);
    this.drainQueue();
  }

  async drainQueue() {
    if (this.draining) return;
    this.draining = true;
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      // eslint-disable-next-line no-await-in-loop
      await this.handleEvent(event);
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

  // 매트 상단의 짧은 안내문("지목할 숫자를 고르세요" 등)을 갱신한다.
  setGuide(text) {
    this.guideText.setText(text);
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
    const cx = 400;
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

  // side('bot'|'player') + index로 화면상의 타일 좌상단 좌표를 구한다.
  // 내 카드(player)가 상대에게 들켰을 때만 REVEAL_LIFT만큼 위로 들어올린다.
  // 상대(bot) 쪽은 나중에 카드 뒷면 디자인 자체가 공개 여부를 구분해줄 것이므로
  // 들어올리지 않는다.
  tileScreenPos(side, index, revealed) {
    const x = CARD_START_X + index * CARD_STEP;
    const baseY = side === 'bot' ? BOT_ROW_Y : PLAYER_ROW_Y;
    const lift = side === 'player' && revealed ? REVEAL_LIFT : 0;
    return { x, y: baseY - lift };
  }

  // 오답 연출: 그 자리 카드 위에 빨간 테두리 + 좌우 진동을 재생하는 임시 오버레이.
  flashWrongTile(side, index) {
    const { x, y } = this.tileScreenPos(side, index, false);
    const cx = x + TILE_W / 2;
    const cy = y + TILE_H / 2;

    const face = this.add.graphics();
    face.fillStyle(0x000000, 0.3);
    face.fillRect(-TILE_W / 2 + 3, -TILE_H / 2 + 3, TILE_W, TILE_H);
    face.fillStyle(0x1f1f22, 1);
    face.fillRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
    const mark = this.add.text(0, 0, '?', { fontFamily: FONT_BOLD, fontSize: '20px', color: '#f0ece0' }).setOrigin(0.5);

    const border = this.add.graphics();
    const drawBorder = (alpha) => {
      border.clear();
      border.lineStyle(4, 0xe23b3b, alpha);
      border.strokeRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
    };
    drawBorder(1);

    const overlay = this.add.container(cx, cy, [face, mark, border]);
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
      onComplete: () => overlay.destroy(),
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

    const bg = block.color === Color.BLACK ? 0x1f1f22 : 0xf3efe2;
    const borderColor = block.color === Color.BLACK ? 0x50504e : 0x2b2620;
    const textColor = block.color === Color.BLACK ? '#f0ece0' : '#1a1a1a';

    const g = this.add.graphics();
    const label = this.add.text(0, 0, '', { fontFamily: FONT_BOLD, fontSize: '20px', color: textColor }).setOrigin(0.5);

    const drawFace = (revealed) => {
      g.clear();
      g.fillStyle(0x000000, 0.3);
      g.fillRect(-TILE_W / 2 + 3, -TILE_H / 2 + 3, TILE_W, TILE_H);
      if (revealed) {
        g.fillStyle(bg, 1);
        g.fillRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
        g.lineStyle(3, borderColor, 1);
        g.strokeRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
        label.setColor(textColor);
        label.setText(String(block.number));
      } else {
        // 뒤집기 전 '숨김' 상태도 실제 타일(makeTile)과 완전히 똑같이 그린다 - 색은
        // 이미 공개돼 있으니 그대로 칠하고 숫자만 비운다. 예전엔 이 부분이 무조건
        // 검정+물음표로 하드코딩돼 있어서, 흰 카드가 뒤집히기 시작하는 순간 갑자기
        // 색이 바뀌어 카드 2장이 겹친 것처럼 보이는 원인이었다.
        g.fillStyle(bg, 1);
        g.fillRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
        g.lineStyle(3, borderColor, 1);
        g.strokeRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
        label.setText('');
      }
    };
    drawFace(false);

    const overlay = this.add.container(cx, cy, [g, label]);
    overlay.setDepth(900);

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
                  this.time.delayedCall(300, () => {
                    overlay.destroy();
                    if (onComplete) onComplete();
                  });
                },
              });
            } else {
              this.time.delayedCall(600, () => {
                overlay.destroy();
                if (onComplete) onComplete();
              });
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
    const positions = sequence.map((pos) => ({
      x: CARD_START_X + pos * CARD_STEP + TILE_W / 2,
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
    const targetX = CARD_START_X + newIndex * CARD_STEP;
    const targetY = side === 'bot' ? BOT_ROW_Y : PLAYER_ROW_Y;

    // 남은 카드 더미 전체 중에서 고를 수 있어야 하므로, 개수는 6장 고정이 아니라
    // 지금 뽑기 직전 시점에 더미에 있던 카드 수(엔진에서 이미 한 장 뽑아간 뒤이므로 +1)로 맞춘다.
    const count = (this.engine ? this.engine.deck.length : 0) + 1;
    const centerX = 400;
    const centerY = MAT_Y + MAT_H / 2;
    const rowY = centerY - TILE_H / 2;
    // 카드 폭의 절반만큼 겹치게 펼쳐서(초반엔 최대 16장), 화면 밖으로 잘리는 일 없이
    // 항상 한 줄에 다 들어오게 한다.
    const step = count > 1 ? TILE_W * 0.5 : TILE_W + 14;
    // 스프레드 전체 폭(카드 한 장 너비까지 포함)이 화면 중앙(centerX)에 오도록 계산.
    const startX = centerX - ((count - 1) * step + TILE_W) / 2;

    const group = this.add.container(0, 0);
    group.setDepth(920);
    const cards = [];
    for (let i = 0; i < count; i++) {
      const x = startX + i * step;
      // 실제로 뽑힐 카드의 색과는 무관한 장식용 흑/백 번갈이 - 셔플된 더미처럼 보이게 한다.
      const back = this.makeDeckCardBack(x, rowY, i % 2 === 0 ? Color.BLACK : Color.WHITE);
      group.add(back);
      cards.push({ back, x, y: rowY });
    }

    // 셔플 연출: 순서대로 살짝 튀어오르는 웨이브
    cards.forEach((c, i) => {
      this.tweens.add({
        targets: c.back,
        y: -14,
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
          y: -30,
          duration: 300,
          ease: 'Sine.easeIn',
          onComplete: () => c.back.destroy(),
        });
      });
      const chosen = cards[chosenIdx];
      const dx = targetX - chosen.x;
      const dy = targetY - chosen.y;
      this.tweens.add({
        targets: chosen.back,
        x: dx,
        y: dy,
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

    const rowY = positions[0].y;
    const centerX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;

    const overlays = positions.map((p) => {
      const tile = this.makeTile(p.x, p.y, p.displayBlock, null);
      tile.setDepth(910);
      return { tile, dx: centerX - p.x, dy: rowY - p.y };
    });

    const finishReflow = () => {
      overlays.forEach((o) => o.tile.destroy());
      this.render();
      onComplete();
    };

    const spreadOut = () => {
      let doneCount = 0;
      overlays.forEach((o, idx) => {
        this.tweens.add({
          targets: o.tile,
          x: 0,
          y: 0,
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

    let mergedCount = 0;
    overlays.forEach((o) => {
      this.tweens.add({
        targets: o.tile,
        x: o.dx,
        y: o.dy,
        scaleX: 0.55,
        scaleY: 0.55,
        duration: 260,
        ease: 'Sine.easeIn',
        onComplete: () => {
          mergedCount += 1;
          if (mergedCount === overlays.length) this.time.delayedCall(120, spreadOut);
        },
      });
    });
  }

  // 현재 모드에 맞는 짧은 안내문. 대화창(대사 전용)과 분리해서 매트 상단에 둔다.
  static GUIDE_BY_MODE = {
    pick_slot: '상대의 카드 숫자 선택',
    pick_number: '지목할 숫자를 고르세요',
    continue_choice: '계속 도전하시겠습니까?',
    wrong_guess_decision: '사용할 능력을 선택하세요',
    wrong_guess_reveal_pick: '공개할 내 카드를 선택하세요',
    letter_redirect_pick: '대신 공개할 카드를 선택하세요',
    rewind_decision: '되감기를 사용하시겠습니까?',
  };

  render() {
    this.dynamicLayer.removeAll(true);
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
      if (this.mode === 'pick_number' && i === this.selectedSlotPos) {
        const hg = this.add.graphics();
        hg.lineStyle(4, 0xe8c86a, 1);
        hg.strokeRect(x - 4, y - 4, TILE_W + 8, TILE_H + 8);
        this.dynamicLayer.add(hg);
      }
      if (!prevBotIds.has(slot.slotId)) this.playCardEnterAnim(tile);
    });

    // 내 패 - 항상 전부 공개된 상태로 표시. '미끼' 사용 시, 혹은 오답 페널티로
    // 공개할 카드를 직접 고를 때 클릭 가능해진다.
    this.human.hand.slots.forEach((slot, i) => {
      curHumanIds.add(slot.slotId);
      const { x, y } = this.tileScreenPos('player', i, slot.revealed);
      const isLetterPick = this.mode === 'letter_redirect_pick' && !slot.revealed && i !== this.wrongGuessDrawnIndex;
      const isRevealPick = this.mode === 'wrong_guess_reveal_pick' && !slot.revealed;
      let onClick = null;
      if (isLetterPick) onClick = () => this.onPickLetterRedirect(i);
      else if (isRevealPick) onClick = () => this.onPickWrongGuessReveal(i);
      const tile = this.makeTile(x, y, slot.block, onClick);
      this.dynamicLayer.add(tile);
      if (!prevHumanIds.has(slot.slotId)) this.playCardEnterAnim(tile);
    });

    this._prevBotSlotIds = curBotIds;
    this._prevHumanSlotIds = curHumanIds;

    this.drawDeckPile();

    // 대화창 모서리의 SKILL 버튼. 위(상대) 버튼은 상대 소지품 설명 팝업을,
    // 아래(내) 버튼은 지금 당장 쓸 수 있는 능력(엿보기)이 있으면 클릭으로 바로
    // 발동, 아니면 내가 보유한 능력 설명 팝업을 보여준다.
    const oppBtnX = PORTRAIT_W + 10 + (800 - PORTRAIT_W - 24) - 70;
    this.dynamicLayer.add(this.makeSmallSkillButton(oppBtnX, 18, 60, 26, false, null, this.oppInfoPopup));

    const lanternUsableNow = this.mode === 'pick_slot' && this.humanStrategy.hasSkill('lantern') && !this.insightPickActive;
    const myBtnX = PORTRAIT_W + 10 + (800 - PORTRAIT_W - 24) - 70;
    const myBtnY = 600 - BOTTOM_H + 18;
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
        this.scene.start('MapScene', { mapKey: this.returnMapKey });
      }, null, '나가기'));
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
      const panelX = Phaser.Math.Clamp(cardCenterX - panelW / 2, 8, 800 - 8 - panelW);
      const panelY = sel.y + TILE_H + 14;

      const g = this.add.graphics();
      g.fillStyle(0x000000, 0.35);
      g.fillRect(panelX + 3, panelY + 3, panelW, panelH);
      g.fillStyle(0x14304f, 0.96);
      g.fillRect(panelX, panelY, panelW, panelH);
      g.lineStyle(3, 0x3a6ff7, 1);
      g.strokeRect(panelX, panelY, panelW, panelH);
      this.dynamicLayer.add(g);

      const title = this.add.text(panelX + panelW / 2, panelY + 10, '숫자 선택', {
        fontFamily: FONT, fontSize: '10px', color: '#cfe0ff',
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
      }));
      this.dynamicLayer.add(this.makeChoiceButton(ACTION_X + 170, ACTION_Y, '턴 넘기기', () => {
        this.mode = 'idle';
        this.humanStrategy.resolveContinue(false);
      }));
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
      this.dynamicLayer.add(this.makeChoiceButton(ACTION_X, ACTION_Y + 40, '맵으로 돌아가기', () => {
        // 마을 게임 화면 크기(960x540)로 되돌려놓고 원래 있던 맵으로 돌아간다.
        this.bgmDavinci.stop();
        this.scale.resize(960, 540);
        this.scene.start('MapScene', { mapKey: this.returnMapKey });
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
      this.humanStrategy.resolveWrongGuessDecision({ skipReveal: true, redirectIndex: null, retryWithoutPenalty: false });
      this.render();
      return;
    }
    if (key === 'sickle') {
      this.humanStrategy.markUsed('sickle');
      this.mode = 'idle';
      this.humanStrategy.resolveWrongGuessDecision({ skipReveal: false, redirectIndex: null, retryWithoutPenalty: true });
      this.render();
      return;
    }
    if (key === 'letter') {
      this.mode = 'letter_redirect_pick';
      this.render();
    }
  }

  onPickLetterRedirect(idx) {
    this.humanStrategy.markUsed('letter');
    this.mode = 'idle';
    this.humanStrategy.resolveWrongGuessDecision({ skipReveal: false, redirectIndex: idx, retryWithoutPenalty: false });
    this.render();
  }

  // 능력을 안 썼을 때(또는 애초에 쓸 능력이 없을 때) 오답 페널티로 공개할
  // 내 카드를 직접 고르는 단계. '미끼' 능력과 달리 스킬을 소모하지 않으므로
  // skill_used 이벤트 없이 revealIndex로만 엔진에 전달한다.
  onPickWrongGuessReveal(idx) {
    this.mode = 'idle';
    this.humanStrategy.resolveWrongGuessDecision({
      skipReveal: false, redirectIndex: null, revealIndex: idx, retryWithoutPenalty: false,
    });
    this.render();
  }

  // ---- 픽셀아트 스타일 UI 조각들: 전부 각진 모서리 + 굵은 테두리 + 그림자 오프셋으로 그린다 ----

  // block: { color, number } 형태. number가 null이면 미공개 - 색은 그대로 칠하되 숫자만 비운다.
  makeTile(x, y, block, onClick) {
    const border = 0x2b2620;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRect(x + 3, y + 3, TILE_W, TILE_H);

    const isHidden = block.number === null;
    // 지금 받은 카드 그림은 "뒷면" 디자인이라, 미공개(숨겨진) 카드에만 쓴다. 나중에
    // 앞면(공개된 숫자 카드) 디자인이 생기면 cardBlackFront/cardWhiteFront 키로
    // 채워서 아래 frontKey 자리에 로드해주면 공개된 카드도 그림으로 바뀐다.
    const backKey = block.color === Color.BLACK ? 'cardBlack' : 'cardWhite';
    const frontKey = block.color === Color.BLACK ? 'cardBlackFront' : 'cardWhiteFront';
    const imgKey = isHidden ? backKey : frontKey;
    const hasImg = this.cardTheme && this.textures.exists(imgKey);

    const children = [g];
    if (hasImg) {
      const cardImg = this.add.image(x + TILE_W / 2, y + TILE_H / 2, imgKey).setDisplaySize(TILE_W, TILE_H);
      children.push(cardImg);
    } else {
      const bg = block.color === Color.BLACK ? 0x1f1f22 : 0xf3efe2;
      g.fillStyle(bg, 1);
      g.fillRect(x, y, TILE_W, TILE_H);
      g.lineStyle(3, border, 1);
      g.strokeRect(x, y, TILE_W, TILE_H);
    }

    // 카드 그림이 있으면 그 자체로 앞/뒷면이 표현되니 "?"/숫자 텍스트는 안 그린다.
    // 그림이 없는 경우(테마 없는 봇, 혹은 아직 없는 앞면)만 예전처럼 텍스트로 표시한다.
    if (!hasImg) {
      const label = isHidden ? '' : String(block.number);
      const textColor = block.color === Color.BLACK ? '#f0ece0' : '#1a1a1a';
      const text = this.add.text(x + TILE_W / 2, y + TILE_H / 2, label, {
        fontFamily: FONT_BOLD, fontSize: '20px', color: textColor,
      }).setOrigin(0.5);
      children.push(text);
    }

    if (onClick) {
      const hitZone = this.add.zone(x, y, TILE_W, TILE_H).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', onClick);
      children.push(hitZone);
    }
    return this.add.container(0, 0, children);
  }

  // 남은 카드 더미 표시나 draw-pick 스프레드에 쓰는 카드 뒷면. 진짜 카드 뒷면
  // 아트가 아직 없어서, 흑/백 두 가지 톤 + 가운데 작은 장식으로 임시 디자인을 낸다.
  // 물음표는 없다 (뒷면 디자인 자체가 '미공개'라는 걸 알려주는 역할이므로).
  makeDeckCardBack(x, y, color = Color.BLACK) {
    const backKey = color === Color.BLACK ? 'cardBlack' : 'cardWhite';
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRect(x + 3, y + 3, TILE_W, TILE_H);
    if (this.cardTheme && this.textures.exists(backKey)) {
      const cardImg = this.add.image(x + TILE_W / 2, y + TILE_H / 2, backKey).setDisplaySize(TILE_W, TILE_H);
      return this.add.container(0, 0, [g, cardImg]);
    }
    const bg = color === Color.BLACK ? 0x1f1f22 : 0xf3efe2;
    const border = color === Color.BLACK ? 0x50504e : 0x2b2620;
    g.fillStyle(bg, 1);
    g.fillRect(x, y, TILE_W, TILE_H);
    g.lineStyle(3, border, 1);
    g.strokeRect(x, y, TILE_W, TILE_H);
    return this.add.container(0, 0, [g]);
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

  makeNumberButton(x, y, n, onClick) {
    const w = 32;
    const h = 32;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRect(x + 2, y + 2, w, h);
    g.fillStyle(0x3a6ff7, 1);
    g.fillRect(x, y, w, h);
    g.lineStyle(2, 0x1a1a1a, 1);
    g.strokeRect(x, y, w, h);
    const text = this.add.text(x + w / 2, y + h / 2, String(n), { fontFamily: FONT_BOLD, fontSize: '14px', color: '#ffffff' }).setOrigin(0.5);
    const hitZone = this.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', onClick);
    return this.add.container(0, 0, [g, text, hitZone]);
  }

  makeChoiceButton(x, y, label, onClick) {
    const w = 150;
    const h = 30;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRect(x + 3, y + 3, w, h);
    g.fillStyle(0x2f9e6e, 1);
    g.fillRect(x, y, w, h);
    g.lineStyle(2, 0x1a1a1a, 1);
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

  // 상단/하단의 '캐릭터 초상' 자리 - 진짜 아트가 없으므로 격자 실루엣을 픽셀 단위로 채운다.
  drawPortraitBox(x, y, w, h, bgColor, silColor) {
    const g = this.add.graphics();
    g.fillStyle(bgColor, 1);
    g.fillRect(x, y, w, h);
    g.lineStyle(4, 0x2b2620, 1);
    g.strokeRect(x, y, w, h);

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
    g.lineStyle(4, 0x2b2620, 1);
    g.strokeRect(x, y, w, h);
    g.lineStyle(1, 0xc9bfa0, 1);
    g.strokeRect(x + 5, y + 5, w - 10, h - 10);
  }

  // ---- 배경 연출 (원목 테이블 위에 깊은 숲 무늬 매트) ----

  drawWoodBackground() {
    const g = this.add.graphics();
    g.fillStyle(0x6b4226, 1);
    g.fillRect(0, 0, 800, 600);
    const grainColors = [0x5a371f, 0x7c4f2c];
    for (let i = 0; i < 26; i++) {
      const y = i * 24 + (i % 2 === 0 ? 4 : 14);
      g.fillStyle(grainColors[i % 2], 0.1);
      g.fillRect(0, y, 800, 3);
    }
  }

  drawForestMat() {
    const matX = 0;
    const matY = MAT_Y;
    const matW = 800;
    const matH = MAT_H;
    const g = this.add.graphics();

    g.fillStyle(0x173521, 1);
    g.fillRect(matX, matY, matW, matH);

    for (let r = 110; r > 0; r -= 14) {
      g.fillStyle(0xe4e2b8, 0.035);
      g.fillCircle(matX + matW - 110, matY + 70, r);
    }

    this.drawTreeRow(g, matY + matH * 0.3, 18, 34, 0x235232, 0.6, matX, matW);
    this.drawTreeRow(g, matY + matH * 0.56, 26, 46, 0x163a24, 0.8, matX, matW);
    this.drawTreeRow(g, matY + matH * 0.88, 36, 58, 0x0c2416, 0.95, matX, matW);

    for (let i = 0; i < 3; i++) {
      g.fillStyle(0xcdd8b6, 0.03 - i * 0.008);
      g.fillRect(matX, matY + matH - 18 - i * 12, matW, 12);
    }

    g.lineStyle(3, 0x2b2620, 1);
    g.strokeRect(matX, matY, matW, matH);
  }

  drawTreeRow(g, baseY, minH, maxH, color, alpha, matX, matW) {
    const positions = [0.03, 0.1, 0.17, 0.24, 0.31, 0.38, 0.45, 0.52, 0.59, 0.66, 0.73, 0.8, 0.87, 0.94];
    positions.forEach((t, i) => {
      const x = matX + t * matW;
      const h = minH + ((i * 37) % (maxH - minH + 1));
      const w = h * 0.62;
      g.fillStyle(color, alpha);
      g.fillTriangle(x, baseY - h, x - w / 2, baseY, x + w / 2, baseY);
      g.fillTriangle(x, baseY - h * 0.6, x - w / 2.6, baseY - h * 0.15, x + w / 2.6, baseY - h * 0.15);
    });
  }

  // 남은 덱을 매트 왼쪽 중단에 쌓인 카드 더미로 표시한다 (장식용, 클릭 불가).
  drawDeckPile() {
    const deckCount = this.engine ? this.engine.deck.length : 0;
    const stackX = 25;
    const stackY = MAT_Y + MAT_H / 2 - TILE_H / 2;
    if (deckCount > 0) {
      const layers = Math.min(4, Math.ceil(deckCount / 6));
      for (let i = 0; i < layers; i++) {
        const back = this.makeDeckCardBack(stackX - i * 3, stackY - i * 3, i % 2 === 0 ? Color.BLACK : Color.WHITE);
        this.dynamicLayer.add(back);
      }
    }
    const countText = this.add
      .text(stackX + TILE_W / 2, stackY + TILE_H + 12, `남은\n${deckCount}개`, { fontFamily: FONT, fontSize: '10px', color: '#e8e2c8', align: 'center' })
      .setOrigin(0.5, 0);
    this.dynamicLayer.add(countText);
  }
}
