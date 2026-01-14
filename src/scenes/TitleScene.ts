import Phaser from 'phaser';
import { audioManager } from '../managers/AudioManager';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Play title screen music (falls back to ambient if not available)
    audioManager.playMusic('title');

    // Dark jungle background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a2010, 0x0a2010, 0x1a4020, 0x1a4020, 1);
    bg.fillRect(0, 0, width, height);

    // Create floating leaf particles for ambient effect
    this.createLeafParticles(width, height);

    // Show animated characters at the bottom
    this.createCharacterShowcase(width, height);

    // Title text with subtle floating animation
    const title = this.add.text(width / 2, height / 3, "Tarzan's Great Adventure", {
      font: 'bold 64px serif',
      color: '#ffd700',
      stroke: '#8b4513',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    title.setDepth(100);

    // Subtle title float animation
    this.tweens.add({
      targets: title,
      y: title.y - 10,
      duration: 2000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 3 + 80, 'A story by Alexander Brown', {
      font: '24px serif',
      color: '#ffffff',
    });
    subtitle.setOrigin(0.5);
    subtitle.setDepth(100);

    // Start prompt
    const startText = this.add.text(width / 2, height * 0.7, 'Click to Start', {
      font: '28px monospace',
      color: '#ffffff',
    });
    startText.setOrigin(0.5);
    startText.setDepth(100);

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
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('BrazilForestScene');
      });
    });
  }

  /**
   * Create floating leaf particle effect
   */
  private createLeafParticles(width: number, _height: number): void {
    // Create a simple leaf texture procedurally
    const graphics = this.add.graphics();
    graphics.fillStyle(0x228B22);
    graphics.fillEllipse(6, 4, 12, 8);
    graphics.generateTexture('leaf-particle', 12, 8);
    graphics.destroy();

    // Create particle emitter for floating leaves
    const leafEmitter = this.add.particles(width / 2, -20, 'leaf-particle', {
      x: { min: 0, max: width },
      speed: { min: 20, max: 50 },
      angle: { min: 80, max: 100 },
      rotate: { min: 0, max: 360 },
      scale: { min: 0.5, max: 1.5 },
      alpha: { start: 0.8, end: 0.3 },
      lifespan: { min: 8000, max: 12000 },
      frequency: 300,
      tint: [0x228B22, 0x32CD32, 0x006400, 0x90EE90],
    });
    leafEmitter.setDepth(50);
  }

  /**
   * Show animated character sprites at the bottom of the title screen
   */
  private createCharacterShowcase(width: number, height: number): void {
    const groundY = height - 80;
    const characterScale = 2.5;

    // Tarzan in the center
    const tarzan = this.add.sprite(width / 2, groundY, 'tarzan');
    tarzan.setScale(characterScale);
    tarzan.setOrigin(0.5, 1);
    tarzan.play('tarzan-idle');
    tarzan.setDepth(90);

    // Pig on the left
    const pig = this.add.sprite(width / 2 - 150, groundY, 'pig');
    pig.setScale(characterScale * 0.75);
    pig.setOrigin(0.5, 1);
    pig.play('pig-idle');
    pig.setDepth(90);

    // Mr. Snuggles on the right
    const deer = this.add.sprite(width / 2 + 150, groundY, 'deer');
    deer.setScale(characterScale * 0.85);
    deer.setOrigin(0.5, 1);
    deer.play('deer-idle');
    deer.setDepth(90);

    // Subtle bounce animation for characters
    this.tweens.add({
      targets: [tarzan, pig, deer],
      y: '-=5',
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }
}
