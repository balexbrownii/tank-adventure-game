import Phaser from 'phaser';
import { HotspotManager } from '../managers/HotspotManager';
import { MessageBox } from '../ui/MessageBox';
import { InventoryPanel } from '../ui/InventoryPanel';
import { gameState } from '../managers/GameStateManager';
import { HotspotConfig, InteractionVerb } from '../entities/Hotspot';
import { audioManager } from '../managers/AudioManager';
import { responseGenerator } from '../services/ResponseGenerator';

export class BrazilVillageScene extends Phaser.Scene {
  // Characters
  private tarzan!: Phaser.GameObjects.Image;
  private pig!: Phaser.GameObjects.Image;
  private deer!: Phaser.GameObjects.Image;

  // Systems
  private hotspotManager!: HotspotManager;
  private messageBox!: MessageBox;
  private inventoryPanel!: InventoryPanel;

  // Movement
  private cursors!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private moveSpeed: number = 200;

  // Equipped item display
  private heldItemSprite: Phaser.GameObjects.Sprite | null = null;

  // Fire effect
  private fireEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  // Trader NPC
  private trader: Phaser.GameObjects.Container | null = null;
  // Tracks if player approached trader this visit (resets each scene entry)
  private traderApproached: boolean = false;

  constructor() {
    super({ key: 'BrazilVillageScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Reset scene-local state on each entry
    this.traderApproached = false;

    // Check if first visit
    const isFirstVisit = !gameState.hasVisitedRoom('brazil-village');

    // Set current room
    gameState.setCurrentRoom('brazil-village');

    // Background - full height now (no verb bar)
    const bg = this.add.image(width / 2, height / 2, 'brazil-village');
    bg.setDisplaySize(width, height);

    // Create fire particle effect
    this.createFireEffect(640, height / 2 + 60);

    // Create animated trader NPC
    this.createTrader(280, height / 2 + 100);

    // Initialize systems
    this.hotspotManager = new HotspotManager(this);
    this.messageBox = new MessageBox(this);
    this.inventoryPanel = new InventoryPanel(this, height);

    // Characters - positioned in the village clearing
    const characterScale = 0.30;
    const groundY = height - 60;

    // Tarzan (main character, center-right)
    this.tarzan = this.add.image(width / 2 + 100, groundY, 'tarzan');
    this.tarzan.setScale(characterScale);
    this.tarzan.setOrigin(0.5, 1);

    // Pig (right of Tarzan)
    this.pig = this.add.image(width / 2 + 280, groundY, 'pig');
    this.pig.setScale(characterScale * 0.75);
    this.pig.setOrigin(0.5, 1);

    // Mr. Snuggles the deer (behind Tarzan)
    this.deer = this.add.image(width / 2 + 180, groundY - 20, 'deer');
    this.deer.setScale(characterScale * 0.85);
    this.deer.setOrigin(0.5, 1);

    // Subscribe to inventory selection to show equipped item in hand
    this.inventoryPanel.onSelect((item) => {
      this.updateHeldItem(item?.icon ?? null);
    });

    // Register hotspots
    this.registerHotspots(height);

    // Handle clicks on the game area
    // Left-click = primary action (USE/TAKE), Right-click = LOOK
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleInteraction(pointer);
    });

    // Scene title
    this.add.text(width / 2, 15, 'Indigenous Village', {
      font: 'bold 28px serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0);

    // WASD movement keys
    if (this.input.keyboard) {
      this.cursors = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    // Debug mode toggle (press `)
    this.input.keyboard?.on('keydown-BACKTICK', () => {
      const currentDebug = this.hotspotManager.getDebugMode();
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
          "Tarzan and his companions arrive at a peaceful indigenous village. A friendly trader waves them over to her table of goods.",
          5000
        );
      });
    }
  }

  private registerHotspots(height: number): void {
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
        y: height / 2 + 50,
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
            response: '"Ah, what a magnificent flower! I will trade you this fine bow and arrows for it. May it protect you on your journey!"',
            requiresItem: 'flower',
            onExecute: () => {
              // Remove flower from inventory
              gameState.removeItem('flower');
              // Add bow and arrows to inventory
              gameState.addItem({
                id: 'bow',
                name: 'Bow & Arrows',
                description: 'A handcrafted bow with a quiver of arrows. Perfect for hunting or defense.',
                icon: 'bow',
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
        y: height / 2 + 120,
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
        y: height / 2 + 30,
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
        y: height / 2 - 100,
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
        y: height / 2 + 50,
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
    const heldItemId = this.inventoryPanel.getSelectedItemId();

    // Determine verb based on click type
    // Right-click (button 2) = LOOK, Left-click (button 0) = USE/TAKE/TALK
    let verb: InteractionVerb = 'USE';
    if (pointer.button === 2) {
      verb = 'LOOK';
    } else if (hotspot) {
      // Smart verb selection for left-click: prioritize USE, then TAKE, then TALK
      const availableVerbs = hotspot.getAvailableVerbs(heldItemId ?? undefined);
      if (availableVerbs.includes('USE')) {
        verb = 'USE';
      } else if (availableVerbs.includes('TAKE')) {
        verb = 'TAKE';
      } else if (availableVerbs.includes('TALK')) {
        verb = 'TALK';
      }
    }

    if (hotspot) {
      const response = await this.hotspotManager.interact(verb, heldItemId ?? undefined);
      if (response) {
        this.messageBox.show(response);
        if (heldItemId && !gameState.hasItem(heldItemId)) {
          this.inventoryPanel.clearSelection();
        }
      }
    } else if (pointer.button === 0) {
      // Left-click on empty space - move Tarzan there
      const targetX = Phaser.Math.Clamp(pointer.x, 50, this.cameras.main.width - 50);

      if (targetX < this.tarzan.x) {
        this.tarzan.setFlipX(true);
      } else {
        this.tarzan.setFlipX(false);
      }

      this.tweens.add({
        targets: this.tarzan,
        x: targetX,
        duration: Math.abs(targetX - this.tarzan.x) * 3,
        ease: 'Linear',
      });
    }
  }

  /**
   * Create animated trader NPC
   */
  private createTrader(x: number, y: number): void {
    this.trader = this.add.container(x, y);

    // Create trader body using simple shapes (placeholder - could be replaced with sprite)
    // Body (dress/robe)
    const body = this.add.ellipse(0, 0, 40, 60, 0x8B4513);
    body.setOrigin(0.5, 1);

    // Head
    const head = this.add.circle(0, -65, 15, 0xD2691E);

    // Arms (will animate)
    const leftArm = this.add.rectangle(-25, -35, 8, 30, 0xD2691E);
    leftArm.setOrigin(0.5, 0);
    const rightArm = this.add.rectangle(25, -35, 8, 30, 0xD2691E);
    rightArm.setOrigin(0.5, 0);

    // Add name label
    const label = this.add.text(0, -90, 'Trader', {
      font: 'bold 12px serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    label.setOrigin(0.5, 0.5);

    this.trader.add([body, head, leftArm, rightArm, label]);
    this.trader.setDepth(80);

    // Idle animation - subtle swaying
    this.tweens.add({
      targets: this.trader,
      x: x - 3,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Arm gesture animation
    this.tweens.add({
      targets: rightArm,
      angle: -15,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 500,
    });

    this.tweens.add({
      targets: leftArm,
      angle: 10,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Check if player is near the trader and trigger dialogue
   */
  private checkTraderProximity(): void {
    if (!this.trader || this.traderApproached) return;

    const distance = Phaser.Math.Distance.Between(
      this.tarzan.x, this.tarzan.y,
      this.trader.x, this.trader.y
    );

    if (distance < 150) {
      this.traderApproached = true;
      this.messageBox.show(
        'Trader: "Welcome, traveler! I have fine goods to trade. Do you have anything interesting from the jungle?"',
        5000
      );
    }
  }

  /**
   * Create animated fire particle effect
   */
  private createFireEffect(x: number, y: number): void {
    // Create a simple fire particle texture procedurally
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffff00);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('fire-particle', 16, 16);
    graphics.destroy();

    // Create particle emitter for fire
    this.fireEmitter = this.add.particles(x, y, 'fire-particle', {
      speed: { min: 20, max: 60 },
      angle: { min: -110, max: -70 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 400, max: 800 },
      frequency: 50,
      tint: [0xff4400, 0xff8800, 0xffcc00, 0xff2200],
      blendMode: Phaser.BlendModes.ADD,
    });
    this.fireEmitter.setDepth(50);

    // Add ambient glow effect under the fire
    const glow = this.add.circle(x, y + 10, 60, 0xff6600, 0.15);
    glow.setDepth(49);

    // Animate the glow
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.2 },
      scale: { from: 0.9, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Update the held item sprite based on selected inventory item
   */
  private updateHeldItem(iconKey: string | null): void {
    // Remove existing held item sprite
    if (this.heldItemSprite) {
      this.heldItemSprite.destroy();
      this.heldItemSprite = null;
    }

    // Create new sprite if item selected
    if (iconKey && this.textures.exists(iconKey)) {
      this.heldItemSprite = this.add.sprite(0, 0, iconKey);
      this.heldItemSprite.setScale(0.5);
      this.heldItemSprite.setDepth(150); // Above characters
    }
  }

  /**
   * Update held item position to follow Tarzan's hand
   */
  private updateHeldItemPosition(): void {
    if (this.heldItemSprite && this.tarzan) {
      // Position item near Tarzan's hand (offset based on facing direction)
      const handOffsetX = this.tarzan.flipX ? -25 : 25;
      const handOffsetY = -40;
      this.heldItemSprite.setPosition(
        this.tarzan.x + handOffsetX,
        this.tarzan.y + handOffsetY
      );
      // Flip item to match character direction
      this.heldItemSprite.setFlipX(this.tarzan.flipX);
    }
  }

  update(_time: number, delta: number): void {
    // WASD movement
    if (this.cursors) {
      const speed = this.moveSpeed * (delta / 1000);

      if (this.cursors.A.isDown) {
        this.tarzan.x -= speed;
        this.tarzan.setFlipX(true);
      } else if (this.cursors.D.isDown) {
        this.tarzan.x += speed;
        this.tarzan.setFlipX(false);
      }

      if (this.cursors.W.isDown) {
        this.tarzan.y -= speed;
      } else if (this.cursors.S.isDown) {
        this.tarzan.y += speed;
      }

      // Clamp to scene boundaries
      const minX = 50;
      const maxX = this.cameras.main.width - 50;
      const minY = 200; // Upper boundary
      const maxY = this.cameras.main.height - 60; // Ground level
      this.tarzan.x = Phaser.Math.Clamp(this.tarzan.x, minX, maxX);
      this.tarzan.y = Phaser.Math.Clamp(this.tarzan.y, minY, maxY);
    }

    // Update held item position
    this.updateHeldItemPosition();

    // Check trader proximity for automatic dialogue
    this.checkTraderProximity();

    // Update character depth sorting
    const characters = [this.tarzan, this.pig, this.deer];
    characters.sort((a, b) => a.y - b.y);
    characters.forEach((char, index) => {
      char.setDepth(100 + index);
    });
  }
}
