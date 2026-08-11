import Phaser from 'phaser';
import {
  Player, MatchEngine, SkilledHumanInputStrategy, makeBotStrategy, Color,
  BOT_ITEM_ASSIGNMENT, ITEM_SKILLS,
} from '../logic/daVinciLogic.js';

const TILE_W = 44;
const TILE_H = 64;
const FONT = 'Galmuri9, monospace';
const FONT_BOLD = 'Galmuri11, monospace';

// 화면을 위(상대) / 가운데(매트) / 아래(주인공) 3단으로 나눈다. 사용자가 그린
// 와이어프레임(캐릭터 초상 + 대화창을 위아래에, 매트 위에 카드 두 줄 + 남은 카드
// 더미 + 줄마다 SKILL 버튼)을 그대로 따른다.
const TOP_H = 100;
const BOTTOM_H = 120;
const MAT_Y = TOP_H;
const MAT_H = 600 - TOP_H - BOTTOM_H;
const PORTRAIT_W = 140;

const BOT_ROW_Y = MAT_Y + 40; // 140
const PLAYER_ROW_Y = MAT_Y + MAT_H - TILE_H - 16; // 400
const CARD_START_X = 150;
const CARD_STEP = TILE_W + 8;
const SKILL_BTN_X = 752;
const ACTION_X = 170;
const ACTION_Y = 225;

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
export default class DaVinciCodeScene extends Phaser.Scene {
  constructor() {
    super('DaVinciCodeScene');
  }

  init(data) {
    this.botName = (data && data.botName) || '봇1';
  }

  preload() {
    // 코인토스에 쓰는 금화 양면 이미지 (사용자가 제공한 그림에서 잘라낸 것)
    this.load.image('coinFaceA', 'assets/coin_face_a.png');
    this.load.image('coinFaceB', 'assets/coin_face_b.png');
  }

