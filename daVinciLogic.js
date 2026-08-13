// 다빈치코드 미니게임 - 규칙 엔진 + 추리 AI
// (파이썬으로 먼저 설계했던 game_logic.py를 JS로 포팅한 버전)
//
// 규칙 요약: 0~11 x 흑/백 = 24블록, 조커 없음, 1:1 대전.
// 자기 차례에 한 개를 뽑아 왼쪽이 작은 수가 되도록 자기 패에 끼워 넣고,
// 상대의 미공개 블록 하나를 지목해 숫자를 맞힌다. 맞히면 공개하고 계속 도전할지
// 선택할 수 있고, 틀리면 방금 뽑은 자기 블록이 공개되며 턴이 넘어간다.
// 패가 전부 공개된 사람이 패배한다.
//
// Scene(렌더링)은 이 파일의 로직에 전혀 손대지 않고, MatchEngine이 흘려보내는
// "공개된 정보만 담긴" 이벤트와 Observation만 받아서 그린다. 그래야 사람 플레이어
// 화면에 상대의 비공개 블록 값이 실수로 노출되는 일이 없다.

const Color = { BLACK: 'black', WHITE: 'white' };

function blockLabel(block) {
  return `${block.color === Color.BLACK ? '흑' : '백'}${block.number}`;
}

function blockKey(b) {
  return `${b.color}:${b.number}`;
}

