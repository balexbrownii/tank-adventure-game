import Phaser from 'phaser';
import { InventoryItem, gameState } from '../managers/GameStateManager';

const INVENTORY_SLOT_SIZE = 50;
const INVENTORY_PADDING = 4;
const INVENTORY_MARGIN = 6;
const MAX_VISIBLE_SLOTS = 6;

/**
 * InventoryPanel - Compact inventory display in the verb bar area
 * Positioned at bottom-right, within the UI zone
 */
export class InventoryPanel extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private slots: Phaser.GameObjects.Container[] = [];
  private selectedItemId: string | null = null;
  private itemLabel: Phaser.GameObjects.Text;

  // Callbacks
  private onItemSelect: ((item: InventoryItem | null) => void)[] = [];

  constructor(scene: Phaser.Scene, verbBarY: number) {
    const gameWidth = scene.cameras.main.width;
    const panelWidth = MAX_VISIBLE_SLOTS * (INVENTORY_SLOT_SIZE + INVENTORY_PADDING) + INVENTORY_MARGIN * 2;
    const panelHeight = INVENTORY_SLOT_SIZE + INVENTORY_MARGIN * 2;

    // Position at bottom-right, ABOVE the verb bar (not overlapping)
    super(scene, gameWidth - panelWidth - 10, verbBarY - panelHeight - 10);

    // Background
    this.background = scene.add.rectangle(
      panelWidth / 2,
      panelHeight / 2,
      panelWidth,
      panelHeight,
      0x1a1a2e,
      0.95
    );
    this.background.setStrokeStyle(2, 0x4a4a6a);
    this.add(this.background);

    // Label (small, top-left corner)
    this.itemLabel = scene.add.text(
      INVENTORY_MARGIN,
      2,
      'Inventory',
      {
        font: '10px monospace',
        color: '#888888',
      }
    );
    this.itemLabel.setOrigin(0, 0);
    this.add(this.itemLabel);

    // Create slots in a horizontal row
    for (let i = 0; i < MAX_VISIBLE_SLOTS; i++) {
      const slotX = INVENTORY_MARGIN + i * (INVENTORY_SLOT_SIZE + INVENTORY_PADDING) + INVENTORY_SLOT_SIZE / 2;
      const slotY = INVENTORY_MARGIN + INVENTORY_SLOT_SIZE / 2;
      const slot = this.createSlot(slotX, slotY, i);
      this.slots.push(slot);
      this.add(slot);
    }

    // Subscribe to inventory changes
    gameState.onInventoryChanged(() => this.refresh());

    // Initial refresh
    this.refresh();

    scene.add.existing(this);
    this.setDepth(1000);
  }

  private createSlot(x: number, y: number, index: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Slot background
    const bg = this.scene.add.rectangle(0, 0, INVENTORY_SLOT_SIZE, INVENTORY_SLOT_SIZE, 0x333355);
    bg.setStrokeStyle(1, 0x4a4a6a);
    bg.setInteractive({ useHandCursor: true });

    container.add(bg);
    container.setData('bg', bg);
    container.setData('index', index);
    container.setData('itemId', null);

    // Click handler
    bg.on('pointerdown', () => {
      const itemId = container.getData('itemId') as string | null;
      if (itemId) {
        this.selectItem(itemId);
      }
    });

    // Hover effects
    bg.on('pointerover', () => {
      const itemId = container.getData('itemId') as string | null;
      if (itemId) {
        bg.setFillStyle(0x444466);
        const item = gameState.getItem(itemId);
        if (item) {
          this.itemLabel.setText(item.name);
        }
      }
    });

    bg.on('pointerout', () => {
      const itemId = container.getData('itemId') as string | null;
      if (itemId === this.selectedItemId) {
        bg.setFillStyle(0x5555aa);
      } else {
        bg.setFillStyle(0x333355);
      }
      this.itemLabel.setText(this.selectedItemId ? `Selected: ${gameState.getItem(this.selectedItemId)?.name}` : 'Inventory');
    });

    return container;
  }

  /**
   * Refresh inventory display from game state
   */
  refresh(): void {
    const items = gameState.getInventory();

    for (let i = 0; i < MAX_VISIBLE_SLOTS; i++) {
      const slot = this.slots[i];
      const bg = slot.getData('bg') as Phaser.GameObjects.Rectangle;

      // Remove existing icon if present
      const existingIcon = slot.getData('icon') as Phaser.GameObjects.Sprite | undefined;
      if (existingIcon) {
        existingIcon.destroy();
        slot.setData('icon', null);
      }

      if (i < items.length) {
        const item = items[i];
        slot.setData('itemId', item.id);

        // Add item icon (using text placeholder if sprite not available)
        if (this.scene.textures.exists(item.icon)) {
          const icon = this.scene.add.sprite(0, 0, item.icon);
          icon.setDisplaySize(INVENTORY_SLOT_SIZE - 8, INVENTORY_SLOT_SIZE - 8);
          slot.add(icon);
          slot.setData('icon', icon);
        } else {
          // Text placeholder
          const text = this.scene.add.text(0, 0, item.name.substring(0, 2).toUpperCase(), {
            font: 'bold 16px monospace',
            color: '#ffffff',
          });
          text.setOrigin(0.5, 0.5);
          slot.add(text);
          slot.setData('icon', text);
        }

        // Update highlight
        if (item.id === this.selectedItemId) {
          bg.setFillStyle(0x5555aa);
          bg.setStrokeStyle(2, 0x7777cc);
        } else {
          bg.setFillStyle(0x333355);
          bg.setStrokeStyle(1, 0x4a4a6a);
        }
      } else {
        slot.setData('itemId', null);
        bg.setFillStyle(0x222244);
        bg.setStrokeStyle(1, 0x3a3a5a);
      }
    }

    // Update label
    if (this.selectedItemId) {
      const item = gameState.getItem(this.selectedItemId);
      if (item) {
        this.itemLabel.setText(`Selected: ${item.name}`);
      } else {
        // Item was removed from inventory
        this.selectedItemId = null;
        this.itemLabel.setText('Inventory');
      }
    }
  }

  /**
   * Select an item from inventory
   */
  selectItem(itemId: string): void {
    if (this.selectedItemId === itemId) {
      // Deselect
      this.selectedItemId = null;
      this.itemLabel.setText('Inventory');
    } else {
      this.selectedItemId = itemId;
      const item = gameState.getItem(itemId);
      if (item) {
        this.itemLabel.setText(`Selected: ${item.name}`);
      }
    }

    this.refresh();

    // Notify listeners
    const item = this.selectedItemId ? gameState.getItem(this.selectedItemId) ?? null : null;
    this.onItemSelect.forEach(cb => cb(item));
  }

  /**
   * Get the currently selected item ID
   */
  getSelectedItemId(): string | null {
    return this.selectedItemId;
  }

  /**
   * Get the currently selected item
   */
  getSelectedItem(): InventoryItem | null {
    if (!this.selectedItemId) return null;
    return gameState.getItem(this.selectedItemId) ?? null;
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedItemId = null;
    this.itemLabel.setText('Inventory');
    this.refresh();
    this.onItemSelect.forEach(cb => cb(null));
  }

  /**
   * Subscribe to item selection events
   */
  onSelect(callback: (item: InventoryItem | null) => void): void {
    this.onItemSelect.push(callback);
  }

  /**
   * Clean up
   */
  destroy(fromScene?: boolean): void {
    this.onItemSelect = [];
    super.destroy(fromScene);
  }
}
