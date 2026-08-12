import Phaser from 'phaser';
import MapScene from './scenes/MapScene.js';
import DaVinciCodeScene from './scenes/DaVinciCodeScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#12141c',
  parent: 'game-container',
  pixelArt: true, // 텍스처/도형 확대 시 부드럽게 뭉개지지 않고 각지게(픽셀아트 느낌) 렌더링
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  // 배열의 첫 씬이 자동으로 시작된다. 봇을 골라 스페이스로 진입하던 단계를 건너뛰고
  // 곧장 대전에 들어가도록 DaVinciCodeScene을 앞에 둔다. MapScene은 매치가 끝난 뒤
  // 돌아갈 곳으로 계속 등록해 둔다.
  scene: [DaVinciCodeScene, MapScene],
};

new Phaser.Game(config);
