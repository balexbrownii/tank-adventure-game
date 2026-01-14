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
    // Character sprite sheets (animated pixel art)
    this.load.spritesheet('tarzan', 'assets/images/characters/sprites/tarzan_walk.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('pig', 'assets/images/characters/sprites/pig_walk.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('deer', 'assets/images/characters/sprites/mr_snuggles_walk.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    this.load.spritesheet('trader', 'assets/images/characters/sprites/trader_walk.png', {
      frameWidth: 64,
      frameHeight: 64,
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
    // Tarzan animations
    this.anims.create({
      key: 'tarzan-idle',
      frames: [{ key: 'tarzan', frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: 'tarzan-walk',
      frames: this.anims.generateFrameNumbers('tarzan', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    // Pig animations
    this.anims.create({
      key: 'pig-idle',
      frames: [{ key: 'pig', frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: 'pig-walk',
      frames: this.anims.generateFrameNumbers('pig', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    // Deer (Mr. Snuggles) animations
    this.anims.create({
      key: 'deer-idle',
      frames: [{ key: 'deer', frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: 'deer-walk',
      frames: this.anims.generateFrameNumbers('deer', { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    // Trader animations
    this.anims.create({
      key: 'trader-idle',
      frames: [{ key: 'trader', frame: 0 }],
      frameRate: 1,
      repeat: 0,
    });
    this.anims.create({
      key: 'trader-walk',
      frames: this.anims.generateFrameNumbers('trader', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });
  }

}