  create() {
    // 배경(원목 테이블) + 매트(깊은 숲 그림)를 가장 먼저 그려서 다른 요소들 뒤에 깔리게 한다.
    this.drawWoodBackground();
    this.drawForestMat();

    const skillKey = BOT_ITEM_ASSIGNMENT[this.botName];
    this.skillInfo = skillKey ? ITEM_SKILLS[skillKey] : null;
    this.flavor = BOT_FLAVOR_LINES[this.botName] || {};

    // 이전에 쓰러뜨린 용의자에게서 얻은 능력들 (씬을 넘나들며 registry에 저장됨)
    const unlocked = this.registry.get('unlockedSkills') || [];

    // 위/아래 캐릭터 초상 + 대화창 (와이어프레임 레이아웃)
    this.drawPortraitBox(0, 0, PORTRAIT_W, TOP_H, 0xd8cfae, 0x2b2620);
    this.drawDialogueBox(PORTRAIT_W + 10, 10, 800 - PORTRAIT_W - 24, TOP_H - 20);
    this.opponentDialogueText = this.add.text(PORTRAIT_W + 24, 22, '', {
      fontFamily: FONT, fontSize: '12px', color: '#2b2620', lineSpacing: 4,
      wordWrap: { width: 800 - PORTRAIT_W - 52 },
    });

    this.drawPortraitBox(0, 600 - BOTTOM_H, PORTRAIT_W, BOTTOM_H, 0xc9dce0, 0x1a3a52);
    this.drawDialogueBox(PORTRAIT_W + 10, 600 - BOTTOM_H + 10, 800 - PORTRAIT_W - 24, BOTTOM_H - 20);
    // 아래쪽 대화창 = 게임 로그. 지금까지 일어난 일들을 위에서부터 쌓고,
    // 맨 아래 줄엔 항상 '지금 내가 해야 할 행동'을 강조해서 보여준다.
    // 로그 영역에 마우스 휠을 올리면 과거 기록도 스크롤해서 볼 수 있다.
    this.playerDialogueText = this.add.text(PORTRAIT_W + 24, 600 - BOTTOM_H + 18, '', {
      fontFamily: FONT, fontSize: '11px', color: '#2b2620', lineSpacing: 5,
      wordWrap: { width: 800 - PORTRAIT_W - 52 },
    });
    this.gameLog = [];
    this.currentPrompt = '';
    this.logScrollOffset = 0;
    this.logBoxBounds = {
      x: PORTRAIT_W + 10, y: 600 - BOTTOM_H + 10, w: 800 - PORTRAIT_W - 24, h: BOTTOM_H - 20,
    };
    this.input.on('wheel', (pointer, _objs, _dx, dy) => {
      const b = this.logBoxBounds;
      if (pointer.x < b.x || pointer.x > b.x + b.w || pointer.y < b.y || pointer.y > b.y + b.h) return;
      this.logScrollOffset += dy < 0 ? 1 : -1;
      this.refreshPlayerBox();
    });

    this.dynamicLayer = this.add.container(0, 0);

    // 스킬 버튼에 마우스를 올렸을 때 뜨는 설명 팝업. 매치 내내 내용이 바뀌지 않으므로
    // (능력 해금은 대전 사이에만 일어남) 한 번만 만들어두고 hover로 보이기/숨기기만 한다.
    const oppLines = this.skillInfo
      ? `${this.botName}\n소지품: ${this.skillInfo.item}\n능력: ${this.skillInfo.skill}\n${this.skillInfo.description}`
      : `${this.botName}\n특별한 소지품이 없습니다.`;
    this.oppInfoPopup = this.makeInfoPopup(520, 220, BOT_ROW_Y + TILE_H + 14, oppLines, false);
    this.oppInfoPopup.setVisible(false);

    const mySkillLines = unlocked.length
      ? unlocked.map((k) => `${ITEM_SKILLS[k].skill}: ${ITEM_SKILLS[k].description}`).join('\n\n')
      : '보유한 능력이 없습니다.';
    this.mySkillsPopup = this.makeInfoPopup(500, 260, PLAYER_ROW_Y - 10, mySkillLines, true);
    this.mySkillsPopup.setVisible(false);

    this.human = new Player('나');
    this.bot = new Player(this.botName);
    this.humanStrategy = new SkilledHumanInputStrategy(unlocked);
    this.botStrategy = makeBotStrategy(this.botName);

    this.setOpponentLine(this.flavor.start || `${this.botName}과(와)의 대전이 시작됩니다.`);
    this.logEvent(`${this.botName}과(와)의 대전이 시작됐다.`);
    this.firstPlayerCorrectShown = false;
    this.firstPlayerWrongShown = false;
    this.firstBotSkillShown = false;

    this.mode = 'idle';
    // coin_toss | idle | pick_slot | pick_number | continue_choice
    // | wrong_guess_decision | letter_redirect_pick | rewind_decision | over
    this.selectedSlotPos = null;
    this.insightPickActive = false;

    this.humanStrategy.onNeedGuess = (obs) => {
      this.mode = 'pick_slot';
      this.currentObs = obs;
      this.setPrompt('상대 패에서 지목할 위치를 클릭하세요.');
      this.render();
    };
    this.humanStrategy.onNeedContinueDecision = () => {
      this.mode = 'continue_choice';
      this.logEvent('정답이다! 이어서 도전할지 선택할 차례.');
      this.setPrompt('계속 도전할지, 턴을 넘길지 선택하세요.');
      this.render();
    };
    this.humanStrategy.onNeedWrongGuessDecision = (obs, usable, drawnIndex) => {
      this.mode = 'wrong_guess_decision';
      this.wrongGuessUsable = usable;
      this.wrongGuessDrawnIndex = drawnIndex;
      this.logEvent('오답이었다.');
      this.setPrompt('보유한 능력을 사용할지 선택하세요.');
      this.render();
    };
    this.humanStrategy.onNeedRewindDecision = () => {
      this.mode = 'rewind_decision';
      this.logEvent('내 블록이 공개됐다.');
      this.setPrompt('되감기를 사용할지 선택하세요.');
      this.render();
    };

    // '심문 시작' -> '선공 결정' 배너를 순서대로 띄운 뒤에 코인토스를 시작한다
    // (같은 자리에서 겹쳐 보이지 않도록 순차적으로 예약한다).
    this.showBanner('심문 시작', `vs ${this.botName}`);
    this.time.delayedCall(1150, () => {
      this.showBanner('선공 결정');
      this.time.delayedCall(1150, () => this.startCoinToss());
    });
  }

