// Phaser 게임 설정
const config = {
  type: Phaser.AUTO,           // WebGL 되면 WebGL, 안 되면 Canvas
  width: 960,                  // 게임 화면 가로 (축소)
  height: 540,                 // 게임 화면 세로 (축소, 1280x720과 같은 16:9 비율)
  backgroundColor: '#1a1a2e', // 배경색 (어두운 남색)

  // 물리 엔진 설정 (충돌 처리용)
  physics: {
    default: 'arcade',         // arcade = 간단한 2D 물리
    arcade: {
      gravity: { y: 0 },      // 탑다운 게임이라 중력 없음
      debug: false            // true로 바꾸면 충돌 영역이 보임 (개발 중에만 켜서 쓰기)
    }
  },

  // 사용할 Scene 목록. 용의자 NPC와 대화를 시작하면 SuspectVNScene(미연시풍 배경+
  // 일러스트+대사)으로 넘어가고, 대사가 끝나면 DaVinciCodeScene(다빈치코드 미니게임)으로
  // 이어진다. 대전에서 이기면 SuspectChoiceScene(심문 선택지 화면)으로, 지면 바로
  // 마을로 돌아간다.
  scene: [MapScene, SuspectVNScene, DaVinciCodeScene, SuspectChoiceScene, FinalDeductionScene, EndingStoryScene]
};

// =============================================
// 게임 시작 및 프롤로그 흐름
// =============================================
// 프롤로그를 먼저 보여주고, 컷씬이 끝나면 잠깐 멈춰서 auth-ui.js가 로그인/세이브 화면을
// 띄울 수 있게 해준다(로그인 -> 새 게임/이어하기에서 다시 startGame()을 부르면 이어서
// 재생됨). game/introFlowPromise는 모듈 스코프에 둬서 이 파일을 다시 안 읽어도 유지된다.

let game = null;
let introFlowPromise = null;

function startGame() {
  if (game) {
    const mapScene = game.scene.getScene('MapScene');

    // Phaser는 pause()/resume()을 호출 즉시 반영하지 않고 다음 프레임에 내부적으로
    // 큐를 처리하면서 반영한다 - 그래서 pause() 호출 직후 isPaused()를 확인하면 아직
    // false로 나올 수 있다(실제로는 그 다음 프레임에 paused로 바뀜). 그 타이밍에 맞춰
    // isPaused()로 분기하면 이 레이스 때문에 resume()이 통째로 스킵되고 영원히 멈춰있게
    // 된다 - 그래서 상태를 확인하지 않고 그냥 무조건 resume()을 호출한다(이미 실행 중인
    // 씬에 resume()을 불러도 Phaser가 안전하게 무시한다).
    mapScene?.scene.resume();

    return;
  }

  game = new Phaser.Game(config);
  window.game = game;

  console.log('게임 시작');
}

function playPrologueBeforeAuth() {
  if (introFlowPromise) {
    return introFlowPromise;
  }

  startGame();

  introFlowPromise = new Promise((resolve) => {
    let introStarted = false;

    const checkIntroState = window.setInterval(() => {
      const mapScene = game?.scene.getScene('MapScene');

      if (!mapScene?.scene.isActive()) {
        return;
      }

      if (mapScene.isCutscene) {
        introStarted = true;
        return;
      }

      if (!introStarted) {
        return;
      }

      window.clearInterval(checkIntroState);
      mapScene.scene.pause();
      resolve();
    }, 100);
  });

  return introFlowPromise;
}

// "이어하기"처럼 이미 진행 중이던 세이브를 불러올 때 쓴다. 매번 오프닝 컷씬을 처음부터
// 끝까지 다시 보여주고 기다리는 대신(playPrologueBeforeAuth), 컷씬이 재생 중이면 즉시
// 건너뛰고(Enter로 스킵하는 것과 같은 skipIntroCutscene()) 곧바로 조작권을 돌려준다.
function skipPrologueAndStart() {
  startGame();

  return new Promise((resolve) => {
    const check = window.setInterval(() => {
      const mapScene = game?.scene.getScene('MapScene');

      if (!mapScene?.scene.isActive()) {
        return;
      }

      window.clearInterval(check);

      if (mapScene.isCutscene) {
        mapScene.skipIntroCutscene();
      }

      resolve();
    }, 100);
  });
}

function resumeStoryFromSave() {
  const save = window.GameSave?.state?.data;
  const mapScene = game?.scene.getScene('MapScene');
  if (!save || !mapScene) return;
  const phase = save.story?.phase;
  if (phase === 'final_gather') {
    if (save.story.finalGatherPlayed === false) {
      mapScene.scene.restart({ mapKey: 'map_01_village', endingGather: true });
    } else {
      mapScene.scene.start('FinalDeductionScene');
    }
  } else if (phase === 'final_deduction') {
    mapScene.scene.start('FinalDeductionScene');
  } else if (phase === 'farmer_escape') {
    mapScene.scene.restart({ mapKey: 'map_02_forest', storyEvent: 'forestDiscovery' });
  } else if (phase === 'hidden_forest') {
    // 랜턴 수리 직후 저장된 경우에도 숲 입구 걷기 컷신부터 정확히 복구한다.
    mapScene.scene.restart({ mapKey: 'map_02_forest', storyEvent: 'walkToHiddenForest' });
  } else if (phase === 'confession') {
    mapScene.scene.start('EndingStoryScene', { route: 'bodyConfession' });
  } else if (phase === 'ending' && save.ending) {
    mapScene.scene.start('EndingStoryScene', { route: save.ending });
  }
}

window.startGame = startGame;
window.playPrologueBeforeAuth = playPrologueBeforeAuth;
window.skipPrologueAndStart = skipPrologueAndStart;
window.resumeStoryFromSave = resumeStoryFromSave;

// 브라우저 오디오 자동재생 잠금 해제는 이제 별도의 "클릭하여 시작" 화면 대신, 로그인/
// 이어하기 화면 위에서 첫 클릭이 일어나는 순간 처리한다(systems/auth-ui.js의
// unlockAudioAndStartPrologue 참고) - 그게 이 playPrologueBeforeAuth()를 호출해준다.
