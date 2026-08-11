import Phaser from 'phaser';
import { BOT_NAMES, ITEM_SKILLS } from '../logic/daVinciLogic.js';

// 맵 탐색 자리표시자 씬. 화살표 키로 이동하고, 용의자(NPC)에게 다가가
// 스페이스를 누르면 다빈치코드 대전 씬으로 전환된다.
// 실제 타일맵/대화창/단서 UI는 아직 없고, 흐름 연결만 잡아둔 상태다.
export default class MapScene extends Phaser.Scene {
  constructor() {
    super('MapScene');
  }

  create(data) {
    this.add.text(20, 16, '맵 탐색 (화살표 키 이동, 용의자 근처에서 스페이스)', {
      fontSize: '14px',
      color: '#ffffff',
    });

    this.player = this.add.rectangle(200, 400, 24, 24, 0x4fd1c5);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);

    this.suspects = BOT_NAMES.map((name, i) => {
      const x = 150 + i * 100;
      const y = 200;
      const npc = this.add.circle(x, y, 16, 0xf6ad55);
      this.add.text(x, y - 30, name, { fontSize: '12px', color: '#ffffff' }).setOrigin(0.5);
      return { name, x, y };
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.resultText = this.add.text(20, 560, '', { fontSize: '14px', color: '#ffe9a8' });
    if (data && data.result) {
      const { bot, win } = data.result;
      this.resultText.setText(win ? `${bot}에게서 단서를 얻었다.` : `${bot}과의 대전에서 패배했다...`);
    }

    // 지금까지 쓰러뜨린 용의자에게서 얻은 능력 목록 (registry는 씬을 넘나들어도 유지된다)
    const unlocked = this.registry.get('unlockedSkills') || [];
    const labels = unlocked.map((k) => ITEM_SKILLS[k]?.skill).filter(Boolean);
    this.add.text(
      20,
      580,
      labels.length ? `보유 능력: ${labels.join(', ')}` : '보유 능력: 없음',
      { fontSize: '12px', color: '#7dd6ff' },
    );
  }

  update() {
    const speed = 160;
    this.player.body.setVelocity(0);
    if (this.cursors.left.isDown) this.player.body.setVelocityX(-speed);
    else if (this.cursors.right.isDown) this.player.body.setVelocityX(speed);
    if (this.cursors.up.isDown) this.player.body.setVelocityY(-speed);
    else if (this.cursors.down.isDown) this.player.body.setVelocityY(speed);

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      const near = this.suspects.find(
        (s) => Phaser.Math.Distance.Between(this.player.x, this.player.y, s.x, s.y) < 40,
      );
      if (near) {
        this.scene.start('DaVinciCodeScene', { botName: near.name });
      }
    }
  }
}
