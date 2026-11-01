import Phaser from 'phaser';

export class StarCluster {
  private scene: Phaser.Scene;
  private farLayer: Phaser.GameObjects.Graphics;
  private midLayerA: Phaser.GameObjects.Graphics;
  private midLayerB: Phaser.GameObjects.Graphics;
  private nearLayer: Phaser.GameObjects.Graphics;

  private shootingStarTimer: number = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const size = 12000;
    const rng = this.createRng(44332);

    // 1. Far Stars Layer (Scroll factor 0.15, depth -35)
    this.farLayer = scene.add.graphics();
    this.farLayer.setScrollFactor(0.15).setDepth(-35);
    this.farLayer.fillStyle(0xffffff, 0.35);
    for (let i = 0; i < 800; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 0.8 + rng() * 0.6;
      this.farLayer.fillCircle(x, y, r);
    }

    // 2. Medium Stars Layer A (Scroll factor 0.35, depth -30)
    this.midLayerA = scene.add.graphics();
    this.midLayerA.setScrollFactor(0.35).setDepth(-30);
    this.midLayerA.fillStyle(0xffffff, 0.6);
    for (let i = 0; i < 250; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 1.2 + rng() * 0.6;
      this.midLayerA.fillCircle(x, y, r);
    }

    // 3. Medium Stars Layer B (Scroll factor 0.35, depth -30, offset seed)
    this.midLayerB = scene.add.graphics();
    this.midLayerB.setScrollFactor(0.35).setDepth(-30);
    this.midLayerB.fillStyle(0xe0f2fe, 0.6); // Slightly bluish stars
    for (let i = 0; i < 250; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 1.2 + rng() * 0.6;
      this.midLayerB.fillCircle(x, y, r);
    }

    // 4. Near Stars Layer (Scroll factor 0.6, depth -25)
    this.nearLayer = scene.add.graphics();
    this.nearLayer.setScrollFactor(0.6).setDepth(-25);
    this.nearLayer.fillStyle(0xffffff, 0.85);
    for (let i = 0; i < 180; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const r = 1.8 + rng() * 0.8;
      this.nearLayer.fillCircle(x, y, r);
    }

    // Setup initial shooting star timer
    this.resetShootingStarTimer();
  }

  /**
   * Updates twinkling animation cycles and spawns comets/shooting stars.
   */
  public update(time: number, delta: number): void {
    const dt = delta; // ms

    // Twinkling effect: oscillate alphas of medium star graphics out of phase
    this.midLayerA.setAlpha(0.65 + Math.sin(time * 0.002) * 0.25);
    this.midLayerB.setAlpha(0.65 + Math.sin(time * 0.0035 + 1.5) * 0.25);

    // Near layer subtle twinkling
    this.nearLayer.setAlpha(0.85 + Math.sin(time * 0.001) * 0.1);

    // Shooting star spawn trigger
    this.shootingStarTimer -= dt;
    if (this.shootingStarTimer <= 0) {
      this.spawnShootingStar();
      this.resetShootingStarTimer();
    }
  }

  private resetShootingStarTimer(): void {
    // Spawn a shooting star every 12 to 24 seconds
    this.shootingStarTimer = 12000 + Math.random() * 12000;
  }

  private spawnShootingStar(): void {
    const cam = this.scene.cameras.main;
    // Spawn within camera viewport
    const startX = cam.worldView.x + Math.random() * cam.width;
    const startY = cam.worldView.y + Math.random() * (cam.height * 0.4); // spawn in upper part

    const length = 120 + Math.random() * 80;
    const angle = Math.PI / 6 + Math.random() * (Math.PI / 12); // ~30 degrees down-right

    const graphic = this.scene.add.graphics();
    graphic.setDepth(-10); // Draw above stars but below gameplay/planets

    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;

    // Draw fading line
    graphic.lineStyle(1.5, 0xffffff, 0.8);
    graphic.lineBetween(startX, startY, endX, endY);

    // Anim slide + fade out
    this.scene.tweens.add({
      targets: graphic,
      alpha: 0,
      x: Math.cos(angle) * 150,
      y: Math.sin(angle) * 150,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => {
        graphic.destroy();
      }
    });
  }

  private createRng(seed: number): () => number {
    let s = seed;
    return () => {
      const x = Math.sin(s++) * 10000;
      return x - Math.floor(x);
    };
  }
}
