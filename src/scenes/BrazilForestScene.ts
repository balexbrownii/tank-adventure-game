import Phaser from 'phaser';
import { HotspotManager } from '../managers/HotspotManager';
import { VerbBar, VERB_BAR_HEIGHT } from '../ui/VerbBar';
import { MessageBox } from '../ui/MessageBox';
import { InventoryPanel } from '../ui/InventoryPanel';
import { gameState } from '../managers/GameStateManager';
import { HotspotConfig } from '../entities/Hotspot';

export class BrazilForestScene extends Phaser.Scene {
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
    super({ key: 'BrazilForestScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const playableHeight = height - VERB_BAR_HEIGHT;

    // Check if first visit BEFORE setting current room (which marks it visited)
    const isFirstVisit = !gameState.hasVisitedRoom('brazil-forest');

    // Set current room
    gameState.setCurrentRoom('brazil-forest');

    // Background
    const bg = this.add.image(width / 2, playableHeight / 2, 'brazil-forest');
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

    // Characters - scaled down to fit the scene
    const characterScale = 0.30;
    const groundY = playableHeight - 60;

    // Tank (main character, center)
    this.tank = this.add.image(width / 2, groundY, 'tank');
    this.tank.setScale(characterScale);
    this.tank.setOrigin(0.5, 1);

    // Pig (left of Tank)
    this.pig = this.add.image(width / 2 - 200, groundY, 'pig');
    this.pig.setScale(characterScale * 0.75);
    this.pig.setOrigin(0.5, 1);

    // Mr. Snuggles the deer (right of Tank)
    this.deer = this.add.image(width / 2 + 200, groundY, 'deer');
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
      // Only handle clicks in the playable area (not verb bar)
      if (pointer.y > playableHeight) return;

      this.handleInteraction(pointer);
    });

