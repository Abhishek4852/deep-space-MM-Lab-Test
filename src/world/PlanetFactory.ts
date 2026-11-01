import Phaser from 'phaser';
import { PlanetDefinition } from './PlanetDefinitions';

export class PlanetFactory {
  /**
   * Automatically generates and bakes all procedural layers for a planet.
   */
  public static generatePlanetTextures(scene: Phaser.Scene, def: PlanetDefinition): void {
    const R = def.radius;
    const size = R * 2;

    // 1. Surface Texture
    const surfaceKey = `planet_surface_${def.id}`;
    if (!scene.textures.exists(surfaceKey)) {
      const tex = scene.textures.createCanvas(surfaceKey, size, size);
      if (tex) {
        const ctx = tex.context;
        this.drawSurface(ctx, def, R);
        tex.refresh();
      }
    }

    // 2. Cloud Texture (if applicable)
    if (def.hasClouds) {
      const cloudKey = `planet_clouds_${def.id}`;
      if (!scene.textures.exists(cloudKey)) {
        const tex = scene.textures.createCanvas(cloudKey, size, size);
        if (tex) {
          const ctx = tex.context;
          this.drawClouds(ctx, def, R);
          tex.refresh();
        }
      }
    }

    // 3. Static Shadow Layer (locks light direction consistently lit top-left, dark bottom-right)
    const shadowKey = `planet_shadow_${def.id}`;
    if (!scene.textures.exists(shadowKey)) {
      const tex = scene.textures.createCanvas(shadowKey, size, size);
      if (tex) {
        const ctx = tex.context;
        this.drawShadow(ctx, R);
        tex.refresh();
      }
    }

    // 4. Atmospheric Outer Glow Layer
    const glowMargin = Math.round(R * 0.18);
    const glowSize = (R + glowMargin) * 2;
    const glowKey = `planet_glow_${def.id}`;
    if (!scene.textures.exists(glowKey)) {
      const tex = scene.textures.createCanvas(glowKey, glowSize, glowSize);
      if (tex) {
        const ctx = tex.context;
        this.drawGlow(ctx, def, R, glowMargin);
        tex.refresh();
      }
    }

    // 5. Rings (Saturn specific, skewed 2.5D oval)
    if (def.hasRing) {
      const ringKey = `planet_ring_${def.id}`;
      const ringW = R * 4.2;
      const ringH = R * 1.5;
      if (!scene.textures.exists(ringKey)) {
        const tex = scene.textures.createCanvas(ringKey, ringW, ringH);
        if (tex) {
          const ctx = tex.context;
          this.drawRings(ctx, R, ringW, ringH);
          tex.refresh();
        }
      }
    }
  }

