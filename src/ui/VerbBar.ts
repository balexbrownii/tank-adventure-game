import Phaser from 'phaser';
import { InteractionVerb } from '../entities/Hotspot';

interface VerbConfig {
  verb: InteractionVerb;
  label: string;
  hotkey: string;
}

const VERBS: VerbConfig[] = [
  { verb: 'LOOK', label: 'Look at', hotkey: '1' },
  { verb: 'USE', label: 'Use', hotkey: '2' },
  { verb: 'TAKE', label: 'Take', hotkey: '3' },
  { verb: 'TALK', label: 'Talk to', hotkey: '4' },
  { verb: 'PUSH', label: 'Push', hotkey: '5' },
  { verb: 'PULL', label: 'Pull', hotkey: '6' },
];

const VERB_BAR_HEIGHT = 80;
const VERB_BUTTON_WIDTH = 120;
const VERB_BUTTON_HEIGHT = 50;
const VERB_BUTTON_PADDING = 12;

/**
 * VerbBar - Monkey Island style verb interface
 * Bottom-of-screen menu for selecting interaction verbs
 */
export class VerbBar extends Phaser.GameObjects.Container {
  private selectedVerb: InteractionVerb = 'LOOK';
  private verbButtons: Map<InteractionVerb, Phaser.GameObjects.Container> = new Map();
  private background: Phaser.GameObjects.Rectangle;

  // Callbacks
  private onVerbSelect: ((verb: InteractionVerb) => void)[] = [];

  constructor(scene: Phaser.Scene) {
    // Position at bottom of screen
    const gameWidth = scene.cameras.main.width;
    const gameHeight = scene.cameras.main.height;

    super(scene, 0, gameHeight - VERB_BAR_HEIGHT);

    // Background
    this.background = scene.add.rectangle(
      gameWidth / 2,
      VERB_BAR_HEIGHT / 2,
      gameWidth,
      VERB_BAR_HEIGHT,
      0x1a1a2e,
      0.95
    );
    this.add(this.background);

    // Create verb buttons
    const totalWidth = VERBS.length * (VERB_BUTTON_WIDTH + VERB_BUTTON_PADDING);
    const startX = (gameWidth - totalWidth) / 2 + VERB_BUTTON_WIDTH / 2;

    VERBS.forEach((verbConfig, index) => {
      const x = startX + index * (VERB_BUTTON_WIDTH + VERB_BUTTON_PADDING);
      const button = this.createVerbButton(verbConfig, x, VERB_BAR_HEIGHT / 2);
      this.verbButtons.set(verbConfig.verb, button);
      this.add(button);
    });

    // Keyboard shortcuts
    scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const verbConfig = VERBS.find(v => v.hotkey === event.key);
      if (verbConfig) {
        this.selectVerb(verbConfig.verb);
      }
    });

    // Highlight default verb
    this.updateButtonHighlights();

    // Add to scene
    scene.add.existing(this);

    // Make sure verb bar is on top
    this.setDepth(1000);
  }

  private createVerbButton(config: VerbConfig, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Button background
    const bg = this.scene.add.rectangle(0, 0, VERB_BUTTON_WIDTH, VERB_BUTTON_HEIGHT, 0x333355);
    bg.setStrokeStyle(2, 0x4a4a6a);
    bg.setInteractive({ useHandCursor: true });

    // Button text
    const text = this.scene.add.text(0, 0, `${config.hotkey}. ${config.label}`, {
      font: '16px monospace',
      color: '#ffffff',
    });
    text.setOrigin(0.5, 0.5);

    container.add([bg, text]);

    // Store reference to background for highlighting
    container.setData('bg', bg);
    container.setData('verb', config.verb);

    // Click handler
    bg.on('pointerdown', () => {
      this.selectVerb(config.verb);
    });

    // Hover effects
    bg.on('pointerover', () => {
      if (this.selectedVerb !== config.verb) {
        bg.setFillStyle(0x444466);
      }
    });

    bg.on('pointerout', () => {
      if (this.selectedVerb !== config.verb) {
        bg.setFillStyle(0x333355);
      }
    });

    return container;
  }

  /**
   * Select a verb
   */
  selectVerb(verb: InteractionVerb): void {
    this.selectedVerb = verb;
    this.updateButtonHighlights();
    this.onVerbSelect.forEach(cb => cb(verb));
  }

  /**
   * Get the currently selected verb
   */
  getSelectedVerb(): InteractionVerb {
    return this.selectedVerb;
  }

  /**
   * Set the current target (hotspot being hovered) - kept for API compatibility
   */
  setTarget(_targetName: string): void {
    // No longer displaying status text
  }

  /**
   * Set the current held item - kept for API compatibility
   */
  setHeldItem(_itemName: string): void {
    // No longer displaying status text
  }

  /**
   * Clear the held item - kept for API compatibility
   */
  clearHeldItem(): void {
    // No longer displaying status text
  }

  private updateButtonHighlights(): void {
    for (const [verb, container] of this.verbButtons) {
      const bg = container.getData('bg') as Phaser.GameObjects.Rectangle;
      if (verb === this.selectedVerb) {
        bg.setFillStyle(0x5555aa);
        bg.setStrokeStyle(2, 0x7777cc);
      } else {
        bg.setFillStyle(0x333355);
        bg.setStrokeStyle(2, 0x4a4a6a);
      }
    }
  }

  /**
   * Subscribe to verb selection events
   */
  onSelect(callback: (verb: InteractionVerb) => void): void {
    this.onVerbSelect.push(callback);
  }

  /**
   * Show/hide the verb bar
   */
  setVisible(visible: boolean): this {
    super.setVisible(visible);
    return this;
  }

  /**
   * Get the height of the verb bar (for adjusting game area)
   */
  getHeight(): number {
    return VERB_BAR_HEIGHT;
  }

  /**
   * Clean up
   */
  destroy(fromScene?: boolean): void {
    this.onVerbSelect = [];
    super.destroy(fromScene);
  }
}

export { VERB_BAR_HEIGHT };
