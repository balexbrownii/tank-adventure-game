import Phaser from 'phaser';
import { HotspotManager } from '../managers/HotspotManager';
import { VerbBar, VERB_BAR_HEIGHT } from '../ui/VerbBar';
import { MessageBox } from '../ui/MessageBox';
import { InventoryPanel } from '../ui/InventoryPanel';
import { gameState } from '../managers/GameStateManager';
import { HotspotConfig } from '../entities/Hotspot';
import { audioManager } from '../managers/AudioManager';
import { responseGenerator } from '../services/ResponseGenerator';

export class BrazilVillageScene extends Phaser.Scene {
  // Characters
  private tank!: Phaser.GameObjects.Image;
  private pig!: Phaser.GameObjects.Image;
  private deer!: Phaser.GameObjects.Image;

  // Systems
  private hotspotManager!: HotspotManager;
  private verbBar!: VerbBar;
  private messageBox!: MessageBox;
  private inventoryPanel!: InventoryPanel;

  constructor() {
    super({ key: 'BrazilVillageScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const playableHeight = height - VERB_BAR_HEIGHT;

    // Check if first visit
    const isFirstVisit = !gameState.hasVisitedRoom('brazil-village');

    // Set current room
    gameState.setCurrentRoom('brazil-village');

    // Background
    const bg = this.add.image(width / 2, playableHeight / 2, 'brazil-village');
    bg.setDisplaySize(width, playableHeight);

    // Initialize systems
    this.hotspotManager = new HotspotManager(this);
    this.verbBar = new VerbBar(this);
    this.messageBox = new MessageBox(this);
    this.inventoryPanel = new InventoryPanel(this, height - VERB_BAR_HEIGHT);

    // Wire up inventory selection to verb bar
    this.inventoryPanel.onSelect((item) => {
      if (item) {
        this.verbBar.setHeldItem(item.name);
      } else {
        this.verbBar.clearHeldItem();
      }
    });

    // Characters - positioned in the village clearing
    const characterScale = 0.30;
    const groundY = playableHeight - 60;

    // Tank (main character, center-right)
    this.tank = this.add.image(width / 2 + 100, groundY, 'tank');
    this.tank.setScale(characterScale);
    this.tank.setOrigin(0.5, 1);

    // Pig (right of Tank)
    this.pig = this.add.image(width / 2 + 280, groundY, 'pig');
    this.pig.setScale(characterScale * 0.75);
    this.pig.setOrigin(0.5, 1);

    // Mr. Snuggles the deer (behind Tank)
    this.deer = this.add.image(width / 2 + 180, groundY - 20, 'deer');
    this.deer.setScale(characterScale * 0.85);
    this.deer.setOrigin(0.5, 1);

    // Register hotspots
    this.registerHotspots(playableHeight);

    // Hook up hotspot hover to verb bar
    this.hotspotManager.onHover((hotspot) => {
      if (hotspot) {
        this.verbBar.setTarget(hotspot.hotspotName);
      } else {
        this.verbBar.setTarget('');
      }
    });

    // Handle clicks on the game area
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > playableHeight) return;
      this.handleInteraction(pointer);
    });

    // Scene title
    this.add.text(width / 2, 15, 'Indigenous Village', {
      font: 'bold 28px serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-D', () => {
      const currentDebug = this.hotspotManager['debugMode'];
      this.hotspotManager.setDebugMode(!currentDebug);
      this.messageBox.show(currentDebug ? 'Debug mode OFF' : 'Debug mode ON', 1500);
    });

    this.input.keyboard?.on('keydown-M', async () => {
      await audioManager.toggleAmbient();
      this.messageBox.show(
        audioManager.getIsPlaying() ? 'Jungle ambience ON' : 'Jungle ambience OFF',
        1500
      );
    });

    this.input.keyboard?.on('keydown-H', () => {
      responseGenerator.setEnabled(!responseGenerator.isEnabled());
      this.messageBox.show(
        responseGenerator.isEnabled() ? 'Dynamic responses ON' : 'Dynamic responses OFF',
        1500
      );
    });

    // Show intro message if first visit
    if (isFirstVisit) {
      this.time.delayedCall(500, () => {
        this.messageBox.show(
          "Tank and her companions arrive at a peaceful indigenous village. A friendly trader waves them over to her table of goods.",
          5000
        );
      });
    }
  }