  // 순서 결정용 코인토스 애니메이션. 끝나면 startingPlayer를 정해서 매치를 시작한다.
  // 동전은 사용자가 준 금화 이미지 양면(coinFaceA='나', coinFaceB=상대)을 쓰고,
  // 컨테이너를 통째로 띄웠다 떨어뜨리면서(포물선) 안쪽 이미지만 scaleX로 좁혔다 넓혀 회전을 흉내낸다.
  startCoinToss() {
    this.mode = 'coin_toss';
    this.logEvent('선공을 정하기 위해 동전을 던진다.');
    this.setPrompt('동전이 떨어지길 기다리세요...');

    const startX = 400;
    const groundY = 300; // 동전이 떨어지는 바닥 높이 (매트 중앙)
    const peakY = 150; // 포물선 정점 높이

    this.coinShadow = this.add.ellipse(startX, groundY + 44, 60, 14, 0x000000, 0.35);
    this.coinSprite = this.add.image(0, 0, 'coinFaceA').setDisplaySize(78, 78);
    this.coinLabel = this.add.text(0, 52, '나', { fontFamily: FONT_BOLD, fontSize: '13px', color: '#ffe9a8' }).setOrigin(0.5);
    this.coinContainer = this.add.container(startX, groundY, [this.coinSprite, this.coinLabel]);

    const startingPlayer = Math.random() < 0.5 ? 0 : 1;
    const winnerLabel = startingPlayer === 0 ? '나' : this.botName;

    // 회전 연출: 이미지의 scaleX를 좁혔다 넓혔다 반복해서 '빙글빙글 도는 동전 옆모습'을 흉내낸다.
    // 반전 지점마다(가장 얇아질 때) 앞/뒷면 이미지와 문구를 같이 바꿔서 면이 뒤집히는 것처럼 보이게 한다.
    // setDisplaySize로 이미 축소해뒀기 때문에 scaleX의 '보통' 값은 1이 아니라 baseScaleX다 -
    // 그 값을 기준으로 좁아졌다 넓어지게 해야 한다.
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

    // 포물선: 위로 솟구칠 땐 감속(Sine.easeOut), 떨어질 땐 가속(Sine.easeIn) - 중력감을 흉내낸다.
    this.tweens.add({
      targets: this.coinContainer,
      y: peakY,
      duration: 600,
      ease: 'Sine.easeOut',
      onUpdate: updateShadow,
      onComplete: () => {
        this.tweens.add({
          targets: this.coinContainer,
          y: groundY,
          duration: 550,
          ease: 'Sine.easeIn',
          onUpdate: updateShadow,
          onComplete: () => {
            this.spinTween.stop();
            this.coinSprite.setDisplaySize(78, 78);
            this.coinSprite.setTexture(startingPlayer === 0 ? 'coinFaceA' : 'coinFaceB');
            this.coinLabel.setText(winnerLabel);
            this.coinShadow.setScale(1, 1).setAlpha(0.35);

            // 착지 바운스
            this.tweens.add({
              targets: this.coinContainer,
              y: groundY - 12,
              duration: 100,
              yoyo: true,
              ease: 'Quad.easeOut',
            });

            this.logEvent(`${winnerLabel}이(가) 선공으로 정해졌다.`);
            // 내가 선공이면 빨간 테두리, 후공이면 파란 테두리로 배너를 띄운다.
            const iAmFirst = startingPlayer === 0;
            this.showBanner(iAmFirst ? '선공' : '후공', null, iAmFirst ? 0xe24b4b : 0x4b8ee2);
            this.time.delayedCall(1150, () => this.beginMatch(startingPlayer));
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

    this.setPrompt('상대의 차례를 기다리는 중...');
    this.render();
    this.runMatch();
  }

  async runMatch() {
    const winner = await this.engine.playFullMatch();
    this.mode = 'over';
    const win = winner === this.human;

    if (win && this.skillInfo) {
      const skillKey = BOT_ITEM_ASSIGNMENT[this.botName];
      const unlocked = new Set(this.registry.get('unlockedSkills') || []);
      if (!unlocked.has(skillKey)) {
        unlocked.add(skillKey);
        this.registry.set('unlockedSkills', Array.from(unlocked));
        this.logEvent(`승리! ${this.botName}의 소지품 [${this.skillInfo.item}]과 능력 '${this.skillInfo.skill}'을(를) 손에 넣었다.`);
      } else {
        this.logEvent('승리! 사건의 단서를 얻었다.');
      }
    } else {
      this.logEvent(win ? '승리! 사건의 단서를 얻었다.' : '패배했다...');
    }
    this.setPrompt('아래 버튼을 눌러 맵으로 돌아가세요.');
    this.render();
  }

  onEngineEvent(event) {
    // TODO: 지금은 매 이벤트마다 즉시 다시 그리기만 한다.
    // 나중에 뽑기/공개 애니메이션과 딜레이를 여기서 넣으면 된다.
    // '뽑기'는 각 턴이 시작될 때 딱 한 번만 일어나므로, 내가 뽑았다는 건
    // 곧 내 턴이 시작됐다는 뜻이다 - 그 시점에 '나의 턴' 배너를 띄운다.
    if (event.kind === 'draw' && event.data.player === this.human.name) {
      this.showBanner('나의 턴');
    }

    // 지목(guess)은 맞았든 틀렸든 항상 한 번 일어난다. 여기서 결과에 따라
    // 그 카드 위에 '틀림(빨간 테두리+진동)' 또는 '뒤집기' 연출을 얹는다.
    // dynamicLayer가 아니라 독립된 오버레이라서 뒤이은 render() 호출과 상관없이
    // 끝까지 재생된다.
    if (event.kind === 'guess') {
      const side = event.data.target === this.botName ? 'bot' : 'player';
      if (event.data.correct) {
        const targetPlayer = side === 'bot' ? this.bot : this.human;
        const block = targetPlayer.hand.slots[event.data.position].block;
        this.flipCorrectTile(side, event.data.position, block);
      } else {
        this.flashWrongTile(side, event.data.position);
      }

      // 내가(주인공이) 상대 카드를 지목한 결과일 때만 '처음' 대사를 튼다.
      if (side === 'bot') {
        if (event.data.correct && !this.firstPlayerCorrectShown) {
          this.firstPlayerCorrectShown = true;
          if (this.flavor.firstCorrect) this.setOpponentLine(this.flavor.firstCorrect);
        } else if (!event.data.correct && !this.firstPlayerWrongShown) {
          this.firstPlayerWrongShown = true;
          if (this.flavor.firstWrong) this.setOpponentLine(this.flavor.firstWrong);
        }
      }
    }
    // 스킬로 인해 내 카드가 뒤집히는 경우(미끼/보험 등)도 같은 뒤집기 연출을 쓴다.
    if (event.kind === 'reveal_self') {
      const side = event.data.player === this.botName ? 'bot' : 'player';
      const owner = side === 'bot' ? this.bot : this.human;
      const block = owner.hand.slots[event.data.position].block;
      this.flipCorrectTile(side, event.data.position, block);
    }

    // 상대가 능력을 쓸 때마다 알림 배너를 띄우고, 처음 쓰는 순간엔 배너가 사라진 뒤
    // 전용 대사도 이어서 보여준다.
    if (event.kind === 'skill_used' && event.data.player === this.botName) {
      this.showBanner('상대의 스킬 사용', event.data.skill);
      if (!this.firstBotSkillShown) {
        this.firstBotSkillShown = true;
        if (this.flavor.firstSkill) {
          this.time.delayedCall(1150, () => this.setOpponentLine(this.flavor.firstSkill));
        }
      }
    }

    let text = null;
    if (event.kind === 'draw') text = `${event.data.player}이(가) 블록을 뽑았다.`;
    if (event.kind === 'reveal_opponent' || event.kind === 'reveal_self') {
      text = `${event.data.player}의 ${event.data.block} 블록이 공개됐다.`; // event.data.block은 이미 "흑5" 같은 문자열
    }
    if (event.kind === 'skill_used') {
      text = `${event.data.player}이(가) 능력 '${event.data.skill}'을(를) 사용했다!`;
    }
    if (text) {
      this.logEvent(text);
    }
    this.render();
  }

  // 게임 로그(아래쪽 대화창)에 한 줄을 추가한다. 새 이벤트가 생기면 스크롤은
  // 항상 최신(맨 아래)으로 되돌아간다.
  logEvent(text) {
    this.gameLog.push(text);
    if (this.gameLog.length > 200) this.gameLog.shift();
    this.logScrollOffset = 0;
    this.refreshPlayerBox();
  }

  // '지금 내가 해야 할 행동'을 갱신한다. 로그 맨 아래에 강조되어 표시된다.
  setPrompt(text) {
    this.currentPrompt = text;
    this.refreshPlayerBox();
  }

  // 로그 영역은 최근 VISIBLE줄만 보여주되, logScrollOffset만큼 과거로 거슬러
  // 올라가 볼 수 있다(마우스 휠). '지금 할 일'은 스크롤과 무관하게 맨 아래 고정.
  refreshPlayerBox() {
    const VISIBLE = 4;
    const total = this.gameLog.length;
    const maxOffset = Math.max(0, total - VISIBLE);
    this.logScrollOffset = Phaser.Math.Clamp(this.logScrollOffset, 0, maxOffset);
    const end = total - this.logScrollOffset;
    const start = Math.max(0, end - VISIBLE);
    const visible = this.gameLog.slice(start, end);

    const lines = [...visible];
    if (this.logScrollOffset > 0) lines.push('(스크롤 중 - 휠을 내리면 최신으로)');
    if (this.currentPrompt) lines.push(`▶ ${this.currentPrompt}`);
    this.playerDialogueText.setText(lines.join('\n'));
  }

  // 위쪽(상대) 대화창에 글을 쓴다. 상대의 행동(뽑기/공개/스킬)을 알려줄 때 쓴다.
  setOpponentLine(text) {
    this.opponentDialogueText.setText(text);
  }

  // 화면 중앙에서 팝업처럼 커지며 나타났다가 잠시 뒤 사라지는 배너.
  // ('심문 시작', '나의 턴' 같은 장면 전환 알림용. render()가 자주 지우는
  // dynamicLayer와는 별개로 독립적인 컨테이너로 띄우고 깊이를 높여 항상 맨 위에 그린다.)
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
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(650, () => {
          this.tweens.add({
            targets: banner,
            scale: 0,
            alpha: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => banner.destroy(),
          });
        });
      },
    });
  }

  // side('bot'|'player') + index로 화면상의 타일 좌상단 좌표를 구한다.
  tileScreenPos(side, index) {
    const x = CARD_START_X + index * CARD_STEP;
    const y = side === 'bot' ? BOT_ROW_Y : PLAYER_ROW_Y;
    return { x, y };
  }

  // 오답 연출: 그 자리 카드 위에 빨간 테두리 + 좌우 진동을 재생하는 임시 오버레이.
  // dynamicLayer와 별개라서 뒤이은 render()가 실제 타일을 새로 그려도 방해받지 않고
  // 끝까지 재생된 뒤 스스로 사라진다.
  flashWrongTile(side, index) {
    const { x, y } = this.tileScreenPos(side, index);
    const cx = x + TILE_W / 2;
    const cy = y + TILE_H / 2;

    const face = this.add.graphics();
    face.fillStyle(0x000000, 0.3);
    face.fillRect(-TILE_W / 2 + 3, -TILE_H / 2 + 3, TILE_W, TILE_H);
    face.fillStyle(0x1f1f22, 1);
    face.fillRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
    const mark = this.add.text(0, 0, '?', { fontFamily: FONT_BOLD, fontSize: '16px', color: '#f0ece0' }).setOrigin(0.5);

    const border = this.add.graphics();
    const drawBorder = (alpha) => {
      border.clear();
      border.lineStyle(4, 0xe23b3b, alpha);
      border.strokeRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
    };
    drawBorder(1);

    const overlay = this.add.container(cx, cy, [face, mark, border]);
    overlay.setDepth(900);

    // 진폭이 줄어드는 좌우 흔들림 (틱마다 방향을 바꿔가며 목표 x로 짧게 튕긴다)
    const shakeOffsets = [7, -7, 5, -5, 3, -3, 0];
    let step = 0;
    const doShake = () => {
      if (step >= shakeOffsets.length) return;
      this.tweens.add({
        targets: overlay,
        x: cx + shakeOffsets[step],
        duration: 45,
        ease: 'Sine.easeInOut',
        onComplete: doShake,
      });
      step += 1;
    };
    doShake();

    // 테두리는 잠깐 선명하게 유지되다가 서서히 옅어지며 사라진다.
    this.tweens.addCounter({
      from: 100,
      to: 0,
      duration: 450,
      delay: 150,
      onUpdate: (tw) => drawBorder(tw.getValue() / 100),
      onComplete: () => overlay.destroy(),
    });
  }

  // 정답/공개 연출: 카드가 세로축으로 접히듯 좁아졌다 다시 넓어지면서
  // 뒷면 -> 앞면(숫자 공개)으로 바뀌는 뒤집기 애니메이션.
  flipCorrectTile(side, index, block) {
    const { x, y } = this.tileScreenPos(side, index);
    const cx = x + TILE_W / 2;
    const cy = y + TILE_H / 2;

    const bg = block.color === Color.BLACK ? 0x1f1f22 : 0xf3efe2;
    const borderColor = block.color === Color.BLACK ? 0x50504e : 0x2b2620;
    const textColor = block.color === Color.BLACK ? '#f0ece0' : '#1a1a1a';

    const g = this.add.graphics();
    const label = this.add.text(0, 0, '', { fontFamily: FONT_BOLD, fontSize: '16px', color: textColor }).setOrigin(0.5);

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
        g.fillStyle(0x1f1f22, 1);
        g.fillRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
        g.lineStyle(3, 0x50504e, 1);
        g.strokeRect(-TILE_W / 2, -TILE_H / 2, TILE_W, TILE_H);
        label.setColor('#f0ece0');
        label.setText('?');
      }
    };
    drawFace(false);

    const overlay = this.add.container(cx, cy, [g, label]);
    overlay.setDepth(900);

    this.tweens.add({
      targets: overlay,
      scaleX: 0,
      duration: 150,
      ease: 'Sine.easeIn',
      onComplete: () => {
        drawFace(true);
        this.tweens.add({
          targets: overlay,
          scaleX: 1,
          duration: 170,
          ease: 'Back.easeOut',
          onComplete: () => {
            this.time.delayedCall(300, () => overlay.destroy());
          },
        });
      },
    });
  }

