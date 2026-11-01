import Phaser from 'phaser';

export class Explosion extends Phaser.GameObjects.Graphics {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene);

    // Register inside the scene display lists
    scene.add.existing(this);
    this.setPosition(x, y);

    // Draw placeholder glowing explosion structure
    this.fillStyle(0xfabf0a, 0.85); // Outer fiery yellow/orange glow
    this.fillCircle(0, 0, 30);
    this.fillStyle(0xffffff, 1.0); // Inner hot white core
    this.fillCircle(0, 0, 15);

    // Initial scale and transparency
    this.setScale(0.1);
    this.setAlpha(1.0);

    // Trigger visual expansion and fade-out tween
    scene.tweens.add({
      targets: this,
      scale: 1.6,
      alpha: 0,
      duration: 350,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.destroy(); // Automatically clean up on completion
      }
    });
  }
}