  private registerHotspots(playableHeight: number): void {
    const hotspots: HotspotConfig[] = [
      // Pig companion
      {
        id: 'pig',
        name: 'Pig',
        x: this.pig.x,
        y: this.pig.y - 80,
        width: 130,
        height: 190,
        actions: [
          {
            verb: 'LOOK',
            response: "Pig is eyeing the trader's wares with great interest.",
          },
          {
            verb: 'TALK',
            response: '"These folks seem mighty friendly! Maybe we can trade somethin\' with \'em."',
          },
        ],
      },
      // Mr. Snuggles companion
      {
        id: 'deer',
        name: 'Mr. Snuggles',
        x: this.deer.x,
        y: this.deer.y - 70,
        width: 130,
        height: 160,
        actions: [
          {
            verb: 'LOOK',
            response: "Mr. Snuggles is sniffing the air curiously. The village smells like wood smoke and cooking food.",
          },
          {
            verb: 'TALK',
            response: 'Mr. Snuggles makes a happy snorting sound. He seems comfortable here.',
          },
        ],
      },
      // The Trader NPC
      {
        id: 'trader',
        name: 'Village Trader',
        x: 280,
        y: playableHeight / 2 + 50,
        width: 150,
        height: 250,
        actions: [
          {
            verb: 'LOOK',
            response: "A friendly indigenous woman stands behind a table covered with handmade tools and crafts. She smiles warmly at you.",
          },
          {
            verb: 'TALK',
            response: '"Welcome, travelers! I trade fine tools for beautiful things from the jungle. Do you have anything special to trade?"',
            enabled: () => !gameState.getFlag('traded_flower'),
          },
          {
            verb: 'TALK',
            response: '"Thank you again for the beautiful flower! Safe travels, friends."',
            enabled: () => gameState.getFlag('traded_flower'),
          },
          {
            verb: 'USE',
            response: '"Ah, what a magnificent flower! I will trade you this strong rope for it. It will serve you well on your journey!"',
            requiresItem: 'flower',
            onExecute: () => {
              // Remove flower from inventory
              gameState.removeItem('flower');
              // Add rope to inventory
              gameState.addItem({
                id: 'rope',
                name: 'Strong Rope',
                description: 'A sturdy braided rope, perfect for climbing or tying things.',
                icon: 'rope',
              });
              // Mark trade as complete
              gameState.setFlag('traded_flower', true);
            },
            enabled: () => !gameState.getFlag('traded_flower'),
          },
          {
            verb: 'USE',
            response: '"I have nothing else to trade right now, but thank you for visiting!"',
            enabled: () => gameState.getFlag('traded_flower'),
          },
        ],
      },
      // Trading Table
      {
        id: 'trading-table',
        name: 'trading table',
        x: 200,
        y: playableHeight / 2 + 120,
        width: 200,
        height: 100,
        actions: [
          {
            verb: 'LOOK',
            response: "The table displays stone axes, woven baskets, colorful beads, wooden bowls, and coils of strong rope. Everything looks handmade with great skill.",
          },
          {
            verb: 'TAKE',
            response: "You can't just take things! You should talk to the trader about trading.",
          },
          {
            verb: 'USE',
            response: "You should talk to the trader if you want to make a trade.",
          },
        ],
      },
      // Fire pit
      {
        id: 'fire-pit',
        name: 'fire pit',
        x: 640,
        y: playableHeight / 2 + 30,
        width: 150,
        height: 120,
        actions: [
          {
            verb: 'LOOK',
            response: "A crackling fire warms the village center. Something delicious-smelling is cooking in a clay pot nearby.",
          },
          {
            verb: 'USE',
            response: "The fire is too hot to touch directly. Best to admire it from a safe distance.",
          },
          {
            verb: 'TAKE',
            response: "You can't exactly put a fire in your pocket.",
          },
        ],
      },
      // Huts
      {
        id: 'huts',
        name: 'village huts',
        x: 640,
        y: playableHeight / 2 - 100,
        width: 400,
        height: 150,
        actions: [
          {
            verb: 'LOOK',
            response: "Thatched-roof huts made of wood and palm leaves. Colorful woven blankets hang in the doorways. This is clearly someone's home.",
          },
          {
            verb: 'USE',
            response: "It would be rude to enter someone's home uninvited.",
          },
        ],
      },
      // Path back to forest
      {
        id: 'path-forest',
        name: 'jungle path',
        x: 1100,
        y: playableHeight / 2 + 50,
        width: 150,
        height: 300,
        actions: [
          {
            verb: 'LOOK',
            response: "A path leads back through the jungle to where you came from.",
          },
          {
            verb: 'USE',
            response: "You head back into the jungle...",
            onExecute: () => {
              this.cameras.main.fadeOut(500, 0, 0, 0);
              this.time.delayedCall(500, () => {
                this.scene.start('BrazilForestScene');
              });
            },
          },
        ],
      },
    ];

    this.hotspotManager.registerAll(hotspots);
  }

  private async handleInteraction(pointer: Phaser.Input.Pointer): Promise<void> {
    const hotspot = this.hotspotManager.getHovered();
    const verb = this.verbBar.getSelectedVerb();
    const heldItemId = this.inventoryPanel.getSelectedItemId();

    if (hotspot) {
      const response = await this.hotspotManager.interact(verb, heldItemId ?? undefined);
      if (response) {
        this.messageBox.show(response);
        if (heldItemId && !gameState.hasItem(heldItemId)) {
          this.inventoryPanel.clearSelection();
        }
      }
    } else {
      // Click on empty space - move Tank there
      const targetX = Phaser.Math.Clamp(pointer.x, 50, this.cameras.main.width - 50);

      if (targetX < this.tank.x) {
        this.tank.setFlipX(true);
      } else {
        this.tank.setFlipX(false);
      }

      this.tweens.add({
        targets: this.tank,
        x: targetX,
        duration: Math.abs(targetX - this.tank.x) * 3,
        ease: 'Linear',
      });
    }
  }

  update(): void {
    // Update character depth sorting
    const characters = [this.tank, this.pig, this.deer];
    characters.sort((a, b) => a.y - b.y);
    characters.forEach((char, index) => {
      char.setDepth(100 + index);
    });
  }
}