function buildDeck() {
  const deck = [];
  for (let n = 0; n <= 11; n++) {
    deck.push({ number: n, color: Color.BLACK });
    deck.push({ number: n, color: Color.WHITE });
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function fullBlockPool() {
  const pool = [];
  for (let n = 0; n <= 11; n++) {
    pool.push({ number: n, color: Color.BLACK });
    pool.push({ number: n, color: Color.WHITE });
  }
  return pool;
}

const TieBreak = { BLACK_LEFT: 'black_left', WHITE_LEFT: 'white_left' };

let _slotIdCounter = 1;

class Hand {
  constructor(tieBreak = TieBreak.BLACK_LEFT) {
    this.slots = []; // { block, revealed, slotId }
    this.tieBreak = tieBreak;
  }

  _sortKey(block) {
    const colorRank = this.tieBreak === TieBreak.BLACK_LEFT
      ? (block.color === Color.BLACK ? 0 : 1)
      : (block.color === Color.WHITE ? 0 : 1);
    return [block.number, colorRank];
  }

  _less(a, b) {
    if (a[0] !== b[0]) return a[0] < b[0];
    return a[1] < b[1];
  }

  insert(block) {
    const key = this._sortKey(block);
    let idx = 0;
    for (let i = 0; i < this.slots.length; i++) {
      if (this._less(this._sortKey(this.slots[i].block), key)) idx = i + 1;
      else break;
    }
    this.slots.splice(idx, 0, { block, revealed: false, slotId: _slotIdCounter++ });
    return idx;
  }

  reveal(index) {
    this.slots[index].revealed = true;
    return this.slots[index].block;
  }

  isRevealed(index) {
    return this.slots[index].revealed;
  }

  hiddenIndices() {
    const out = [];
    this.slots.forEach((s, i) => { if (!s.revealed) out.push(i); });
    return out;
  }

  allRevealed() {
    return this.slots.length > 0 && this.slots.every((s) => s.revealed);
  }

  // 실제 게임에서 블록의 '색'은 항상 보인다(칠해진 색이니까) - 안 보이는 건 오직
  // 찍혀 있는 '숫자'뿐이다. 그래서 미공개 상태여도 color는 그대로 노출하고
  // number만 null로 감춘다. (판단 로직에서는 number == null을 '미공개'로 취급한다)
  viewWithIds() {
    return this.slots.map((s) => [
      s.slotId,
      s.revealed ? s.block : { color: s.block.color, number: null },
    ]);
  }
}

class Player {
  constructor(name) {
    this.name = name;
    this.hand = new Hand();
  }
  insertDrawnBlock(block) {
    return this.hand.insert(block);
  }
}

// ---------------------------------------------------------------------------
// 전략(Strategy)
// ---------------------------------------------------------------------------

class Strategy {
  // index: 이 전략이 조종하는 플레이어가 MatchEngine.players 배열에서 몇 번(0/1)인지.
  // 아이템 스킬이 engine.peekOpponentSlot() 같은 걸 호출할 때 자기 자신을 식별하는 데 쓴다.
  bind(player, index) {
    this.player = player;
    this.index = index;
    // '속독' 스킬용: 이번 내 턴에 정답을 맞혀서 '계속 도전' 중인 상태인지 추적한다.
    // 내 턴이 새로 시작(draw)하면 false로 리셋하고, 내가 정답을 맞히면 true가 된다.
    this._hasCorrectGuessThisTurn = false;
  }

  attachEngine(engine) { this.engine = engine; }

  onEvent(event) {
    if (!this.player) return;
    if (event.kind === 'draw' && event.data.player === this.player.name) {
      this._hasCorrectGuessThisTurn = false;
    } else if (event.kind === 'guess' && event.data.guesser === this.player.name && event.data.correct) {
      this._hasCorrectGuessThisTurn = true;
    }
  }

  async chooseGuess(_obs) { throw new Error('chooseGuess not implemented'); }
  async continueAfterCorrect(_obs) { throw new Error('continueAfterCorrect not implemented'); }
  chooseTieBreakSide() { return TieBreak.BLACK_LEFT; }

  // 이번 턴에 뽑을 카드의 색을 흑/백 중에 고를 수 있게 할지 결정한다. null을 반환하면
  // (기본값) 색 상관없이 덱에서 무작위로 뽑는다 - 봇은 이 기본 동작을 그대로 쓴다.
  // 사람 전략(HumanInputStrategy)만 실제로 UI에 물어봐서 색을 고르게 한다.
  async chooseDrawColor(_deck) { return null; }

  // ---- 아이템 스킬용 훅 (기본은 전부 무동작 - 스킬 없는 전략은 신경 안 써도 됨) ----

  // 대전 시작(초기 패 분배 직후) 1회 호출. '엿보기'처럼 시작하자마자 발동하는 스킬용.
  onMatchStart(_obs) {}

  // 오답을 내서 페널티(자기 블록 공개)를 받기 직전에 호출된다.
  // 반환값으로 페널티를 바꿀 수 있다:
  //   skipReveal: true          -> 이번엔 공개 자체를 건너뛴다 ('보험')
  //   retryWithoutPenalty: true -> 공개도 턴 종료도 없이 바로 다시 지목한다 ('동시타격', '속독')
  //   skillLabel: string        -> 위 둘 중 하나로 스킬이 발동했을 때 표시할 이름
  async onWrongGuess(_obs, _drawnIndex) {
    return { skipReveal: false, retryWithoutPenalty: false };
  }

  // 자신의 블록이 (이유 불문하고) 방금 공개됐을 때 호출된다.
  // true를 반환하면 그 자리에서 즉시 다시 비공개로 되돌린다 ('되감기').
  async onOwnBlockRevealed(_obs, _index) {
    return false;
  }
}

class RandomStrategy extends Strategy {
  constructor(continueProb = 0.5) {
    super();
    this.continueProb = continueProb;
  }

  async chooseGuess(obs) {
    const hidden = obs.opponentView
      .map(([, block], i) => (block.number === null ? i : null))
      .filter((i) => i !== null);
    const pos = hidden[Math.floor(Math.random() * hidden.length)];
    const guess = Math.floor(Math.random() * 12); // 0~11
    return [pos, guess];
  }

  async continueAfterCorrect(obs) {
    const anyHidden = obs.opponentView.some(([, b]) => b.number === null);
    if (!anyHidden) return false;
    return Math.random() < this.continueProb;
  }
}

// 공개 정보(정렬 제약 + 소거법 + 오답 이력)만으로 추리하는 AI.
// 자세한 설계 근거는 game_logic.py의 DeductiveStrategy 주석 참고.
class DeductiveStrategy extends Strategy {
  constructor(continueThreshold = 0.34) {
    super();
    this.continueThreshold = continueThreshold;
    this.excluded = new Map(); // slotId -> Set(number)
  }

  onEvent(event) {
    super.onEvent(event); // '속독' 스킬용 '이번 턴 정답 여부' 추적
    if (event.kind === 'guess' && event.data.correct === false) {
      const { slotId, guess } = event.data;
      if (slotId != null && guess != null) {
        if (!this.excluded.has(slotId)) this.excluded.set(slotId, new Set());
        this.excluded.get(slotId).add(guess);
      }
    }
  }

  _propagateBounds(slots) {
    const n = slots.length;
    const lower = new Array(n).fill(0);
    const upper = new Array(n).fill(11);
    slots.forEach(([, block], i) => {
      if (block.number != null) { lower[i] = block.number; upper[i] = block.number; }
    });
    for (let i = 1; i < n; i++) lower[i] = Math.max(lower[i], lower[i - 1]);
    for (let i = n - 2; i >= 0; i--) upper[i] = Math.min(upper[i], upper[i + 1]);
    return [lower, upper];
  }

  _candidates(obs) {
    const slots = obs.opponentView;
    const [lower, upper] = this._propagateBounds(slots);

    const known = new Set();
    obs.selfHand.slots.forEach((s) => known.add(blockKey(s.block)));
    slots.forEach(([, b]) => { if (b.number != null) known.add(blockKey(b)); });
    const unknown = fullBlockPool().filter((b) => !known.has(blockKey(b)));

    const result = new Map(); // pos -> Map(number -> count)
    slots.forEach(([slotId, block], i) => {
      if (block.number != null) return;
      const excl = this.excluded.get(slotId) || new Set();
      const counter = new Map();
      unknown.forEach((b) => {
        // 이 자리는 '색'이 이미 공개돼 있으므로(규칙상 색은 항상 보임), 후보는 같은
        // 색 블록만 될 수 있다. 색을 걸러내지 않으면 다른 색으로 이미 공개된 숫자를
        // 여기서도 또 후보로 세는 버그가 생긴다(= 공개된 카드를 "잊어버리는" 원인).
        if (b.color === block.color && b.number >= lower[i] && b.number <= upper[i] && !excl.has(b.number)) {
          counter.set(b.number, (counter.get(b.number) || 0) + 1);
        }
      });
      result.set(i, counter);
    });
    return result;
  }

  _bestPick(obs) {
    let best = null; // [pos, number, confidence]
    for (const [pos, counter] of this._candidates(obs)) {
      let total = 0;
      let bestNum = null;
      let bestCount = -1;
      for (const [num, count] of counter) {
        total += count;
        if (count > bestCount) { bestCount = count; bestNum = num; }
      }
      if (total === 0) continue;
      const confidence = bestCount / total;
      if (!best || confidence > best[2]) best = [pos, bestNum, confidence];
    }
    return best;
  }

  async chooseGuess(obs) {
    const pick = this._bestPick(obs);
    if (pick) return [pick[0], pick[1]];
    // 안전장치: 근사 오차로 후보가 텅 빈 예외 상황 -> 무작위 대체
    const hidden = obs.opponentView
      .map(([, b], i) => (b.number === null ? i : null))
      .filter((i) => i !== null);
    const pos = hidden[Math.floor(Math.random() * hidden.length)];
    const slotId = obs.opponentView[pos][0];
    const excl = this.excluded.get(slotId) || new Set();
    const all = Array.from({ length: 12 }, (_, i) => i); // 0~11
    const pool = all.filter((n) => !excl.has(n));
    const chosen = pool.length ? pool : all;
    return [pos, chosen[Math.floor(Math.random() * chosen.length)]];
  }

  async continueAfterCorrect(obs) {
    const anyHidden = obs.opponentView.some(([, b]) => b.number === null);
    if (!anyHidden) return false;
    const pick = this._bestPick(obs);
    if (!pick) return false;
    return pick[2] >= this.continueThreshold;
  }
}

// ---------------------------------------------------------------------------
// 아이템 스킬 - 용의자(봇)마다 자신을 상징하는 증거품 하나와 그에 얽힌 능력을 갖는다.
// 대전당 1회만 발동한다.
// ---------------------------------------------------------------------------

const ITEM_SKILLS = {
  lantern: { item: '랜턴', skill: '엿보기', description: '대전 시작 시, 상대 패의 미공개 블록 하나 숫자를 몰래 확인한다.' },
  speedRead: { item: '책', skill: '속독', description: '정답을 맞히고 계속 도전하다 오답을 내도, 이번 한 번은 턴이 넘어가지 않고 페널티 없이 곧바로 다시 지목할 수 있다.' },
  sickle: { item: '낫', skill: '동시타격', description: '오답이어도 이번 한 번은 페널티 없이 곧바로 다시 지목할 수 있다.' },
  rope: { item: '밧줄', skill: '되감기', description: '자신의 블록이 어떤 이유로든 방금 공개됐을 때, 그 자리에서 즉시 다시 비공개로 되돌린다.' },
  bloodyTowel: { item: '피묻은 수건', skill: '보험', description: '오답을 내도 이번 한 번은 블록이 공개되지 않는다.' },
};

// 6명 중 5명에게만 아이템을 배정한다 (아이템이 5개뿐이므로 1명은 순수 추리로만 승부).
const BOT_ITEM_ASSIGNMENT = {
  봇1: 'lantern',
  봇2: 'speedRead',
  봇3: 'sickle',
  봇4: 'rope',
  봇5: 'bloodyTowel',
  봇6: null,
};

// DeductiveStrategy에 아이템 스킬 한 개를 얹은 버전. 스킬이 없으면(skillKey=null)
// 순수 DeductiveStrategy와 완전히 동일하게 동작한다.
class SkilledDeductiveStrategy extends DeductiveStrategy {
  constructor(skillKey = null, continueThreshold = 0.34) {
    super(continueThreshold);
    this.skillKey = skillKey;
    this.skillUsed = false;
    this._insightSlotId = null;
    this._insightNumber = null;
  }

  onMatchStart(obs) {
    if (this.skillKey !== 'lantern' || this.skillUsed || !this.engine) return;
    const hidden = obs.opponentView.filter(([, b]) => b.number === null);
    if (hidden.length === 0) return;
    const [slotId] = hidden[Math.floor(Math.random() * hidden.length)];
    const pos = obs.opponentView.findIndex(([sid]) => sid === slotId);
    const number = this.engine.peekOpponentSlot(this.index, pos);
    if (number != null) {
      this._insightSlotId = slotId;
      this._insightNumber = number;
      this.skillUsed = true;
    }
  }

  // 엿보기로 알아낸 위치가 아직 미공개 상태로 남아있으면 100% 확신으로 그 자리를 고른다.
  _bestPick(obs) {
    if (this._insightSlotId != null) {
      const idx = obs.opponentView.findIndex(([sid, b]) => sid === this._insightSlotId && b.number === null);
      if (idx !== -1) return [idx, this._insightNumber, 1];
      this._insightSlotId = null; // 이미 공개됐거나 더 이상 유효하지 않음
    }
    return super._bestPick(obs);
  }

  async onWrongGuess(obs, drawnIndex) {
    if (this.skillUsed || !this.skillKey) return super.onWrongGuess(obs, drawnIndex);

    if (this.skillKey === 'bloodyTowel') {
      this.skillUsed = true;
      return { skipReveal: true, retryWithoutPenalty: false, skillLabel: ITEM_SKILLS.bloodyTowel.skill };
    }

    // '속독': 정답을 맞히고 '계속 도전'하다 오답을 낸 경우에만 발동한다(턴의
    // 첫 지목이 바로 틀린 거라면 조건에 안 맞으므로 기본 처리로 넘어간다).
    if (this.skillKey === 'speedRead' && this._hasCorrectGuessThisTurn) {
      this.skillUsed = true;
      return { skipReveal: false, retryWithoutPenalty: true, skillLabel: ITEM_SKILLS.speedRead.skill };
    }

    if (this.skillKey === 'sickle') {
      this.skillUsed = true;
      return { skipReveal: false, retryWithoutPenalty: true, skillLabel: ITEM_SKILLS.sickle.skill };
    }

    return super.onWrongGuess(obs, drawnIndex);
  }

  async onOwnBlockRevealed(_obs, _index) {
    if (this.skillKey === 'rope' && !this.skillUsed) {
      this.skillUsed = true;
      return true;
    }
    return false;
  }
}

// 사람 입력용 전략. UI에서 resolveGuess/resolveContinue를 호출할 때까지
// chooseGuess/continueAfterCorrect가 반환하는 Promise가 대기 상태로 남는다.
class HumanInputStrategy extends Strategy {
  chooseGuess(obs) {
    return new Promise((resolve) => {
      this._resolveGuess = resolve;
      if (this.onNeedGuess) this.onNeedGuess(obs);
    });
  }

  // 덱에 흑/백이 둘 다 남아있으면 실제로 골라야 하므로 Scene에 UI로 물어본다.
  // 한쪽 색이 이미 다 떨어졌으면 고를 게 없으니 곧바로 남은 색으로 진행한다.
  chooseDrawColor(deck) {
    const hasBlack = deck.some((b) => b.color === Color.BLACK);
    const hasWhite = deck.some((b) => b.color === Color.WHITE);
    if (hasBlack && hasWhite) {
      return new Promise((resolve) => {
        this._resolveDrawColor = resolve;
        if (this.onNeedDrawColor) this.onNeedDrawColor();
      });
    }
    return Promise.resolve(hasBlack ? Color.BLACK : Color.WHITE);
  }

  resolveDrawColor(color) {
    if (this._resolveDrawColor) {
      const r = this._resolveDrawColor;
      this._resolveDrawColor = null;
      r(color);
    }
  }

  continueAfterCorrect(obs) {
    return new Promise((resolve) => {
      this._resolveContinue = resolve;
      if (this.onNeedContinueDecision) this.onNeedContinueDecision(obs);
    });
  }

  resolveGuess(pos, number) {
    if (this._resolveGuess) {
      const r = this._resolveGuess;
      this._resolveGuess = null;
      r([pos, number]);
    }
  }

  resolveContinue(shouldContinue) {
    if (this._resolveContinue) {
      const r = this._resolveContinue;
      this._resolveContinue = null;
      r(shouldContinue);
    }
  }
}

// 사람 플레이어용 전략 + 이전에 쓰러뜨린 용의자들에게서 얻은 아이템 스킬.
// 봇과 달리 사람은 스킬을 "언제 쓸지" 직접 고르므로, 엔진 훅이 호출될 때마다
// 곧바로 판단하지 않고 Scene에 UI로 물어본 뒤 그 결과로 Promise를 resolve한다.
class SkilledHumanInputStrategy extends HumanInputStrategy {
  constructor(unlockedSkillKeys = []) {
    super();
    this.unlockedSkillKeys = new Set(unlockedSkillKeys);
    this.usedThisMatch = new Set();
  }

  hasSkill(key) {
    return this.unlockedSkillKeys.has(key) && !this.usedThisMatch.has(key);
  }

  markUsed(key) {
    this.usedThisMatch.add(key);
  }

  // '엿보기'는 반응형 훅이 아니라 자기 턴에 원할 때 직접 쓰는 액션이라
  // Scene이 버튼 클릭 시 이 메서드를 직접 호출한다.
  useInsight(pos) {
    if (!this.hasSkill('lantern') || !this.engine) return null;
    const number = this.engine.peekOpponentSlot(this.index, pos);
    this.markUsed('lantern');
    return number;
  }

  onWrongGuess(obs, drawnIndex) {
    // 쓸 수 있는 능력이 없어도, 오답 페널티로 공개할 카드는 항상 직접 고르게 한다
    // (Scene이 usable.length로 능력 선택 팝업을 띄울지 곧바로 카드 선택으로 갈지 결정).
    // '속독'은 이번 턴에 이미 정답을 맞히고 '계속 도전' 중일 때만 선택지로 보여준다.
    const usable = ['bloodyTowel', 'speedRead', 'sickle'].filter((k) => {
      if (!this.hasSkill(k)) return false;
      if (k === 'speedRead' && !this._hasCorrectGuessThisTurn) return false;
      return true;
    });
    return new Promise((resolve) => {
      this._resolveWrongGuessDecision = resolve;
      if (this.onNeedWrongGuessDecision) this.onNeedWrongGuessDecision(obs, usable, drawnIndex);
    });
  }

  // Scene이 사용자의 선택(스킬 미사용 포함)을 반영해 최종 decision을 만들어 넘긴다.
  resolveWrongGuessDecision(decision) {
    if (this._resolveWrongGuessDecision) {
      const r = this._resolveWrongGuessDecision;
      this._resolveWrongGuessDecision = null;
      r(decision || {
        skipReveal: false, revealIndex: null, retryWithoutPenalty: false,
      });
    }
  }

  onOwnBlockRevealed(obs, index) {
    if (!this.hasSkill('rope')) return super.onOwnBlockRevealed(obs, index);
    return new Promise((resolve) => {
      this._resolveRewindDecision = resolve;
      if (this.onNeedRewindDecision) this.onNeedRewindDecision(obs, index);
    });
  }

  resolveRewindDecision(useIt) {
    if (this._resolveRewindDecision) {
      const r = this._resolveRewindDecision;
      this._resolveRewindDecision = null;
      if (useIt) this.markUsed('rope');
      r(!!useIt);
    }
  }
}

// ---------------------------------------------------------------------------
// 매치 엔진 (1:1 한 판)
// ---------------------------------------------------------------------------

class MatchEngine {
  static INITIAL_HAND_SIZE = 4;

  // onEvent: Scene이 렌더링에 쓰는 콜백. 항상 "공개된 정보만" 담긴
  // sanitize된 이벤트를 받는다 (전략들이 받는 것과 동일).
  constructor(playerA, playerB, strategyA, strategyB, startingPlayer = 0, onEvent = null) {
    this.players = [playerA, playerB];
    this.strategies = [strategyA, strategyB];
    strategyA.bind(playerA, 0);
    strategyB.bind(playerB, 1);
    strategyA.attachEngine(this);
    strategyB.attachEngine(this);
    this.deck = buildDeck();
    this.turn = startingPlayer;
    this.log = [];
    this.winner = null;
    this.onEventCallback = onEvent;
    this._dealInitialHands();
  }

  // 대전 시작 시 1회 발동하는 스킬('엿보기' 등)을 위한 훅. 생성자에서 곧바로
  // 부르지 않는다 - Scene의 초기 4장 배분 연출이 아직 시작도 안 했는데
  // 스킬(예: '엿보기') 배너가 먼저 튀어나오는 원인이었다. 그 연출이 다 끝난
  // 뒤 Scene이 명시적으로 호출해줘야 한다.
  triggerMatchStart() {
    this.strategies.forEach((s, i) => {
      s.onMatchStart(this._makeObservation(this.players[i], this.players[1 - i]));
    });
  }

  // 아이템 스킬 '엿보기' 전용: 상대 패의 특정 위치를 공개하지 않고 몰래 확인한다.
  // 값은 호출한 전략에게만 반환되고, 공개 이벤트에는 절대 담기지 않는다.
  peekOpponentSlot(callerIndex, pos) {
    const opponent = this.players[1 - callerIndex];
    const slot = opponent.hand.slots[pos];
    if (!slot) return null;
    this._emit('skill_used', { player: this.players[callerIndex].name, skill: '엿보기' });
    return slot.block.number;
  }

  // color가 주어지면 덱에서 그 색의 블록을 하나 골라 꺼낸다(숫자는 여전히 무작위 -
  // 덱이 이미 섞여 있으므로 해당 색의 첫 번째 매치를 집는 것으로 충분히 무작위다).
  // color가 없거나 그 색이 이미 소진됐으면 기존처럼 그냥 맨 뒤에서 뽑는다.
  _takeFromDeck(color) {
    if (color) {
      const idx = this.deck.findIndex((b) => b.color === color);
      if (idx >= 0) return this.deck.splice(idx, 1)[0];
    }
    return this.deck.pop();
  }

  _dealInitialHands() {
    for (let i = 0; i < 2; i++) {
      const p = this.players[i];
      const strat = this.strategies[i];
      p.hand.tieBreak = strat.chooseTieBreakSide();
      for (let k = 0; k < MatchEngine.INITIAL_HAND_SIZE; k++) {
        p.insertDrawnBlock(this.deck.pop());
      }
    }
    this.log.push({ kind: 'setup', data: {} });
  }

  // Scene의 애니메이션이 이 이벤트를 다 그릴 때까지 기다렸다가 리턴한다(onEventCallback이
  // Promise를 반환하면 그걸 await한다). 이렇게 엔진을 Scene 연출 속도에 묶어두지 않으면,
  // 엔진은 사람 입력을 기다리는 지점 외에는 즉시 다음 턴까지 데이터를 다 진행시켜 버려서
  // (예: 사람 턴에서 막혀도 그 전까지 봇 턴 여러 개가 이미 끝나 있을 수 있음),
  // 아직 애니메이션이 안 끝난 카드의 revealed 여부 같은 "미래 상태"가 화면에 그대로
  // 새어나가거나(예: 상대가 방금 뽑은 카드 숫자가 미리 보임), 애니메이션 큐에 쌓인
  // 지난 턴들이 다 재생될 때까지 화면이 "상대 턴"에 멈춰있는 것처럼 보이는 원인이 된다.
  async _emit(kind, data) {
    const event = { kind, data };
    this.log.push(event);
    const pub = this._sanitize(event);
    if (pub) {
      let pending = null;
      if (this.onEventCallback) pending = this.onEventCallback(pub);
      this.strategies.forEach((s) => s.onEvent(pub));
      if (pending && typeof pending.then === 'function') await pending;
    }
  }

  _sanitize(event) {
    const { kind, data } = event;
    if (kind === 'draw') {
      return { kind, data: { player: data.player } }; // 뽑은 값은 비공개
    }
    if (kind === 'guess') {
      const pub = {
        guesser: data.guesser, target: data.target, position: data.position,
        slotId: data.slotId, guess: data.guess, correct: data.correct,
      };
      if (data.correct) pub.actual = data.actual; // 맞혔을 때만 값 공개
      return { kind, data: pub };
    }
    return event; // reveal_*, match_over 등은 이미 전부 공개된 정보
  }

  _makeObservation(active, opponent) {
    return {
      selfName: active.name,
      selfHand: active.hand,
      opponentName: opponent.name,
      opponentView: opponent.hand.viewWithIds(),
      deckSize: this.deck.length,
    };
  }

  isOver() { return this.winner !== null; }

  async playFullMatch(maxTurns = 500) {
    let turns = 0;
    while (!this.isOver() && turns < maxTurns) {
      await this.playTurn();
      turns += 1;
    }
    if (!this.isOver()) throw new Error('최대 턴 수를 초과했습니다 (무한루프 방지용 안전장치).');
    return this.winner;
  }

  async playTurn() {
    if (this.isOver()) return;

    const active = this.players[this.turn];
    const opponent = this.players[1 - this.turn];
    const strat = this.strategies[this.turn];
    const opponentStrat = this.strategies[1 - this.turn];

    let drawnIndex = null;
    if (this.deck.length > 0) {
      const colorChoice = await strat.chooseDrawColor(this.deck.slice());
      const block = this._takeFromDeck(colorChoice);
      drawnIndex = active.insertDrawnBlock(block);
      await this._emit('draw', { player: active.name, block: blockLabel(block) });
    } else {
      await this._emit('deck_empty', { player: active.name });
    }

    while (true) {
      if (opponent.hand.hiddenIndices().length === 0) {
        await this._finish(active, opponent, 'no_hidden_blocks');
        return;
      }

      const obs = this._makeObservation(active, opponent);
      const [pos, guessNumber] = await strat.chooseGuess(obs);
      const actual = opponent.hand.slots[pos].block;
      const slotId = opponent.hand.slots[pos].slotId;
      const correct = actual.number === guessNumber;

      // 'guess' 이벤트를 쏘기 전에 미리 공개해둔다 - Scene의 뒤집기 연출은 이
      // 이벤트 하나로 뒤집기+들어올리기까지 다 끝내고 render()를 다시 부르는데,
      // reveal()을 그 뒤로 미루면 render() 시점에 아직 revealed가 false라서
      // 들어올려졌던 카드가 다시 원래 자리로 내려가 버린다(reveal_opponent는
      // Scene에서 별도 처리 없이 무시되므로, 그 이벤트를 기다렸다간 늦는다).
      if (correct) opponent.hand.reveal(pos);

      await this._emit('guess', {
        guesser: active.name, target: opponent.name, position: pos,
        slotId, guess: guessNumber, actual: actual.number, correct,
      });

      if (correct) {
        await this._emit('reveal_opponent', { player: opponent.name, position: pos, block: blockLabel(actual) });

        // '되감기'(밧줄): 자기 블록이 상대에게 맞아서 공개됐어도 즉시 다시 숨길 수 있다.
        const rehide1 = await opponentStrat.onOwnBlockRevealed(
          this._makeObservation(opponent, active),
          pos,
        );
        if (rehide1) {
          opponent.hand.slots[pos].revealed = false;
          await this._emit('skill_used', { player: opponent.name, skill: '되감기' });
        }

        if (opponent.hand.allRevealed()) {
          await this._finish(active, opponent, 'all_blocks_revealed');
          return;
        }

        const obs2 = this._makeObservation(active, opponent);
        const keepGoing = await strat.continueAfterCorrect(obs2);
        if (keepGoing) continue;
        break;
      } else {
        const decision = drawnIndex !== null
          ? await strat.onWrongGuess(this._makeObservation(active, opponent), drawnIndex)
          : { skipReveal: false, retryWithoutPenalty: false };

        // 페널티 없이 곧바로 다시 지목한다('동시타격'/'속독'). 스킬은 여기서 이미
        // 소모됨 - 배너에는 실제로 발동한 스킬 이름(decision.skillLabel)을 쓴다.
        if (decision.retryWithoutPenalty) {
          await this._emit('skill_used', { player: active.name, skill: decision.skillLabel || '' });
          continue;
        }

        if (decision.skipReveal) {
          // 스킬로 공개 자체를 건너뛴다('보험').
          await this._emit('skill_used', { player: active.name, skill: decision.skillLabel || '' });
        } else {
          // revealIndex가 있으면(스킬 없이 직접 고른 경우) 그 위치를, 없으면
          // 원래 뽑았던 블록을 공개한다.
          const targetIndex = decision.revealIndex != null ? decision.revealIndex : drawnIndex;

          if (targetIndex !== null && !active.hand.isRevealed(targetIndex)) {
            const revealedBlock = active.hand.reveal(targetIndex);
            await this._emit('reveal_self', { player: active.name, position: targetIndex, block: blockLabel(revealedBlock) });

            const rehide2 = await strat.onOwnBlockRevealed(this._makeObservation(active, opponent), targetIndex);
            if (rehide2) {
              active.hand.slots[targetIndex].revealed = false;
              await this._emit('skill_used', { player: active.name, skill: '되감기' });
            }

            if (active.hand.allRevealed()) {
              await this._finish(opponent, active, 'all_blocks_revealed');
              return;
            }
          } else {
            await this._emit('reveal_self_skipped', { player: active.name, reason: 'no_block_drawn_this_turn' });
          }
        }
        break;
      }
    }

    this.turn = 1 - this.turn;
  }

  async _finish(winner, loser, reason) {
    this.winner = winner;
    await this._emit('match_over', { winner: winner.name, loser: loser.name, reason });
  }
}

const BOT_NAMES = ['봇1', '봇2', '봇3', '봇4', '봇5', '봇6'];

// botName에 해당하는 아이템 스킬을 자동으로 얹어서 전략을 만든다.
// BOT_ITEM_ASSIGNMENT에 없는 이름이거나 값이 null이면(봇6) 순수 추리 AI가 된다.
function makeBotStrategy(botName) {
  const skillKey = BOT_ITEM_ASSIGNMENT[botName] ?? null;
  return new SkilledDeductiveStrategy(skillKey, 0.34);
}
