import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Display loading progress
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading...', {
      font: '20px monospace',
      color: '#ffffff',
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load game assets
    // Hero character sprite sheets (Jesse Munguia Jungle Pack - 32x32 frames)
    this.load.spritesheet('hero-idle', 'assets/images/characters/sprites/hero_idle.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('hero-run', 'assets/images/characters/sprites/hero_run.png', {
      frameWidth: 32,
      frameHeight: 32,
    });
    this.load.spritesheet('hero-jump', 'assets/images/characters/sprites/hero_jump.png', {
      frameWidth: 32,
      frameHeight: 32,
    });

    // Backgrounds (pixel art style)
    this.load.image('title-screen', 'assets/images/backgrounds/title-screen.png');
    this.load.image('brazil-forest', 'assets/images/backgrounds/forest.png');
    this.load.image('brazil-village', 'assets/images/backgrounds/village.png');

    // Interactive sprites
    this.load.image('machete-in-stump', 'assets/images/objects/machete-stump.png');
    this.load.image('stump', 'assets/images/objects/stump.png');
    this.load.image('vines', 'assets/images/objects/vines.png');
    this.load.image('flower', 'assets/images/objects/flower-sprite.png');

    // Inventory icons (hi-bit pixel art)
    this.load.image('machete', 'assets/images/icons/icon-machete.png');
    this.load.image('flower-icon', 'assets/images/icons/icon-flower.png');
    this.load.image('rope', 'assets/images/icons/icon-rope.png');
    this.load.image('bow', 'assets/images/icons/icon-bow.png');
  }

  create(): void {
    // Create character animations
    this.createCharacterAnimations();

    this.scene.start('TitleScene');
  }

  private createCharacterAnimations(): void {
    // Hero animations (Jesse Munguia Jungle Pack)
    this.anims.create({
      key: 'hero-idle',
      frames: this.anims.generateFrameNumbers('hero-idle', { start: 0, end: 11 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: 'hero-run',
      frames: this.anims.generateFrameNumbers('hero-run', { start: 0, end: 7 }),
      frameRate: 12,
      repeat: -1,
    });
    this.anims.create({
      key: 'hero-jump',
      frames: this.anims.generateFrameNumbers('hero-jump', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: 0,
    });
  }

}
