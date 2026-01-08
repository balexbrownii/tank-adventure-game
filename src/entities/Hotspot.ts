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
  debugColor?: number; // Color for debug rectangle
}

export class Hotspot extends Phaser.GameObjects.Zone {
  public readonly hotspotId: string;
  public readonly hotspotName: string;
  // Changed from Map to Array to support multiple actions per verb with different conditions
  private actions: HotspotAction[] = [];
  private visualSprite?: Phaser.GameObjects.Sprite;
  private debugRect?: Phaser.GameObjects.Rectangle;
  private isEnabled: boolean = true;
  private debugColor: number;

  constructor(scene: Phaser.Scene, config: HotspotConfig) {
    super(scene, config.x, config.y, config.width, config.height);

    this.hotspotId = config.id;
    this.hotspotName = config.name;
    this.debugColor = config.debugColor ?? 0x00ff00;

    // Set up the zone for interaction
    this.setOrigin(0.5, 0.5);
    this.setInteractive({ useHandCursor: true });

    // Store all actions (not in a Map - supports multiple per verb)
    this.actions = [...config.actions];

    // Optional visible sprite
    if (config.sprite) {
      this.visualSprite = scene.add.sprite(config.x, config.y, config.sprite);
      this.visualSprite.setVisible(config.visible ?? true);
    }

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Find the first matching action for a verb (checking enabled conditions)
   */
  private findAction(verb: InteractionVerb, heldItemId?: string): HotspotAction | undefined {
    // First, try to find an action that matches the verb AND the held item (if any)
    if (heldItemId) {
      const itemAction = this.actions.find(action => {
        if (action.verb !== verb) return false;
        if (action.requiresItem !== heldItemId) return false;
        if (action.enabled && !action.enabled()) return false;
        return true;
      });
      if (itemAction) return itemAction;
    }

    // Then find any action for this verb that doesn't require an item
    return this.actions.find(action => {
      if (action.verb !== verb) return false;
      if (action.enabled && !action.enabled()) return false;
      // If this action requires a specific item and we don't have it, skip
      if (action.requiresItem && action.requiresItem !== heldItemId) return false;
      return true;
    });
  }

  /**
   * Check if this hotspot supports a given verb
   */
  hasAction(verb: InteractionVerb, heldItemId?: string): boolean {
    return this.findAction(verb, heldItemId) !== undefined;
  }

  /**
   * Get the action for a verb (if available)
   */
  getAction(verb: InteractionVerb, heldItemId?: string): HotspotAction | undefined {
    return this.findAction(verb, heldItemId);
  }

  /**
   * Get all available verbs for this hotspot
   */
  getAvailableVerbs(_heldItemId?: string): InteractionVerb[] {
    const verbs = new Set<InteractionVerb>();
    for (const action of this.actions) {
      if (action.enabled && !action.enabled()) continue;
      // If action requires item and we don't have it, still show the verb
      // (we'll give feedback when they try to use it)
      verbs.add(action.verb);
    }
    return Array.from(verbs);
  }

  /**
   * Execute an action with a given verb
   */
  async executeAction(verb: InteractionVerb, heldItemId?: string): Promise<string> {
    // First check if there's ANY action for this verb
    const anyAction = this.actions.find(a => a.verb === verb && (!a.enabled || a.enabled()));

    if (!anyAction) {
      return `You can't ${verb.toLowerCase()} that.`;
    }

    // Now check if we have the right item for actions that require one
    const matchingAction = this.findAction(verb, heldItemId);

    if (!matchingAction) {
      // There's an action but we don't have the required item
      const itemAction = this.actions.find(a =>
        a.verb === verb &&
        a.requiresItem &&
        (!a.enabled || a.enabled())
      );
      if (itemAction) {
        return itemAction.response; // Show the "you need something" message
      }
      return `You can't ${verb.toLowerCase()} that.`;
    }

    // Execute callback if present
    if (matchingAction.onExecute) {
      await matchingAction.onExecute();
    }

    return matchingAction.response;
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

    // Disable interaction when disabled
    if (enabled) {
      this.setInteractive({ useHandCursor: true });
    } else {
      this.disableInteractive();
    }
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
        this.debugColor,
        0.3
      );
      this.debugRect.setStrokeStyle(2, this.debugColor);
      this.debugRect.setDepth(999);

      // Add label
      const label = this.scene.add.text(this.x, this.y - this.height/2 - 10, this.hotspotName, {
        font: '10px monospace',
        color: '#ffffff',
        backgroundColor: '#000000',
      });
      label.setOrigin(0.5, 1);
      label.setDepth(999);
      this.debugRect.setData('label', label);
    } else if (!show && this.debugRect) {
      const label = this.debugRect.getData('label') as Phaser.GameObjects.Text;
      if (label) label.destroy();
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
      const label = this.debugRect.getData('label') as Phaser.GameObjects.Text;
      if (label) label.destroy();
      this.debugRect.destroy();
    }
    super.destroy(fromScene);
  }
}
