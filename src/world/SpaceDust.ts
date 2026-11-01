import Phaser from 'phaser';

export class SpaceDust {
  private layer: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    const size = 12000;
    const rng = this.createRng(998877);

    // Layer 4 (Scroll factor 0.75, depth -22)
    this.layer = scene.add.graphics();
    this.layer.setScrollFactor(0.75).setDepth(-22);

    const dustColors = [
      0x94a3b8, // slate
      0x38bdf8, // light blue
      0xfbbf24, // gold
      0xf472b6  // pink
    ];

    for (let i = 0; i < 400; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 1.0 + rng() * 1.5;
      const alpha = 0.1 + rng() * 0.2;
      const color = dustColors[Math.floor(rng() * dustColors.length)];

      this.layer.fillStyle(color, alpha);
      this.layer.fillCircle(x, y, r);
    }
  }

  private createRng(seed: number): () => number {
    let s = seed;
    return () => {
      const x = Math.sin(s++) * 10000;
      return x - Math.floor(x);
    };
  }
}
