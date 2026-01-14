import Phaser from 'phaser';
import { HotspotManager } from '../managers/HotspotManager';
import { MessageBox } from '../ui/MessageBox';
import { InventoryPanel } from '../ui/InventoryPanel';
import { gameState } from '../managers/GameStateManager';
import { HotspotConfig, InteractionVerb } from '../entities/Hotspot';
import { audioManager } from '../managers/AudioManager';
import { responseGenerator } from '../services/ResponseGenerator';

export class BrazilForestScene extends Phaser.Scene {
  // Characters (animated sprites)
  private hero!: Phaser.GameObjects.Sprite;
  private pig!: Phaser.GameObjects.Sprite;
  private deer!: Phaser.GameObjects.Sprite;
  private isMoving: boolean = false;

  // Interactive sprites
  private macheteSprite!: Phaser.GameObjects.Image;
  private stumpSprite!: Phaser.GameObjects.Image;
  private vinesSprite!: Phaser.GameObjects.Image;
  private flowerSprite!: Phaser.GameObjects.Image;

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

  constructor() {
    super({ key: 'BrazilForestScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Check if first visit BEFORE setting current room (which marks it visited)
    const isFirstVisit = !gameState.hasVisitedRoom('brazil-forest');

    // Set current room
    gameState.setCurrentRoom('brazil-forest');

    // Background - full height now (no verb bar)
    const bg = this.add.image(width / 2, height / 2, 'brazil-forest');
    bg.setDisplaySize(width, height);

    // Play forest exploration music (falls back to ambient if not available)
    audioManager.playMusic('forest');

    // Initialize systems
    this.hotspotManager = new HotspotManager(this);
    this.messageBox = new MessageBox(this);
    this.inventoryPanel = new InventoryPanel(this, height);

    // Characters - pixel art sprites, scaled up for visibility
    const characterScale = 4.0;  // 32px * 4 = 128px tall
    const groundY = height - 60;

    // Hero (main character, center)
    this.hero = this.add.sprite(width / 2, groundY, 'hero-idle');
    this.hero.setScale(characterScale);
    this.hero.setOrigin(0.5, 1);
    this.hero.play('hero-idle');

    // Dog companion (left of hero) - was "Pig"
    this.pig = this.add.sprite(width / 2 - 150, groundY, 'pig');
    this.pig.setScale(characterScale * 0.8);
    this.pig.setOrigin(0.5, 1);
    this.pig.play('pig-idle');

    // Ram companion (right of hero) - was "Mr. Snuggles"
    this.deer = this.add.sprite(width / 2 + 150, groundY, 'deer');
    this.deer.setScale(characterScale * 0.9);
    this.deer.setOrigin(0.5, 1);
    this.deer.play('deer-idle');

    // Subscribe to inventory selection to show equipped item in hand
    this.inventoryPanel.onSelect((item) => {
      this.updateHeldItem(item?.icon ?? null);
    });

    // Plain stump - DISABLED (wrong art style - AI digital painting vs pixel art)
    this.stumpSprite = this.add.image(750, height - 80, 'stump');
    this.stumpSprite.setVisible(false);

    // TODO: Replace these garbage AI sprites with proper pixel art
    // Disabled for now - objects have broken backgrounds

    // Machete in stump - DISABLED (bad sprite)
    this.macheteSprite = this.add.image(750, height - 80, 'machete-in-stump');
    this.macheteSprite.setVisible(false);

    // Thick vines - DISABLED (bad sprite)
    this.vinesSprite = this.add.image(1050, height / 2 + 50, 'vines');
    this.vinesSprite.setVisible(false);

    // Exotic flower - DISABLED (bad sprite)
    this.flowerSprite = this.add.image(200, height / 2 + 100, 'flower');
    this.flowerSprite.setVisible(false);

    // Register hotspots
    this.registerHotspots(height);

    // Handle clicks on the game area
    // Left-click = primary action (USE/TAKE), Right-click = LOOK
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleInteraction(pointer);
    });

    // Scene title (temporary - can be removed later)
    this.add.text(width / 2, 15, 'Brazilian Rainforest', {
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

    // Music toggle (press M)
    this.input.keyboard?.on('keydown-M', async () => {
      await audioManager.toggleAmbient();
      this.messageBox.show(
        audioManager.getIsPlaying() ? 'Jungle ambience ON' : 'Jungle ambience OFF',
        1500
      );
    });

    // Start ambient music on first click (requires user interaction for Web Audio)
    this.input.once('pointerdown', async () => {
      if (!audioManager.getIsPlaying()) {
        await audioManager.startAmbient();
      }
    });

    // Dynamic responses toggle (press H for Haiku)
    this.input.keyboard?.on('keydown-H', () => {
      responseGenerator.setEnabled(!responseGenerator.isEnabled());
      this.messageBox.show(
        responseGenerator.isEnabled() ? 'Dynamic responses ON (Haiku)' : 'Dynamic responses OFF (static)',
        1500
      );
    });

    // Show intro message if first visit
    if (isFirstVisit) {
      this.time.delayedCall(500, () => {
        this.messageBox.show(
          "You find yourself in a dense jungle. The air is thick with humidity and the sounds of exotic birds.",
          5000
        );
      });
    }
  }

  private registerHotspots(sceneHeight: number): void {
    const hotspots: HotspotConfig[] = [
      // Jungle vines (blocking path) - RIGHT SIDE of scene
      {
        id: 'vines',
        name: 'thick vines',
        x: 1050,
        y: sceneHeight / 2,
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
              // Hide the vines sprite to show the path is now clear
              this.vinesSprite.setVisible(false);
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
        y: sceneHeight / 2 + 50,
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
              // Hide the flower sprite when picked
              this.flowerSprite.setVisible(false);
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
        y: sceneHeight - 150,
        width: 180,
        height: 180,
        actions: [
          {
            verb: 'LOOK',
            response: "An old tree stump. There's a rusty machete stuck in the top!",
            enabled: () => !gameState.hasItem('machete'),
          },
          {
            verb: 'LOOK',
            response: "Just an old tree stump now. You already took the machete.",
            enabled: () => gameState.hasItem('machete'),
          },
          {
            verb: 'TAKE',
            response: "You pull the old machete from the stump! This could be useful.",
            onExecute: () => {
              gameState.addItem({
                id: 'machete',
                name: 'Machete',
                description: 'A rusty but sharp machete.',
                icon: 'machete',
              });
              // Hide the machete-in-stump sprite, show plain stump
              this.macheteSprite.setVisible(false);
              this.stumpSprite.setVisible(true);
            },
            enabled: () => !gameState.hasItem('machete'),
          },
          {
            verb: 'USE',
            response: "It's just an old stump now.",
            enabled: () => gameState.hasItem('machete'),
          },
        ],
      },
      // Path to village (exit) - same area as vines, becomes accessible after cutting
      {
        id: 'path-village',
        name: 'path to village',
        x: 1050,
        y: sceneHeight / 2 + 100,
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
              this.cameras.main.fadeOut(500, 0, 0, 0);
              this.time.delayedCall(500, () => {
                this.scene.start('BrazilVillageScene');
              });
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
    const heldItemId = this.inventoryPanel.getSelectedItemId();

    // Determine verb based on click type
    // Right-click (button 2) = LOOK, Left-click (button 0) = USE/TAKE/TALK
    let verb: InteractionVerb = 'USE';
    if (pointer.button === 2) {
      verb = 'LOOK';
    } else if (hotspot) {
      // Smart verb selection for left-click
      // Priority: TAKE (if available and no item held), USE (if item held), TALK
      const availableVerbs = hotspot.getAvailableVerbs(heldItemId ?? undefined);
      if (heldItemId && availableVerbs.includes('USE')) {
        // If holding an item, try to USE it
        verb = 'USE';
      } else if (availableVerbs.includes('TAKE')) {
        // Otherwise try to TAKE
        verb = 'TAKE';
      } else if (availableVerbs.includes('USE')) {
        // Fallback to USE without item
        verb = 'USE';
      } else if (availableVerbs.includes('TALK')) {
        verb = 'TALK';
      }
    }

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
    } else if (pointer.button === 0) {
      // Left-click on empty space - move Tarzan there
      const targetX = Phaser.Math.Clamp(pointer.x, 50, this.cameras.main.width - 50);

      // Flip sprite based on direction
      if (targetX < this.hero.x) {
        this.hero.setFlipX(true);
      } else {
        this.hero.setFlipX(false);
      }

      // Move Tarzan
      this.tweens.add({
        targets: this.hero,
        x: targetX,
        duration: Math.abs(targetX - this.hero.x) * 3,
        ease: 'Linear',
      });
    }
  }

  /**
   * Update the held item sprite based on selected inventory item
   */
  private updateHeldItem(_iconKey: string | null): void {
    // DISABLED: Held item sprites have white backgrounds and wrong scale
    // TODO: Create proper pixel art item sprites
    if (this.heldItemSprite) {
      this.heldItemSprite.destroy();
      this.heldItemSprite = null;
    }
    // Don't show held items until we have proper assets
  }

  /**
   * Update held item position to follow Tarzan's hand
   */
  private updateHeldItemPosition(): void {
    if (this.heldItemSprite && this.hero) {
      // Position item near Tarzan's hand (offset based on facing direction)
      const handOffsetX = this.hero.flipX ? -25 : 25;
      const handOffsetY = -40;
      this.heldItemSprite.setPosition(
        this.hero.x + handOffsetX,
        this.hero.y + handOffsetY
      );
      // Flip item to match character direction
      this.heldItemSprite.setFlipX(this.hero.flipX);
    }
  }

  update(_time: number, delta: number): void {
    // WASD movement
    let moving = false;

    if (this.cursors) {
      const speed = this.moveSpeed * (delta / 1000);

      if (this.cursors.A.isDown) {
        this.hero.x -= speed;
        this.hero.setFlipX(true);
        moving = true;
      } else if (this.cursors.D.isDown) {
        this.hero.x += speed;
        this.hero.setFlipX(false);
        moving = true;
      }

      if (this.cursors.W.isDown) {
        this.hero.y -= speed;
        moving = true;
      } else if (this.cursors.S.isDown) {
        this.hero.y += speed;
        moving = true;
      }

      // Play walk animation when moving, idle when stopped
      if (moving && !this.isMoving) {
        this.hero.play('hero-run');
        this.isMoving = true;
      } else if (!moving && this.isMoving) {
        this.hero.play('hero-idle');
        this.isMoving = false;
      }

      // Clamp to scene boundaries
      const minX = 50;
      const maxX = this.cameras.main.width - 50;
      const minY = 200; // Upper boundary
      const maxY = this.cameras.main.height - 60; // Ground level
      this.hero.x = Phaser.Math.Clamp(this.hero.x, minX, maxX);
      this.hero.y = Phaser.Math.Clamp(this.hero.y, minY, maxY);
    }

    // Update held item position
    this.updateHeldItemPosition();

    // Update character depth sorting
    const characters = [this.hero, this.pig, this.deer];
    characters.sort((a, b) => a.y - b.y);
    characters.forEach((char, index) => {
      char.setDepth(100 + index);
    });
  }
}