    // Scene title (temporary - can be removed later)
    this.add.text(width / 2, 15, 'Brazilian Rainforest', {
      font: 'bold 28px serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    // Debug mode toggle (press D)
    this.input.keyboard?.on('keydown-D', () => {
      const currentDebug = this.hotspotManager['debugMode'];
      this.hotspotManager.setDebugMode(!currentDebug);
      this.messageBox.show(currentDebug ? 'Debug mode OFF' : 'Debug mode ON', 1500);
    });

    // Show intro message if first visit
    if (isFirstVisit) {
      this.time.delayedCall(500, () => {
        this.messageBox.show(
          "Tank finds herself in a lush Brazilian rainforest. Her companions Pig and Mr. Snuggles look around nervously.",
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
            response: "That's Pig, your loyal companion. He's wearing his favorite cowboy hat.",
          },
          {
            verb: 'TALK',
            response: '"Howdy partner! Sure is humid in this here jungle. We should find a way through them vines yonder."',
          },
          {
            verb: 'USE',
            response: "You can't use Pig like that!",
          },
          {
            verb: 'TAKE',
            response: "Pig is your friend, not an item!",
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
            response: "Mr. Snuggles looks at you with his big, goofy eyes. His antlers are a bit crooked.",
          },
          {
            verb: 'TALK',
            response: 'Mr. Snuggles tilts his head and makes a friendly snorting sound. He seems happy!',
          },
          {
            verb: 'USE',
            response: "Mr. Snuggles doesn't understand what you want him to do.",
          },
          {
            verb: 'TAKE',
            response: "Mr. Snuggles is too big to carry, and he's your friend!",
          },
        ],
      },
      // Jungle vines (blocking path) - RIGHT SIDE of scene
      {
        id: 'vines',
        name: 'thick vines',
        x: 1050,
        y: playableHeight / 2,
        width: 200,
        height: 350,
        actions: [
          {
            verb: 'LOOK',
            response: "Thick jungle vines block the path ahead. They're too tough to push through.",
          },
          {
            verb: 'USE',
            response: "You hack through the vines with the machete! The path ahead is now clear.",
            requiresItem: 'machete',
            onExecute: () => {
              gameState.setFlag('vines_cut', true);
              this.hotspotManager.setEnabled('vines', false);
            },
          },
          {
            verb: 'USE',
            response: "You need something sharp to cut through these vines.",
          },
          {
            verb: 'PUSH',
            response: "The vines are too thick and tangled. You can't push through them.",
          },
          {
            verb: 'PULL',
            response: "You tug at the vines, but they won't budge.",
          },
          {
            verb: 'TAKE',
            response: "The vines are rooted deep into the ground.",
          },
        ],
      },
      // Exotic flower - LEFT SIDE of scene
      {
        id: 'flower',
        name: 'exotic flower',
        x: 200,
        y: playableHeight / 2 + 50,
        width: 150,
        height: 200,
        actions: [
          {
            verb: 'LOOK',
            response: "A beautiful exotic flower with bright red petals. It smells amazing!",
          },
          {
            verb: 'TAKE',
            response: "You pick the exotic flower. It might be useful later!",
            onExecute: () => {
              gameState.addItem({
                id: 'flower',
                name: 'Exotic Flower',
                description: 'A beautiful red flower from the Brazilian rainforest.',
                icon: 'flower',
              });
              this.hotspotManager.setEnabled('flower', false);
            },
            enabled: () => !gameState.hasItem('flower'),
          },
          {
            verb: 'USE',
            response: "You sniff the flower. It smells wonderful!",
          },
        ],
      },
      // Old tree stump - CENTER-RIGHT FOREGROUND of scene
      {
        id: 'stump',
        name: 'tree stump',
        x: 750,
        y: playableHeight - 150,
        width: 180,
        height: 180,
        actions: [
          {
            verb: 'LOOK',
            response: "An old tree stump. There seems to be something shiny stuck in it...",
            enabled: () => !gameState.hasItem('machete'),
          },
          {
            verb: 'LOOK',
            response: "Just an old tree stump now.",
            enabled: () => gameState.hasItem('machete'),
          },
          {
            verb: 'TAKE',
            response: "You pull out an old machete from the stump! This could be useful.",
            onExecute: () => {
              gameState.addItem({
                id: 'machete',
                name: 'Machete',
                description: 'A rusty but sharp machete.',
                icon: 'machete',
              });
            },
            enabled: () => !gameState.hasItem('machete'),
          },
          {
            verb: 'USE',
            response: "It's just a stump.",
          },
        ],
      },
      // Path to village (exit) - same area as vines, becomes accessible after cutting
      {
        id: 'path-village',
        name: 'path to village',
        x: 1050,
        y: playableHeight / 2 + 100,
        width: 180,
        height: 200,
        actions: [
          {
            verb: 'LOOK',
            response: "A narrow path leads through the jungle. You can see smoke from a village in the distance.",
            enabled: () => gameState.getFlag('vines_cut'),
          },
          {
            verb: 'LOOK',
            response: "Thick vines block the path. You'll need to clear them first.",
            enabled: () => !gameState.getFlag('vines_cut'),
          },
          {
            verb: 'USE',
            response: "You head down the path toward the village...",
            onExecute: () => {
              this.messageBox.show('You walk down the path toward the village...', 2000);
              // TODO: Transition to village scene
              // this.scene.start('BrazilVillageScene');
            },
            enabled: () => gameState.getFlag('vines_cut'),
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
      // Interact with hotspot, passing the held item
      const response = await this.hotspotManager.interact(verb, heldItemId ?? undefined);
      if (response) {
        this.messageBox.show(response);
        // Clear item selection after successful use (if item was consumed)
        if (heldItemId && !gameState.hasItem(heldItemId)) {
          this.inventoryPanel.clearSelection();
        }
      }
    } else {
      // Click on empty space - move Tank there
      const targetX = Phaser.Math.Clamp(pointer.x, 50, this.cameras.main.width - 50);

      // Flip sprite based on direction
      if (targetX < this.tank.x) {
        this.tank.setFlipX(true);
      } else {
        this.tank.setFlipX(false);
      }

      // Move Tank
      this.tweens.add({
        targets: this.tank,
        x: targetX,
        duration: Math.abs(targetX - this.tank.x) * 3,
        ease: 'Linear',
      });
    }
  }

  update(): void {
    // Update character depth sorting (characters lower on screen appear in front)
    const characters = [this.tank, this.pig, this.deer];
    characters.sort((a, b) => a.y - b.y);
    characters.forEach((char, index) => {
      char.setDepth(100 + index);
    });
  }
}