  private static drawSurface(ctx: CanvasRenderingContext2D, def: PlanetDefinition, R: number): void {
    const size = R * 2;
    const cx = R;
    const cy = R;

    // Clip to circle so surface details don't leak out of sphere
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    // Fill base surface color
    ctx.fillStyle = def.primaryColor;
    ctx.fillRect(0, 0, size, size);

    // Planet-specific procedural textures
    const rng = this.createRng(def.name.length + R);

    if (def.id === 'mercury') {
      // Gray rocky surface with craters
      ctx.fillStyle = def.secondaryColor;
      for (let i = 0; i < 20; i++) {
        const cr = 8 + rng() * 12;
        const cx = R + (rng() - 0.5) * R * 1.6;
        const cy = R + (rng() - 0.5) * R * 1.6;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();

        // Crater edge highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, Math.PI * 1.25, Math.PI * 0.25);
        ctx.stroke();
      }
    } else if (def.id === 'venus') {
      // Thick dense clouds with horizontal bands
      const gradient = ctx.createLinearGradient(0, 0, size, size);
      gradient.addColorStop(0, def.primaryColor);
      gradient.addColorStop(1, def.secondaryColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Sulfuric haze wind bands
      for (let y = 10; y < size; y += 12) {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
        ctx.beginPath();
        ctx.ellipse(cx, y + (rng() - 0.5) * 4, R * 0.95, 4 + rng() * 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (def.id === 'earth') {
      // Continents (Green on Blue Ocean)
      ctx.fillStyle = def.secondaryColor; // Green landmasses

      // Let's draw 5-6 organic continent blocks
      for (let c = 0; c < 6; c++) {
        const lx = R + (rng() - 0.5) * R * 1.2;
        const ly = R + (rng() - 0.5) * R * 1.2;
        const lr = 35 + rng() * 45;

        // Draw an blob using multiple overlapping circles
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fill();

        // sub blob
        ctx.beginPath();
        ctx.arc(lx + (rng() - 0.5) * lr, ly + (rng() - 0.5) * lr, lr * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ice caps at North and South poles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI * 1.8, Math.PI * 1.2); // North Pole cap
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI * 0.8, Math.PI * 0.2); // South Pole cap
      ctx.fill();
    } else if (def.id === 'mars') {
      // Mars rusty surface with canyons and polar ice cap
      ctx.fillStyle = def.secondaryColor;
      for (let i = 0; i < 4; i++) {
        // Canyons/dark spots
        ctx.strokeStyle = def.secondaryColor;
        ctx.lineWidth = 10 + rng() * 15;
        ctx.beginPath();
        ctx.moveTo(cx - R + rng() * 40, cy - R/2 + i * 40);
        ctx.bezierCurveTo(
          cx - R/2 + rng() * R, cy - R/2 + rng() * R,
          cx + R/2 + rng() * R, cy - R/2 + rng() * R,
          cx + R - rng() * 40, cy - R/2 + i * 40
        );
        ctx.stroke();
      }

      // White dry ice polar cap at top
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI * 1.82, Math.PI * 1.18);
      ctx.fill();
    } else if (def.id === 'jupiter') {
      // Atmospheric colored bands
      const bandColors = [
        '#ea580c', // Dark orange
        '#c2410c', // Rust brown
        '#ffedd5', // White/Cream
        '#fdba74', // Peach
        '#9a3412', // Darker rust
      ];

      let bandY = 0;
      while (bandY < size) {
        const bandH = 15 + rng() * 35;
        ctx.fillStyle = bandColors[Math.floor(rng() * bandColors.length)];
        ctx.fillRect(0, bandY, size, bandH);
        bandY += bandH;
      }

      // Draw Great Red Spot (dark reddish oval)
      ctx.fillStyle = '#991b1b'; // Great Red Spot color
      ctx.beginPath();
      ctx.ellipse(cx + R * 0.35, cy + R * 0.3, R * 0.16, R * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();

      // Spot light ring highlighting
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(cx + R * 0.35, cy + R * 0.3, R * 0.19, R * 0.12, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (def.id === 'saturn') {
      // Saturn golden gas stripes
      const ringColors = ['#f59e0b', '#d97706', '#b45309', '#fef08a', '#ca8a04'];
      let bandY = 0;
      while (bandY < size) {
        const bandH = 12 + rng() * 28;
        ctx.fillStyle = ringColors[Math.floor(rng() * ringColors.length)];
        ctx.fillRect(0, bandY, size, bandH);
        bandY += bandH;
      }
    } else if (def.id === 'uranus') {
      // Pale cyan ice bands (minimal smooth detail)
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, def.primaryColor);
      gradient.addColorStop(0.5, '#22d3ee');
      gradient.addColorStop(1, def.secondaryColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Soft light bands
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(0, R * 0.4, size, R * 0.15);
      ctx.fillRect(0, R * 1.3, size, R * 0.2);
    } else if (def.id === 'neptune') {
      // Deep blue dynamic storms
      const gradient = ctx.createLinearGradient(0, 0, 0, size);
      gradient.addColorStop(0, def.primaryColor);
      gradient.addColorStop(0.5, '#3b82f6');
      gradient.addColorStop(1, def.secondaryColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);

      // Dark Storm patch (Great Dark Spot)
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.ellipse(cx - R * 0.3, cy - R * 0.2, R * 0.18, R * 0.1, Math.PI / 10, 0, Math.PI * 2);
      ctx.fill();

      // Storm swirls / wisps
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy + R * 0.3, R * 0.8, R * 0.1, 0, 0, Math.PI * 0.8);
      ctx.stroke();
    } else if (def.id === 'pluto') {
      // Heart-shaped Tombaugh Regio
      ctx.fillStyle = def.secondaryColor;
      ctx.fillRect(0, 0, size, size);

      // Large bright heart patch
      ctx.fillStyle = '#ffedd5'; // Heart patch color
      ctx.beginPath();
      // Draw a stylized heart using curves relative to bottom center
      const hx = cx + 15;
      const hy = cy + 25;
      ctx.moveTo(hx, hy);
      ctx.bezierCurveTo(hx - 30, hy - 30, hx - 40, hy + 10, hx, hy + 40);
      ctx.bezierCurveTo(hx + 40, hy + 10, hx + 30, hy - 30, hx, hy);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  private static drawClouds(ctx: CanvasRenderingContext2D, def: PlanetDefinition, R: number): void {
    const cx = R;
    const cy = R;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 1, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const rng = this.createRng(def.name.length + 889);

    if (def.id === 'earth') {
      // Wispy green/blue/white planet clouds
      for (let i = 0; i < 8; i++) {
        const cx = R + (rng() - 0.5) * R * 1.5;
        const cy = R + (rng() - 0.5) * R * 1.5;
        const cr = 20 + rng() * 40;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.35 + rng() * 0.25})`;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Gas bands cloud textures (Venus, Jupiter, Saturn)
      // Soft swirling wind streaks on a translucent plane
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.12 + rng() * 0.15})`;
        ctx.beginPath();
        ctx.ellipse(cx, 30 + i * (R * 0.3), R * 0.85, 8 + rng() * 12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private static drawShadow(ctx: CanvasRenderingContext2D, R: number): void {
    const size = R * 2;

    ctx.save();
    // Clip to sphere circle
    ctx.beginPath();
    ctx.arc(R, R, R, 0, Math.PI * 2);
    ctx.clip();

    // Directional light from Top-Left (0,0) to Bottom-Right (size, size)
    const gradient = ctx.createLinearGradient(0, 0, size * 0.85, size * 0.85);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');        // Fully illuminated
    gradient.addColorStop(0.35, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.45)');   // Terminator line
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.85)');    // Pitch dark side

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();
  }

  private static drawGlow(ctx: CanvasRenderingContext2D, def: PlanetDefinition, R: number, margin: number): void {
    const center = R + margin;

    ctx.save();
    const gradient = ctx.createRadialGradient(center, center, R - 4, center, center, R + margin);
    
    // Atmospheric glow
    if (def.glowColor) {
      gradient.addColorStop(0, def.glowColor);
      gradient.addColorStop(0.3, def.glowColor);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(center, center, R + margin, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private static drawRings(ctx: CanvasRenderingContext2D, R: number, w: number, h: number): void {
    const cx = w / 2;
    const cy = h / 2;

    ctx.save();
    // Skew vertically to form a 2.5D ring plane
    ctx.scale(1, 0.35);

    // Draw concentric ring bands
    const outerRadius = R * 2.1;
    const innerRadius = R * 1.25;

    // Linear gradient along diagonal of ring structure
    const ringGradient = ctx.createLinearGradient(0, 0, w, h);
    ringGradient.addColorStop(0, 'rgba(217, 119, 6, 0.7)');  // Saturn Gold
    ringGradient.addColorStop(0.35, 'rgba(245, 158, 11, 0.8)');
    ringGradient.addColorStop(0.5, 'rgba(180, 83, 9, 0.45)');  // Cassini Division
    ringGradient.addColorStop(0.65, 'rgba(251, 191, 36, 0.75)');
    ringGradient.addColorStop(1, 'rgba(120, 53, 4, 0.5)');

    // Draw outer path
    ctx.fillStyle = ringGradient;
    ctx.beginPath();
    ctx.arc(cx, cy / 0.35, outerRadius, 0, Math.PI * 2);
    ctx.arc(cx, cy / 0.35, innerRadius, 0, Math.PI * 2, true); // counter-clockwise cuts holes
    ctx.fill();

    // Dark Cassini division ring separator lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy / 0.35, R * 1.6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  private static createRng(seed: number): () => number {
    let s = seed;
    return () => {
      const x = Math.sin(s++) * 10000;
      return x - Math.floor(x);
    };
  }
}
