// Phaser 게임 설정
const config = {
  type: Phaser.AUTO,           // WebGL 되면 WebGL, 안 되면 Canvas
  width: 1280,                 // 게임 화면 가로
  height: 720,                 // 게임 화면 세로
  backgroundColor: '#1a1a2e', // 배경색 (어두운 남색)

  // 물리 엔진 설정 (충돌 처리용)
  physics: {
    default: 'arcade',         // arcade = 간단한 2D 물리
    arcade: {
      gravity: { y: 0 },      // 탑다운 게임이라 중력 없음
      debug: false             // true로 바꾸면 충돌 영역이 보임 (개발 중에만 켜서 쓰기)
    }
  },

  // 사용할 Scene 목록
  scene: [MapScene]
};

// 게임 시작!
const game = new Phaser.Game(config);