  render() {
    this.dynamicLayer.removeAll(true);

    // 새로 뽑혀서 손패에 추가된 카드(이전 render()엔 없던 slotId)는
    // 톡 튀어오르듯 등장하는 애니메이션을 태운다. 정렬 규칙상 새 카드가
    // 손패 중간에 끼어들 수도 있어서, 인덱스가 아니라 slotId로 '새 카드'를 구분한다.
    const prevBotIds = this._prevBotSlotIds || new Set();
    const prevHumanIds = this._prevHumanSlotIds || new Set();
    const curBotIds = new Set();
    const curHumanIds = new Set();

    // 상대(봇) 패 - 미공개는 뒷면. pick_slot 모드에서 지목용으로,
    // insightPickActive면 '엿보기' 대상 선택용으로 클릭 가능해진다.
    this.bot.hand.slots.forEach((slot, i) => {
      curBotIds.add(slot.slotId);
      const x = CARD_START_X + i * CARD_STEP;
      const y = BOT_ROW_Y;
      let onClick = null;
      if (this.mode === 'pick_slot' && !slot.revealed) {
        onClick = this.insightPickActive ? () => this.onUseInsight(i) : () => this.onPickSlot(i);
      }
      // 색은 항상 보이고(칠해진 색이니까), 숫자만 공개 전엔 감춘다.
      const displayBlock = { color: slot.block.color, number: slot.revealed ? slot.block.number : null };
      const tile = this.makeTile(x, y, displayBlock, onClick);
      this.dynamicLayer.add(tile);
      if (!prevBotIds.has(slot.slotId)) this.playCardEnterAnim(tile);
    });

    // 내 패 - 항상 전부 공개된 상태로 표시. '미끼' 사용 시엔 대신 공개할 블록을 고르는 용도로 클릭 가능.
    // 아직 상대에게 정체가 들키지 않은(=revealed 안 된) 카드는 살짝 반투명하게 표시해서
    // '이건 아직 비밀이다'라는 느낌을 준다.
    this.human.hand.slots.forEach((slot, i) => {
      curHumanIds.add(slot.slotId);
      const x = CARD_START_X + i * CARD_STEP;
      const y = PLAYER_ROW_Y;
      const clickable = this.mode === 'letter_redirect_pick' && !slot.revealed && i !== this.wrongGuessDrawnIndex;
      const onClick = clickable ? () => this.onPickLetterRedirect(i) : null;
      const restAlpha = slot.revealed ? 1 : 0.8;
      const tile = this.makeTile(x, y, slot.block, onClick);
      tile.setAlpha(restAlpha);
      this.dynamicLayer.add(tile);
      if (!prevHumanIds.has(slot.slotId)) this.playCardEnterAnim(tile, restAlpha);
    });

    this._prevBotSlotIds = curBotIds;
    this._prevHumanSlotIds = curHumanIds;

    this.drawDeckPile();

    // 줄마다 하나씩 있는 SKILL 버튼. 마우스를 올리면 설명 팝업(create()에서 한 번만
    // 만들어둔 것)이 뜬다. 아래(내) 버튼은 지금 당장 쓸 수 있는 능력(엿보기)이 있으면
    // 클릭으로 바로 발동도 된다.
    this.dynamicLayer.add(this.makeSkillButton(SKILL_BTN_X, BOT_ROW_Y + TILE_H / 2, false, null, this.oppInfoPopup));

    const lanternUsableNow = this.mode === 'pick_slot' && this.humanStrategy.hasSkill('lantern') && !this.insightPickActive;
    this.dynamicLayer.add(this.makeSkillButton(SKILL_BTN_X, PLAYER_ROW_Y + TILE_H / 2, lanternUsableNow, lanternUsableNow ? () => {
      this.insightPickActive = true;
      this.setPrompt('엿볼 상대 블록을 클릭하세요.');
      this.mySkillsPopup.setVisible(false);
      this.render();
    } : null, this.mySkillsPopup));

    if (this.mode === 'pick_number') {
      // 카드는 0~11까지 있으므로 버튼도 0부터 시작한다.
      for (let n = 0; n <= 11; n++) {
        const x = ACTION_X + n * 34;
        this.dynamicLayer.add(this.makeNumberButton(x, ACTION_Y, n, () => this.onPickNumber(n)));
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
        y += 40;
      });
      this.dynamicLayer.add(this.makeChoiceButton(ACTION_X, y, '사용 안 함', () => this.onChooseWrongGuessSkill(null)));
    }

