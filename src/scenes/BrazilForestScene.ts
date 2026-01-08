import Phaser from 'phaser';

export class BrazilForestScene extends Phaser.Scene {
  private tank!: Phaser.GameObjects.Image;
  private pig!: Phaser.GameObjects.Image;
  private deer!: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'BrazilForestScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    const bg = this.add.image(width / 2, height / 2, 'brazil-forest');
    bg.setDisplaySize(width, height);

    // Characters - scaled down to fit the scene
    const characterScale = 0.15;
    const groundY = height - 60;

    // Tank (main character, center)
    this.tank = this.add.image(width / 2, groundY, 'tank');
    this.tank.setScale(characterScale);
    this.tank.setOrigin(0.5, 1);

    // Pig (left of Tank)
    this.pig = this.add.image(width / 2 - 100, groundY, 'pig');
    this.pig.setScale(characterScale * 0.8);
    this.pig.setOrigin(0.5, 1);

    // Mr. Snuggles the deer (right of Tank)
    this.deer = this.add.image(width / 2 + 100, groundY, 'deer');
    this.deer.setScale(characterScale * 0.9);
    this.deer.setOrigin(0.5, 1);

    // Scene title
    this.add.text(width / 2, 20, 'Brazilian Rainforest', {
      font: 'bold 20px serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Instructions
    this.add.text(width / 2, height - 15, 'Click to move Tank | Arrow keys also work', {
      font: '12px monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Click-to-move Tank
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.tweens.add({
        targets: this.tank,
        x: pointer.x,
        duration: 500,
        ease: 'Power2',
      });
    });

    // Keyboard movement
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors) {
      this.input.keyboard?.on('keydown', () => {
        const speed = 15;
        if (cursors.left.isDown) {
          this.tank.x -= speed;
          this.tank.setFlipX(true);
        } else if (cursors.right.isDown) {
          this.tank.x += speed;
          this.tank.setFlipX(false);
        }
      });
    }
  }
}
