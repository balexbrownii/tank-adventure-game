import Phaser from 'phaser';

const MESSAGE_BOX_PADDING = 16;
const MESSAGE_BOX_HEIGHT = 60;

/**
 * MessageBox - Displays interaction responses and game messages
 * Shows at top of screen with typewriter effect
 */
export class MessageBox extends Phaser.GameObjects.Container {
  private background: Phaser.GameObjects.Rectangle;
  private messageText: Phaser.GameObjects.Text;
  private currentMessage: string = '';
  private displayedText: string = '';
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private isTyping: boolean = false;
  private autoHideTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene) {
    const gameWidth = scene.cameras.main.width;

    super(scene, 0, 0);

    // Background
    this.background = scene.add.rectangle(
      gameWidth / 2,
      MESSAGE_BOX_HEIGHT / 2,
      gameWidth - MESSAGE_BOX_PADDING * 2,
      MESSAGE_BOX_HEIGHT,
      0x1a1a2e,
      0.9
    );
    this.background.setStrokeStyle(2, 0x4a4a6a);
    this.add(this.background);

    // Message text
    this.messageText = scene.add.text(
      MESSAGE_BOX_PADDING + 10,
      MESSAGE_BOX_HEIGHT / 2,
      '',
      {
        font: '16px serif',
        color: '#ffffff',
        wordWrap: { width: gameWidth - MESSAGE_BOX_PADDING * 4 },
      }
    );
    this.messageText.setOrigin(0, 0.5);
    this.add(this.messageText);

    // Start hidden
    this.setVisible(false);

    // Click to skip typewriter / dismiss
    this.background.setInteractive();
    this.background.on('pointerdown', () => {
      if (this.isTyping) {
        this.skipTypewriter();
      } else {
        this.hide();
      }
    });

    scene.add.existing(this);
    this.setDepth(1001);
  }

  /**
   * Show a message with typewriter effect
   */
  show(message: string, autoHideDelay: number = 3000): void {
    this.currentMessage = message;
    this.displayedText = '';
    this.messageText.setText('');
    this.setVisible(true);
    this.isTyping = true;

    // Clear any existing timers
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    if (this.autoHideTimer) {
      this.autoHideTimer.destroy();
    }

    // Typewriter effect
    let charIndex = 0;
    this.typewriterTimer = this.scene.time.addEvent({
      delay: 30,
      callback: () => {
        if (charIndex < this.currentMessage.length) {
          this.displayedText += this.currentMessage[charIndex];
          this.messageText.setText(this.displayedText);
          charIndex++;
        } else {
          this.isTyping = false;
          this.typewriterTimer?.destroy();

          // Auto-hide after delay
          if (autoHideDelay > 0) {
            this.autoHideTimer = this.scene.time.delayedCall(autoHideDelay, () => {
              this.hide();
            });
          }
        }
      },
      loop: true,
    });
  }

  /**
   * Skip the typewriter effect and show full message
   */
  skipTypewriter(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    this.displayedText = this.currentMessage;
    this.messageText.setText(this.displayedText);
    this.isTyping = false;
  }

  /**
   * Hide the message box
   */
  hide(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    if (this.autoHideTimer) {
      this.autoHideTimer.destroy();
    }
    this.setVisible(false);
    this.isTyping = false;
  }

  /**
   * Check if currently showing a message
   */
  isShowing(): boolean {
    return this.visible;
  }

  /**
   * Clean up
   */
  destroy(fromScene?: boolean): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    if (this.autoHideTimer) {
      this.autoHideTimer.destroy();
    }
    super.destroy(fromScene);
  }
}
