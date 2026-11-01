import Phaser from 'phaser';

export class DamageNumber extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x: number, y: number, amount: number) {
    super(scene, x, y, `-${amount}`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '20px',
      color: '#ef4444', // Red-500
      fontStyle: 'bold'
    });

    scene.add.existing(this);
    this.setOrigin(0.5, 0.5);
    this.setDepth(500); // Position above game assets

    // Animate the text rising and fading out
    scene.tweens.add({
      targets: this,
      y: y - 50,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.destroy(); // Automatically clean up when done
      }
    });
  }
}
