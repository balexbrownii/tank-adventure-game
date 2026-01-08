import Phaser from 'phaser';

export type InteractionVerb = 'LOOK' | 'USE' | 'TAKE' | 'TALK' | 'PUSH' | 'PULL';

export interface HotspotAction {
  verb: InteractionVerb;
  response: string; // Text to display
  requiresItem?: string; // Inventory item ID needed
  onExecute?: () => void | Promise<void>; // Callback for side effects
  enabled?: () => boolean; // Condition to check if action is available
}

export interface HotspotConfig {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  actions: HotspotAction[];
  sprite?: string; // Optional sprite key for visible hotspot
  visible?: boolean; // Whether the hotspot is initially visible
  cursor?: string; // Custom cursor style
}

export class Hotspot extends Phaser.GameObjects.Zone {
  public readonly hotspotId: string;
  public readonly hotspotName: string;
  private actions: Map<InteractionVerb, HotspotAction> = new Map();
  private visualSprite?: Phaser.GameObjects.Sprite;
  private debugRect?: Phaser.GameObjects.Rectangle;
  private isEnabled: boolean = true;

  constructor(scene: Phaser.Scene, config: HotspotConfig) {
    super(scene, config.x, config.y, config.width, config.height);

    this.hotspotId = config.id;
    this.hotspotName = config.name;

    // Set up the zone for interaction
    this.setOrigin(0.5, 0.5);
    this.setInteractive({ useHandCursor: true });

    // Register actions
    for (const action of config.actions) {
      this.actions.set(action.verb, action);
    }

    // Optional visible sprite
    if (config.sprite) {
      this.visualSprite = scene.add.sprite(config.x, config.y, config.sprite);
      this.visualSprite.setVisible(config.visible ?? true);
    }

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Check if this hotspot supports a given verb
   */
  hasAction(verb: InteractionVerb): boolean {
    const action = this.actions.get(verb);
    if (!action) return false;
    if (action.enabled && !action.enabled()) return false;
    return true;
  }

  /**
   * Get the action for a verb (if available)
   */
  getAction(verb: InteractionVerb): HotspotAction | undefined {
    const action = this.actions.get(verb);
    if (!action) return undefined;
    if (action.enabled && !action.enabled()) return undefined;
    return action;
  }

  /**
   * Get all available verbs for this hotspot
   */
  getAvailableVerbs(): InteractionVerb[] {
    const verbs: InteractionVerb[] = [];
    for (const [verb, action] of this.actions) {
      if (!action.enabled || action.enabled()) {
        verbs.push(verb);
      }
    }
    return verbs;
  }

  /**
   * Execute an action with a given verb
   */
  async executeAction(verb: InteractionVerb, heldItemId?: string): Promise<string> {
    const action = this.getAction(verb);

    if (!action) {
      return `You can't ${verb.toLowerCase()} that.`;
    }

    // Check if action requires an item
    if (action.requiresItem && action.requiresItem !== heldItemId) {
      return `You need something else to do that.`;
    }

    // Execute callback if present
    if (action.onExecute) {
      await action.onExecute();
    }

    return action.response;
  }

  /**
   * Enable/disable the hotspot
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (this.visualSprite) {
      this.visualSprite.setVisible(enabled);
    }
    this.setActive(enabled);
  }

  /**
   * Check if hotspot is enabled
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Show debug visualization
   */
  showDebug(show: boolean = true): void {
    if (show && !this.debugRect) {
      this.debugRect = this.scene.add.rectangle(
        this.x,
        this.y,
        this.width,
        this.height,
        0xff0000,
        0.3
      );
      this.debugRect.setStrokeStyle(2, 0xff0000);
    } else if (!show && this.debugRect) {
      this.debugRect.destroy();
      this.debugRect = undefined;
    }
  }

  /**
   * Update visual sprite position (if sprite moves)
   */
  updateSpritePosition(x: number, y: number): void {
    this.setPosition(x, y);
    if (this.visualSprite) {
      this.visualSprite.setPosition(x, y);
    }
    if (this.debugRect) {
      this.debugRect.setPosition(x, y);
    }
  }

  /**
   * Clean up resources
   */
  destroy(fromScene?: boolean): void {
    if (this.visualSprite) {
      this.visualSprite.destroy();
    }
    if (this.debugRect) {
      this.debugRect.destroy();
    }
    super.destroy(fromScene);
  }
}
