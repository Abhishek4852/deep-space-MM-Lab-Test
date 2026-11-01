import Phaser from 'phaser';

export class Nebula {
  private scene: Phaser.Scene;
  private sprites: Phaser.GameObjects.Image[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 1. Generate procedural canvas textures for each nebula color once
    this.generateNebulaTexture('nebula_purple', '#a855f7');
    this.generateNebulaTexture('nebula_blue', '#3b82f6');
    this.generateNebulaTexture('nebula_pink', '#ec4899');
    this.generateNebulaTexture('nebula_teal', '#14b8a6');

    // 2. Scatter 15 nebula clouds deterministically across the world map
    const rng = this.createRng(77761);
    const size = 12000;
    const keys = ['nebula_purple', 'nebula_blue', 'nebula_pink', 'nebula_teal'];

    for (let i = 0; i < 16; i++) {
      const x = rng() * size;
      const y = rng() * size;
      const key = keys[Math.floor(rng() * keys.length)];
      const scale = 3.0 + rng() * 4.0; // Scaled up to 1500px - 3000px
      const alpha = 0.08 + rng() * 0.07; // Very soft opacity to keep text legible

      const img = scene.add.image(x, y, key);
      img.setScrollFactor(0.12) // Very slow distant scroll
         .setDepth(-40) // Bottommost layer
         .setBlendMode(Phaser.BlendModes.ADD)
         .setScale(scale)
         .setAlpha(alpha);

      // Random rotation
      img.setRotation(rng() * Math.PI * 2);

      this.sprites.push(img);
    }
  }

  private generateNebulaTexture(key: string, baseColor: string): void {
    if (this.scene.textures.exists(key)) return;

    // Texture size 512x512, scaled up in-game for memory efficiency
    const size = 512;
    const center = size / 2;
    const tex = this.scene.textures.createCanvas(key, size, size);
    if (tex) {
      const ctx = tex.context;

      // Hex to RGB parser
      const hex = baseColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      // Draw main central blob
      const grad = ctx.createRadialGradient(center, center, 0, center, center, center * 0.95);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.5)`);
      grad.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.25)`);
      grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, 0.08)`);
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(center, center, center, 0, Math.PI * 2);
      ctx.fill();

      // Draw a secondary offset smaller blob to make it look irregular/clouds-like
      const gradOffset = ctx.createRadialGradient(center + 60, center - 40, 0, center + 60, center - 40, center * 0.6);
      gradOffset.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.35)`);
      gradOffset.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.1)`);
      gradOffset.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradOffset;
      ctx.beginPath();
      ctx.arc(center + 60, center - 40, center * 0.6, 0, Math.PI * 2);
      ctx.fill();

      tex.refresh();
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
