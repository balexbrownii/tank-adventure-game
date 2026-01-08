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

const VERB_BAR_HEIGHT = 60;
const VERB_BUTTON_WIDTH = 90;
const VERB_BUTTON_HEIGHT = 40;
const VERB_BUTTON_PADDING = 8;

/**
 * VerbBar - Monkey Island style verb interface
 * Bottom-of-screen menu for selecting interaction verbs
 */
export class VerbBar extends Phaser.GameObjects.Container {
  private selectedVerb: InteractionVerb = 'LOOK';
  private verbButtons: Map<InteractionVerb, Phaser.GameObjects.Container> = new Map();
  private statusText: Phaser.GameObjects.Text;
  private currentTarget: string = '';
  private currentItem: string = '';
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

    // Status text (shows current action like "Use key on door")
    this.statusText = scene.add.text(gameWidth / 2, 8, '', {
      font: '14px monospace',
      color: '#ffffff',
    });
    this.statusText.setOrigin(0.5, 0);
    this.add(this.statusText);

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
      font: '12px monospace',
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
    this.updateStatusText();
    this.onVerbSelect.forEach(cb => cb(verb));
  }

  /**
   * Get the currently selected verb
   */
  getSelectedVerb(): InteractionVerb {
    return this.selectedVerb;
  }

  /**
   * Set the current target (hotspot being hovered)
   */
  setTarget(targetName: string): void {
    this.currentTarget = targetName;
    this.updateStatusText();
  }

  /**
   * Set the current held item
   */
  setHeldItem(itemName: string): void {
    this.currentItem = itemName;
    this.updateStatusText();
  }

  /**
   * Clear the held item
   */
  clearHeldItem(): void {
    this.currentItem = '';
    this.updateStatusText();
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

  private updateStatusText(): void {
    const verbConfig = VERBS.find(v => v.verb === this.selectedVerb);
    const verbLabel = verbConfig?.label ?? this.selectedVerb;

    let status = verbLabel;

    if (this.currentItem) {
      status = `${verbLabel} ${this.currentItem}`;
      if (this.currentTarget) {
        status += ` on ${this.currentTarget}`;
      }
    } else if (this.currentTarget) {
      status = `${verbLabel} ${this.currentTarget}`;
    }

    this.statusText.setText(status);
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
