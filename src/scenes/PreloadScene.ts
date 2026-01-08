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
    // Characters
    this.load.image('tank', 'assets/images/characters/tank.png');
    this.load.image('pig', 'assets/images/characters/pig.png');
    this.load.image('deer', 'assets/images/characters/deer.png');

    // Backgrounds
    this.load.image('brazil-forest', 'assets/images/backgrounds/forest-interactive.png');
    this.load.image('brazil-village', 'assets/images/backgrounds/village.png');

    // Interactive object sprites
    this.load.image('machete-in-stump', 'assets/images/objects/machete-stump.png');
  }

  create(): void {
    // Generate inventory item icons programmatically
    this.createItemIcons();

    this.scene.start('TitleScene');
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
  }
}
