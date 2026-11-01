import Phaser from 'phaser';

interface AsteroidData {
  sprite: Phaser.GameObjects.Image;
  rotSpeed: number;
}

export class AsteroidField {
  private scene: Phaser.Scene;
  private asteroids: AsteroidData[] = [];
  private centerX: number;
  private centerY: number;
  private fieldRadius: number;
  private isActive = true;

  constructor(scene: Phaser.Scene, cx: number, cy: number, numAsteroids: number, radius = 500) {
    this.scene = scene;
    this.centerX = cx;
    this.centerY = cy;
    this.fieldRadius = radius;

    // 1. Generate core textures once if they don't exist
    this.generateAsteroidTexture('asteroid_lg', 24);
    this.generateAsteroidTexture('asteroid_md', 16);
    this.generateAsteroidTexture('asteroid_sm', 10);

    // 2. Generate asteroid instances inside a circular field
    const rng = this.createRng(cx * cy + numAsteroids);
    const keys = ['asteroid_lg', 'asteroid_md', 'asteroid_sm'];

    for (let i = 0; i < numAsteroids; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = rng() * radius;
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;

      const key = keys[Math.floor(rng() * keys.length)];
      const sprite = scene.add.image(x, y, key);
      
      // Random rotation and scale variation
      sprite.setRotation(rng() * Math.PI * 2);
      sprite.setScale(0.85 + rng() * 0.35);
      
      // Placed below gameplay elements but above stars/nebulas
      sprite.setDepth(-12);

      const rotSpeed = (rng() - 0.5) * 0.4; // radians per second

      this.asteroids.push({ sprite, rotSpeed });
    }
  }

  public update(playerX: number, playerY: number, delta: number): void {
    const distToPlayer = Phaser.Math.Distance.Between(playerX, playerY, this.centerX, this.centerY);

    // Distance culling: disable individual asteroid updates if too far away
    if (distToPlayer > 3000 + this.fieldRadius) {
      if (this.isActive) {
        this.isActive = false;
        this.asteroids.forEach(a => a.sprite.setVisible(false));
      }
      return;
    }

    if (!this.isActive) {
      this.isActive = true;
      this.asteroids.forEach(a => a.sprite.setVisible(true));
    }

    // Slowly rotate asteroids
    const dt = delta / 1000;
    this.asteroids.forEach(a => {
      a.sprite.rotation += a.rotSpeed * dt;
    });
  }

  private generateAsteroidTexture(key: string, size: number): void {
    if (this.scene.textures.exists(key)) return;

    // Draw irregular rock shape on a CanvasTexture
    const tex = this.scene.textures.createCanvas(key, size * 2, size * 2);
    if (tex) {
      const ctx = tex.context;
      const cx = size;
      const cy = size;
      const rng = this.createRng(size * 17);

      ctx.save();
      ctx.fillStyle = '#4b5563'; // Gray Slate-600
      ctx.strokeStyle = '#1f2937'; // Slate-800
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      const vertices = 8;
      for (let i = 0; i < vertices; i++) {
        const angle = (i / vertices) * Math.PI * 2;
        const radiusOffset = (rng() - 0.5) * (size * 0.35);
        const r = size * 0.8 + radiusOffset;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw a small interior shadow or crater wisp
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.arc(cx - size * 0.2, cy - size * 0.2, size * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
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
