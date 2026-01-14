import Phaser from 'phaser';
import { audioManager } from '../managers/AudioManager';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Play epic title screen music
    audioManager.playMusic('title');

    // Epic pixel art background
    const bg = this.add.image(width / 2, height / 2, 'title-screen');
    bg.setDisplaySize(width, height);
    bg.setDepth(0);

    // Cinematic letterbox bars for movie feel
    const letterboxHeight = 40;
    const topBar = this.add.rectangle(width / 2, letterboxHeight / 2, width, letterboxHeight, 0x000000);
    const bottomBar = this.add.rectangle(width / 2, height - letterboxHeight / 2, width, letterboxHeight, 0x000000);
    topBar.setDepth(200);
    bottomBar.setDepth(200);

    // Create floating particle effects (fireflies/dust motes)
    this.createParticleEffects(width, height);

    // Epic title with dramatic styling
    const title = this.add.text(width / 2, height * 0.18, "TARZAN'S", {
      font: 'bold 52px serif',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 8,
    });
    title.setOrigin(0.5);
    title.setDepth(150);

    const titleLine2 = this.add.text(width / 2, height * 0.28, 'GREAT ADVENTURE', {
      font: 'bold 42px serif',
      color: '#ff8c00',
      stroke: '#000000',
      strokeThickness: 6,
    });
    titleLine2.setOrigin(0.5);
    titleLine2.setDepth(150);

    // Dramatic title glow pulse
    this.tweens.add({
      targets: [title, titleLine2],
      alpha: { from: 1, to: 0.85 },
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Story credit
    const subtitle = this.add.text(width / 2, height * 0.88, 'A story by Alexander Brown', {
      font: 'italic 20px serif',
      color: '#ffffff',
    });
    subtitle.setOrigin(0.5);
    subtitle.setDepth(150);
    subtitle.setAlpha(0.9);

    // Start prompt with cinematic styling
    const startText = this.add.text(width / 2, height * 0.75, '[ CLICK TO BEGIN YOUR ADVENTURE ]', {
      font: '22px monospace',
      color: '#ffd700',
    });
    startText.setOrigin(0.5);
    startText.setDepth(150);

    // Dramatic blink effect
    this.tweens.add({
      targets: startText,
      alpha: { from: 1, to: 0.3 },
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // Dramatic fade-in on scene start
    this.cameras.main.fadeIn(1500, 0, 0, 0);

    // Start game on click with dramatic transition
    this.input.once('pointerdown', () => {
      // Flash effect
      this.cameras.main.flash(300, 255, 255, 255);
      this.time.delayedCall(300, () => {
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.time.delayedCall(800, () => {
          this.scene.start('BrazilForestScene');
        });
      });
    });
  }

  /**
   * Create floating particle effects (fireflies/dust motes)
   */
  private createParticleEffects(width: number, height: number): void {
    // Create glowing particle texture
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffdd88);
    graphics.fillCircle(4, 4, 4);
    graphics.fillStyle(0xffffcc);
    graphics.fillCircle(4, 4, 2);
    graphics.generateTexture('firefly', 8, 8);
    graphics.destroy();

    // Firefly particles floating upward
    const fireflyEmitter = this.add.particles(width / 2, height, 'firefly', {
      x: { min: 50, max: width - 50 },
      y: { min: height * 0.4, max: height * 0.9 },
      speed: { min: 10, max: 30 },
      angle: { min: 250, max: 290 },
      scale: { min: 0.3, max: 1.0 },
      alpha: { start: 0, end: 0.9, ease: 'Sine.easeInOut' },
      lifespan: { min: 4000, max: 8000 },
      frequency: 200,
      blendMode: Phaser.BlendModes.ADD,
    });
    fireflyEmitter.setDepth(100);

    // Dust motes drifting
    const dustGraphics = this.add.graphics();
    dustGraphics.fillStyle(0xffeedd);
    dustGraphics.fillCircle(2, 2, 2);
    dustGraphics.generateTexture('dust', 4, 4);
    dustGraphics.destroy();

    const dustEmitter = this.add.particles(0, 0, 'dust', {
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      speed: { min: 5, max: 15 },
      angle: { min: 0, max: 360 },
      scale: { min: 0.2, max: 0.6 },
      alpha: { start: 0.4, end: 0 },
      lifespan: { min: 6000, max: 10000 },
      frequency: 400,
    });
    dustEmitter.setDepth(95);
  }
}
