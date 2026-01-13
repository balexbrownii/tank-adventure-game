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

    // Backgrounds (forest.png is clean without painted machete)
    this.load.image('brazil-forest', 'assets/images/backgrounds/forest.png');
    this.load.image('brazil-village', 'assets/images/backgrounds/village.png');

    // Interactive sprites
    this.load.image('machete-in-stump', 'assets/images/objects/machete-stump.png');
    this.load.image('stump', 'assets/images/objects/stump.png');
    this.load.image('vines', 'assets/images/objects/vines.png');
    this.load.image('flower', 'assets/images/objects/flower-sprite.png');
  }

  create(): void {
    // Generate inventory item icons programmatically
    this.createItemIcons();

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
  }

  private createItemIcons(): void {
    const iconSize = 48;

    // Machete icon - silver blade with brown handle
    const macheteGraphics = this.add.graphics();
    macheteGraphics.fillStyle(0x8B4513); // Brown handle
    macheteGraphics.fillRect(4, 30, 12, 16);
    macheteGraphics.fillStyle(0xC0C0C0); // Silver blade
    macheteGraphics.beginPath();
    macheteGraphics.moveTo(8, 30);
    macheteGraphics.lineTo(4, 8);
    macheteGraphics.lineTo(20, 4);
    macheteGraphics.lineTo(40, 8);
    macheteGraphics.lineTo(44, 14);
    macheteGraphics.lineTo(14, 30);
    macheteGraphics.closePath();
    macheteGraphics.fillPath();
    macheteGraphics.lineStyle(2, 0x888888);
    macheteGraphics.strokePath();
    macheteGraphics.generateTexture('machete', iconSize, iconSize);
    macheteGraphics.destroy();

    // Flower icon - red petals with yellow center and green stem
    const flowerGraphics = this.add.graphics();
    // Stem
    flowerGraphics.fillStyle(0x228B22);
    flowerGraphics.fillRect(21, 28, 6, 18);
    // Petals
    flowerGraphics.fillStyle(0xFF4444);
    flowerGraphics.fillCircle(24, 12, 8);
    flowerGraphics.fillCircle(14, 18, 8);
    flowerGraphics.fillCircle(34, 18, 8);
    flowerGraphics.fillCircle(18, 28, 8);
    flowerGraphics.fillCircle(30, 28, 8);
    // Center
    flowerGraphics.fillStyle(0xFFD700);
    flowerGraphics.fillCircle(24, 20, 6);
    flowerGraphics.generateTexture('flower', iconSize, iconSize);
    flowerGraphics.destroy();

    // Rope icon - coiled brown rope
    const ropeGraphics = this.add.graphics();
    ropeGraphics.lineStyle(6, 0xD2691E); // Chocolate brown
    // Draw coiled rope
    ropeGraphics.beginPath();
    ropeGraphics.arc(24, 24, 16, 0, Math.PI * 1.7);
    ropeGraphics.strokePath();
    ropeGraphics.beginPath();
    ropeGraphics.arc(24, 24, 10, Math.PI * 0.3, Math.PI * 2);
    ropeGraphics.strokePath();
    ropeGraphics.beginPath();
    ropeGraphics.arc(24, 24, 4, Math.PI * 0.8, Math.PI * 2.3);
    ropeGraphics.strokePath();
    // Rope end
    ropeGraphics.lineStyle(4, 0xD2691E);
    ropeGraphics.lineBetween(38, 18, 44, 10);
    ropeGraphics.generateTexture('rope', iconSize, iconSize);
    ropeGraphics.destroy();

    // Bow icon - curved bow with string
    const bowGraphics = this.add.graphics();
    // Bow body (curved wood)
    bowGraphics.lineStyle(4, 0x8B4513);
    bowGraphics.beginPath();
    bowGraphics.arc(24, 24, 18, Math.PI * 0.7, Math.PI * 1.3, false);
    bowGraphics.strokePath();
    // Bowstring
    bowGraphics.lineStyle(2, 0xFFFFFF);
    bowGraphics.lineBetween(10, 12, 10, 36);
    // Arrow
    bowGraphics.lineStyle(3, 0x8B4513);
    bowGraphics.lineBetween(14, 24, 42, 24);
    // Arrowhead
    bowGraphics.fillStyle(0x808080);
    bowGraphics.beginPath();
    bowGraphics.moveTo(42, 24);
    bowGraphics.lineTo(36, 20);
    bowGraphics.lineTo(36, 28);
    bowGraphics.closePath();
    bowGraphics.fillPath();
    // Fletching
    bowGraphics.fillStyle(0xFF4444);
    bowGraphics.beginPath();
    bowGraphics.moveTo(14, 24);
    bowGraphics.lineTo(18, 20);
    bowGraphics.lineTo(20, 24);
    bowGraphics.lineTo(18, 28);
    bowGraphics.closePath();
    bowGraphics.fillPath();
    bowGraphics.generateTexture('bow', iconSize, iconSize);
    bowGraphics.destroy();
  }
}
