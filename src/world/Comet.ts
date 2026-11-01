import Phaser from 'phaser';

export class Comet {
  private scene: Phaser.Scene;
  private head: Phaser.GameObjects.Image;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  
  private vx: number;
  private vy: number;
  private isDestroyed = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 1. Ensure textures exist
    Comet.generateTextures(scene);

    // 2. Select a random trajectory sweeping across the viewport
    const cam = scene.cameras.main;
    const side = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left

    let startX = 0;
    let startY = 0;
    let targetX = 0;
    let targetY = 0;

    const margin = 100;
    const width = cam.width;
    const height = cam.height;

    // Spawn relative to camera view coordinates for guaranteed crossing visibility
    if (side === 0) {
      startX = cam.worldView.x + Math.random() * width;
      startY = cam.worldView.y - margin;
      targetX = startX + (Math.random() - 0.5) * width;
      targetY = cam.worldView.y + height + margin;
    } else if (side === 1) {
      startX = cam.worldView.x + width + margin;
      startY = cam.worldView.y + Math.random() * height;
      targetX = cam.worldView.x - margin;
      targetY = startY + (Math.random() - 0.5) * height;
    } else if (side === 2) {
      startX = cam.worldView.x + Math.random() * width;
      startY = cam.worldView.y + height + margin;
      targetX = startX + (Math.random() - 0.5) * width;
      targetY = cam.worldView.y - margin;
    } else {
      startX = cam.worldView.x - margin;
      startY = cam.worldView.y + Math.random() * height;
      targetX = cam.worldView.x + width + margin;
      targetY = startY + (Math.random() - 0.5) * height;
    }

    // 3. Create head sprite
    this.head = scene.add.image(startX, startY, 'comet_head');
    this.head.setDepth(-11); // Above star layer, below gameplay/planets

    // 4. Calculate heading velocities
    const angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
    const speed = 400 + Math.random() * 300; // px/s
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    // Set rotation to face travel direction
    this.head.setRotation(angle);

    // 5. Create particle tail emitter (Phaser 3.60+ API)
    this.emitter = scene.add.particles(startX, startY, 'comet_particle', {
      speed: 40,
      angle: { min: Phaser.Math.RadToDeg(angle) + 160, max: Phaser.Math.RadToDeg(angle) + 200 },
      scale: { start: 1.25, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 800,
      blendMode: 'ADD',
      frequency: 20
    });
    this.emitter.setDepth(-11);
  }

  public update(delta: number): void {
    if (this.isDestroyed) return;

    const dt = delta / 1000;
    this.head.x += this.vx * dt;
    this.head.y += this.vy * dt;

    // Track particle source to head coordinates
    this.emitter.setPosition(this.head.x, this.head.y);

    // Check if left world bounds (12000 x 12000)
    const bounds = 12000;
    if (
      this.head.x < -200 ||
      this.head.y < -200 ||
      this.head.x > bounds + 200 ||
      this.head.y > bounds + 200
    ) {
      this.destroy();
    }
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.head.destroy();
    // Stop emitter and let remaining particles fade away naturally before deleting
    this.emitter.stop();
    this.scene.time.delayedCall(1000, () => {
      this.emitter.destroy();
    });
  }

  public getIsDestroyed(): boolean {
    return this.isDestroyed;
  }

  private static generateTextures(scene: Phaser.Scene): void {
    if (!scene.textures.exists('comet_head')) {
      const tex = scene.textures.createCanvas('comet_head', 20, 20);
      if (tex) {
        const ctx = tex.context;
        const grad = ctx.createRadialGradient(10, 10, 0, 10, 10, 10);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#e0f2fe'); // Pale sky blue
        grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.4)'); // Sky blue transparency
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(10, 10, 10, 0, Math.PI * 2);
        ctx.fill();
        tex.refresh();
      }
    }

    if (!scene.textures.exists('comet_particle')) {
      const tex = scene.textures.createCanvas('comet_particle', 8, 8);
      if (tex) {
        const ctx = tex.context;
        const grad = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.7)');
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(4, 4, 4, 0, Math.PI * 2);
        ctx.fill();
        tex.refresh();
      }
    }
  }
}
