import Phaser from 'phaser';

export class PowerUpNotification extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number, text: string, color: string) {
    super(scene, x, y, `+ ${text}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '22px',
      color: color,
      fontStyle: 'bold'
    });

    scene.add.existing(this);
    this.setOrigin(0.5, 0.5);
    this.setDepth(500); // Position above standard game elements

    // Float upwards and scale up, then fade away
    scene.tweens.add({
      targets: this,
      y: y - 60,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.destroy(); // Recovers memory instantly
      }
    });
  }
}
