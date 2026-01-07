import Phaser from 'phaser';

export class BrazilForestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BrazilForestScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Placeholder background
    this.add.rectangle(width / 2, height / 2, width, height, 0x228b22);

    // Scene title (temporary)
    this.add.text(width / 2, 30, 'Brazilian Rainforest', {
      font: '24px serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Placeholder for Tank (will be replaced with sprite)
    const tankPlaceholder = this.add.rectangle(width / 2, height - 100, 60, 100, 0xff6b6b);
    this.add.text(width / 2, height - 100, 'TANK', {
      font: '12px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Instructions
    this.add.text(width / 2, height - 30, 'Use arrow keys or click to move', {
      font: '14px monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Basic click-to-move
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.tweens.add({
        targets: tankPlaceholder,
        x: pointer.x,
        duration: 500,
        ease: 'Power2',
      });
    });

    // Keyboard movement
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors) {
      this.input.keyboard?.on('keydown', () => {
        if (cursors.left.isDown) {
          tankPlaceholder.x -= 10;
        } else if (cursors.right.isDown) {
          tankPlaceholder.x += 10;
        }
        if (cursors.up.isDown) {
          tankPlaceholder.y -= 10;
        } else if (cursors.down.isDown) {
          tankPlaceholder.y += 10;
        }
      });
    }
  }
}
