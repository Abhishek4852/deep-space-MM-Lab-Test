import Phaser from 'phaser';

export class EnemyFactory {
  /**
   * Generates all normal and boss enemy textures once on launch.
   */
  public static generateAllTextures(scene: Phaser.Scene): void {
    this.createScoutTexture(scene);
    this.createInterceptorTexture(scene);
    this.createBomberTexture(scene);
    this.createKamikazeTexture(scene);
    this.createSniperTexture(scene);
    this.createSwarmTexture(scene);
    this.createShieldTexture(scene);
    this.createGuardianTexture(scene);
    this.createDreadnoughtTexture(scene);
    this.createCoreTexture(scene);
    this.createMineTexture(scene);
    this.createLaserProjTexture(scene);
  }

  private static createScoutTexture(scene: Phaser.Scene): void {
    const key = 'enemy_scout';
    if (scene.textures.exists(key)) return;

    const w = 48;
    const h = 40;
    const cy = h / 2;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Outer hull (Dark Red)
      ctx.fillStyle = '#450a0a';
      ctx.beginPath();
      ctx.moveTo(44, cy);
      ctx.lineTo(14, cy - 16);
      ctx.lineTo(18, cy - 4);
      ctx.lineTo(6, cy - 4);
      ctx.lineTo(8, cy);
      ctx.lineTo(6, cy + 4);
      ctx.lineTo(18, cy + 4);
      ctx.lineTo(14, cy + 16);
      ctx.closePath();
      ctx.fill();

      // Inner hull (Crimson Red)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(41, cy);
      ctx.lineTo(15, cy - 14);
      ctx.lineTo(18, cy - 3);
      ctx.lineTo(7, cy - 3);
      ctx.lineTo(9, cy);
      ctx.lineTo(7, cy + 3);
      ctx.lineTo(18, cy + 3);
      ctx.lineTo(15, cy + 14);
      ctx.closePath();
      ctx.fill();

      // Core (Gold Yellow)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(35, cy);
      ctx.lineTo(22, cy - 4);
      ctx.lineTo(18, cy);
      ctx.lineTo(22, cy + 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      tex.refresh();
    }
  }

  private static createInterceptorTexture(scene: Phaser.Scene): void {
    const key = 'enemy_interceptor';
    if (scene.textures.exists(key)) return;

    const w = 50;
    const h = 42;
    const cy = h / 2;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Dark Green Outline
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.moveTo(48, cy);
      ctx.lineTo(16, cy - 18);
      ctx.lineTo(24, cy - 4);
      ctx.lineTo(4, cy - 4);
      ctx.lineTo(6, cy);
      ctx.lineTo(4, cy + 4);
      ctx.lineTo(24, cy + 4);
      ctx.lineTo(16, cy + 18);
      ctx.closePath();
      ctx.fill();

      // Bright Green Hull
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(44, cy);
      ctx.lineTo(17, cy - 15);
      ctx.lineTo(23, cy - 3);
      ctx.lineTo(5, cy - 3);
      ctx.lineTo(7, cy);
      ctx.lineTo(5, cy + 3);
      ctx.lineTo(23, cy + 3);
      ctx.lineTo(17, cy + 15);
      ctx.closePath();
      ctx.fill();

      // Wingtips/Cockpit (Neon Green)
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.ellipse(32, cy, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      tex.refresh();
    }
  }

