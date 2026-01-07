import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Load minimal assets needed for loading screen
    // This could be a simple logo or loading bar graphics
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
