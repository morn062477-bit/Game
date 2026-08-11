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
  scene: [MapScene, DaVinciCodeScene],
};

new Phaser.Game(config);
