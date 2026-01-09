import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title text (placeholder until we have title art)
    const title = this.add.text(width / 2, height / 3, "Tarzan's Great Adventure", {
      font: 'bold 64px serif',
      color: '#ffd700',
      stroke: '#8b4513',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 3 + 80, 'A story by Alexander Brown', {
      font: '24px serif',
      color: '#ffffff',
    });
    subtitle.setOrigin(0.5);

    // Start prompt
    const startText = this.add.text(width / 2, height * 0.7, 'Click to Start', {
      font: '28px monospace',
      color: '#ffffff',
    });
    startText.setOrigin(0.5);

    // Blink effect
    this.tweens.add({
      targets: startText,
      alpha: 0.2,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Start game on click
    this.input.once('pointerdown', () => {
      this.scene.start('BrazilForestScene');
    });
  }
}