    if (this.mode === 'letter_redirect_pick') {
      this.dynamicLayer.add(this.add.text(ACTION_X, ACTION_Y, '아래 내 패에서 대신\n공개할 블록을 클릭하세요.', { fontFamily: FONT, fontSize: '12px', color: '#ffe9a8', lineSpacing: 4 }));
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
        this.scene.start('MapScene', {
          result: { bot: this.botName, win: this.engine.winner === this.human },
        });
      }));
    }
  }

  onPickSlot(pos) {
    this.selectedSlotPos = pos;
    this.mode = 'pick_number';
    this.setPrompt('지목할 숫자를 고르세요.');
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
      this.logEvent(`엿보기 결과: 이 위치는 [${number}]였다.`);
      this.setPrompt('이어서 상대 패에서 지목할 위치를 클릭하세요.');
    }
    this.render();
  }

  onChooseWrongGuessSkill(key) {
    if (key === null) {
      this.mode = 'idle';
      this.humanStrategy.resolveWrongGuessDecision(null);
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
      this.setPrompt('대신 공개할 내 블록을 선택하세요.');
      this.render();
    }
  }

  onPickLetterRedirect(idx) {
    this.humanStrategy.markUsed('letter');
    this.mode = 'idle';
    this.humanStrategy.resolveWrongGuessDecision({ skipReveal: false, redirectIndex: idx, retryWithoutPenalty: false });
    this.render();
  }

  // ---- 픽셀아트 스타일 UI 조각들: 전부 각진 모서리 + 굵은 테두리 + 그림자 오프셋으로 그린다 ----

  // block: { color, number } 형태. number가 null이면 미공개 - 색은 그대로 칠하되 숫자만 비운다.
  makeTile(x, y, block, onClick) {
    const bg = block.color === Color.BLACK ? 0x1f1f22 : 0xf3efe2;
    const border = 0x2b2620;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRect(x + 3, y + 3, TILE_W, TILE_H);
    g.fillStyle(bg, 1);
    g.fillRect(x, y, TILE_W, TILE_H);
    g.lineStyle(3, border, 1);
    g.strokeRect(x, y, TILE_W, TILE_H);

    // 뒷면(미공개)은 숫자 대신 물음표를 보여준다.
    const label = block.number === null ? '?' : String(block.number);
    const textColor = block.color === Color.BLACK ? '#f0ece0' : '#1a1a1a';
    const text = this.add.text(x + TILE_W / 2, y + TILE_H / 2, label, { fontFamily: FONT_BOLD, fontSize: '16px', color: textColor }).setOrigin(0.5);

    const children = [g, text];
    if (onClick) {
      const hitZone = this.add.zone(x, y, TILE_W, TILE_H).setOrigin(0, 0).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', onClick);
      children.push(hitZone);
    }
    return this.add.container(0, 0, children);
  }

  // 새로 뽑힌 카드가 손패에 나타날 때 톡 튀어오르듯 커지는 등장 연출.
  // 타일 컨테이너 자체는 (0,0)에 있고 자식들이 이미 절대좌표에 그려져 있으므로,
  // 컨테이너의 x/y는 '얹혀지는 오프셋'으로 그대로 애니메이션에 쓸 수 있다.
  playCardEnterAnim(tile, targetAlpha = 1) {
    tile.setAlpha(0);
    tile.setScale(0.5);
    tile.y -= 18;
    this.tweens.add({
      targets: tile,
      alpha: targetAlpha,
      scaleX: 1,
      scaleY: 1,
      y: tile.y + 18,
      duration: 260,
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
    const h = 34;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3);
    g.fillRect(x + 3, y + 3, w, h);
    g.fillStyle(0x2f9e6e, 1);
    g.fillRect(x, y, w, h);
    g.lineStyle(2, 0x1a1a1a, 1);
    g.strokeRect(x, y, w, h);
    const text = this.add.text(x + w / 2, y + h / 2, label, { fontFamily: FONT, fontSize: '13px', color: '#ffffff' }).setOrigin(0.5);
    const hitZone = this.add.zone(x, y, w, h).setOrigin(0, 0).setInteractive({ useHandCursor: true });
    hitZone.on('pointerdown', onClick);
    return this.add.container(0, 0, [g, text, hitZone]);
  }

  // 카드 줄 오른쪽 끝의 동그란 SKILL 버튼. highlight면 지금 바로 쓸 수 있는 능력이
  // 있다는 뜻이라 주황색으로 강조한다. 마우스를 올리면 popup(설명 팝업)이 보이고,
  // onClick이 있으면 클릭으로 그 자리에서 바로 능력을 발동할 수 있다.
  makeSkillButton(cx, cy, highlight, onClick, popup) {
    const r = 26;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35);
    g.fillCircle(cx + 3, cy + 3, r);
    g.fillStyle(highlight ? 0xd98c3a : 0x33414a, 1);
    g.fillCircle(cx, cy, r);
    g.lineStyle(3, 0x1a1a1a, 1);
    g.strokeCircle(cx, cy, r);
    const text = this.add.text(cx, cy, 'SKILL', { fontFamily: FONT, fontSize: '9px', color: '#ffffff', align: 'center' }).setOrigin(0.5);
    const children = [g, text];
    const hitZone = this.add.zone(cx - r, cy - r, r * 2, r * 2).setOrigin(0, 0).setInteractive({ useHandCursor: onClick != null });
    if (onClick) hitZone.on('pointerdown', onClick);
    if (popup) {
      hitZone.on('pointerover', () => popup.setVisible(true));
      hitZone.on('pointerout', () => popup.setVisible(false));
    }
    children.push(hitZone);
    return this.add.container(0, 0, children);
  }

  // 설명 팝업. 내용 길이에 맞춰 높이를 자동으로 계산한다.
  // growUp이 true면 anchorY를 '아래쪽 기준점'으로 보고 위로 자라난다(아래쪽 SKILL 버튼용),
  // 아니면 anchorY를 '위쪽 기준점'으로 보고 아래로 자라난다(위쪽 SKILL 버튼용).
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

    // 짙은 '숲 초록' 바탕 - 검정이 아니라 눈에 확실히 초록으로 읽히는 톤으로.
    g.fillStyle(0x173521, 1);
    g.fillRect(matX, matY, matW, matH);

    // 은은한 달빛 (겹쳐진 저알파 원으로 부드럽게 표현)
    for (let r = 110; r > 0; r -= 14) {
      g.fillStyle(0xe4e2b8, 0.035);
      g.fillCircle(matX + matW - 110, matY + 70, r);
    }

    // 원경 -> 근경 순으로 침엽수 실루엣 세 겹 (바탕보다 어두운 초록들로 깊이감을 줌)
    this.drawTreeRow(g, matY + matH * 0.3, 18, 34, 0x235232, 0.6, matX, matW);
    this.drawTreeRow(g, matY + matH * 0.56, 26, 46, 0x163a24, 0.8, matX, matW);
    this.drawTreeRow(g, matY + matH * 0.88, 36, 58, 0x0c2416, 0.95, matX, matW);

    // 바닥 쪽 옅은 안개
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
    const stackX = 30;
    const stackY = MAT_Y + MAT_H / 2 - TILE_H / 2;
    if (deckCount > 0) {
      const layers = Math.min(4, Math.ceil(deckCount / 6));
      for (let i = 0; i < layers; i++) {
        const g = this.add.graphics();
        g.fillStyle(0x000000, 0.3);
        g.fillRect(stackX - i * 3 + 3, stackY - i * 3 + 3, TILE_W, TILE_H);
        g.fillStyle(0x2b3b3a, 1);
        g.fillRect(stackX - i * 3, stackY - i * 3, TILE_W, TILE_H);
        g.lineStyle(3, 0x1a1a1a, 1);
        g.strokeRect(stackX - i * 3, stackY - i * 3, TILE_W, TILE_H);
        this.dynamicLayer.add(g);
        if (i === layers - 1) {
          const mark = this.add
            .text(stackX - i * 3 + TILE_W / 2, stackY - i * 3 + TILE_H / 2, '?', { fontFamily: FONT_BOLD, fontSize: '16px', color: '#cfd8d6' })
            .setOrigin(0.5);
          this.dynamicLayer.add(mark);
        }
      }
    }
    const countText = this.add
      .text(stackX + TILE_W / 2, stackY + TILE_H + 12, `남은\n${deckCount}개`, { fontFamily: FONT, fontSize: '10px', color: '#e8e2c8', align: 'center' })
      .setOrigin(0.5, 0);
    this.dynamicLayer.add(countText);
  }
}