  private static createBomberTexture(scene: Phaser.Scene): void {
    const key = 'enemy_bomber';
    if (scene.textures.exists(key)) return;

    const w = 60;
    const h = 54;
    const cy = h / 2;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Heavy outline
      ctx.fillStyle = '#3b0764';
      ctx.beginPath();
      ctx.moveTo(56, cy);
      ctx.lineTo(20, cy - 24);
      ctx.lineTo(6, cy - 12);
      ctx.lineTo(10, cy);
      ctx.lineTo(6, cy + 12);
      ctx.lineTo(20, cy + 24);
      ctx.closePath();
      ctx.fill();

      // Purple main armor
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.moveTo(52, cy);
      ctx.lineTo(21, cy - 21);
      ctx.lineTo(8, cy - 10);
      ctx.lineTo(12, cy);
      ctx.lineTo(8, cy + 10);
      ctx.lineTo(21, cy + 21);
      ctx.closePath();
      ctx.fill();

      // Heat exhaust panels (gold yellow stripes)
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(18, cy - 14, 4, 28);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(36, cy - 5, 8, 10); // bridge

      ctx.restore();
      tex.refresh();
    }
  }

  private static createKamikazeTexture(scene: Phaser.Scene): void {
    const key = 'enemy_kamikaze';
    if (scene.textures.exists(key)) return;

    const w = 44;
    const h = 40;
    const cy = h / 2;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Base triangle
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(42, cy);
      ctx.lineTo(4, cy - 18);
      ctx.lineTo(10, cy);
      ctx.lineTo(4, cy + 18);
      ctx.closePath();
      ctx.fill();

      // Orange hazard hull
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(38, cy);
      ctx.lineTo(5, cy - 15);
      ctx.lineTo(11, cy);
      ctx.lineTo(5, cy + 15);
      ctx.closePath();
      ctx.fill();

      // Yellow stripes (warning markings)
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(25, cy - 10);
      ctx.lineTo(30, cy - 12);
      ctx.lineTo(20, cy);
      ctx.lineTo(15, cy);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(25, cy + 10);
      ctx.lineTo(30, cy + 12);
      ctx.lineTo(20, cy);
      ctx.lineTo(15, cy);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      tex.refresh();
    }
  }

  private static createSniperTexture(scene: Phaser.Scene): void {
    const key = 'enemy_sniper';
    if (scene.textures.exists(key)) return;

    const w = 48;
    const h = 44;
    const cy = h / 2;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Long structural frame outline
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(46, cy);
      ctx.lineTo(16, cy - 14);
      ctx.lineTo(20, cy - 2);
      ctx.lineTo(4, cy - 2);
      ctx.lineTo(4, cy + 2);
      ctx.lineTo(20, cy + 2);
      ctx.lineTo(16, cy + 14);
      ctx.closePath();
      ctx.fill();

      // Cyan visor panels
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(40, cy);
      ctx.lineTo(18, cy - 11);
      ctx.lineTo(21, cy);
      ctx.lineTo(18, cy + 11);
      ctx.closePath();
      ctx.fill();

      // Charge core (white center)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(28, cy, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      tex.refresh();
    }
  }

  private static createSwarmTexture(scene: Phaser.Scene): void {
    const key = 'enemy_swarm';
    if (scene.textures.exists(key)) return;

    const w = 32;
    const h = 28;
    const cy = h / 2;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Tiny outline
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(28, cy);
      ctx.lineTo(10, cy - 10);
      ctx.lineTo(4, cy);
      ctx.lineTo(10, cy + 10);
      ctx.closePath();
      ctx.fill();

      // Red central body
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(25, cy);
      ctx.lineTo(11, cy - 8);
      ctx.lineTo(5, cy);
      ctx.lineTo(11, cy + 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
      tex.refresh();
    }
  }

  private static createShieldTexture(scene: Phaser.Scene): void {
    const key = 'enemy_shield';
    if (scene.textures.exists(key)) return;

    const w = 48;
    const h = 48;
    const cx = w / 2;
    const cy = h / 2;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Shield Drone outline
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.fill();

      // White hull plates
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cx, cy, 17, 0, Math.PI * 2);
      ctx.fill();

      // Glowing core (Cyan emission)
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();

      // Inner white bulb
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      tex.refresh();
    }
  }

  private static createGuardianTexture(scene: Phaser.Scene): void {
    const key = 'boss_guardian';
    if (scene.textures.exists(key)) return;

    // Guardian is 180px octagonal battlestation
    const w = 180;
    const h = 180;
    const cx = w / 2;
    const cy = h / 2;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Dark mechanical frame
      ctx.fillStyle = '#0f172a';
      this.drawOctagon(ctx, cx, cy, 84);
      ctx.fill();

      // Mid armor shields (Slate Grey)
      ctx.fillStyle = '#475569';
      this.drawOctagon(ctx, cx, cy, 76);
      ctx.fill();

      // Red core panels (hazard energy)
      ctx.fillStyle = '#b91c1c';
      this.drawOctagon(ctx, cx, cy, 45);
      ctx.fill();

      // Glowing yellow center core
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.fill();

      // Central core white reflection highlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 6, cy - 6, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      tex.refresh();
    }
  }

  private static createDreadnoughtTexture(scene: Phaser.Scene): void {
    const key = 'boss_dreadnought';
    if (scene.textures.exists(key)) return;

    // Dreadnought is 200px massive spearhead battleship
    const w = 200;
    const h = 160;
    const cy = h / 2;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Heavy outline frame (navy slate)
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(190, cy);
      ctx.lineTo(80, cy - 65);
      ctx.lineTo(20, cy - 50);
      ctx.lineTo(30, cy - 15);
      ctx.lineTo(10, cy - 15);
      ctx.lineTo(15, cy);
      ctx.lineTo(10, cy + 15);
      ctx.lineTo(30, cy + 15);
      ctx.lineTo(20, cy + 50);
      ctx.lineTo(80, cy + 65);
      ctx.closePath();
      ctx.fill();

      // Slate hull armor
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(182, cy);
      ctx.lineTo(82, cy - 58);
      ctx.lineTo(24, cy - 44);
      ctx.lineTo(32, cy - 12);
      ctx.lineTo(18, cy - 12);
      ctx.lineTo(22, cy);
      ctx.lineTo(18, cy + 12);
      ctx.lineTo(32, cy + 12);
      ctx.lineTo(24, cy + 44);
      ctx.lineTo(82, cy + 58);
      ctx.closePath();
      ctx.fill();

      // Glowing battery nodes (orange crimson)
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(100, cy - 30, 20, 8);
      ctx.fillRect(100, cy + 22, 20, 8);
      ctx.fillRect(130, cy - 16, 25, 6);
      ctx.fillRect(130, cy + 10, 25, 6);

      ctx.restore();
      tex.refresh();
    }
  }

  private static createCoreTexture(scene: Phaser.Scene): void {
    const key = 'boss_core';
    if (scene.textures.exists(key)) return;

    // Ancient Core is a sphere with glowing cores
    const w = 150;
    const h = 150;
    const cx = w / 2;
    const cy = h / 2;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Mechanical base framework (gold rust)
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(cx, cy, 65, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#7c2d12';
      ctx.beginPath();
      ctx.arc(cx, cy, 58, 0, Math.PI * 2);
      ctx.fill();

      // Outer shields cutouts
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(cx, cy, 45, 0, Math.PI * 2);
      ctx.fill();

      // Glowing central pink core
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(cx, cy, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 5, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      tex.refresh();
    }
  }

  private static createMineTexture(scene: Phaser.Scene): void {
    const key = 'enemy_mine';
    if (scene.textures.exists(key)) return;

    const w = 24;
    const h = 24;
    const cx = w / 2;
    const cy = h / 2;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Mine core
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Spikes (indicator lights)
      ctx.fillStyle = '#ec4899';
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * 9, cy + Math.sin(angle) * 9, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      tex.refresh();
    }
  }

  private static createLaserProjTexture(scene: Phaser.Scene): void {
    const key = 'enemy_laser_bullet';
    if (scene.textures.exists(key)) return;

    const w = 20;
    const h = 6;
    const tex = scene.textures.createCanvas(key, w, h);
    if (tex) {
      const ctx = tex.context;
      ctx.save();

      // Laser projectile capsule (cyan glows)
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
      grad.addColorStop(0.5, '#22d3ee');
      grad.addColorStop(1.0, '#ffffff');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.restore();
      tex.refresh();
    }
  }

  private static drawOctagon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
}
