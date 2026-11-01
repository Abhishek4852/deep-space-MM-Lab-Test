import Phaser from 'phaser';
import { AssetKeys } from '@/core/AssetKeys';

/**
 * ShipFactory — Generates all spaceship textures procedurally using Phaser Graphics.
 * Exposes methods to create players, scouts, elites, and boss ships.
 */
export class ShipFactory {

  /**
   * Generates the premium player interceptor spaceship texture.
   * Dimensions: 80x60 (15% larger than original 64x48)
   */
  public static createPlayerShip(scene: Phaser.Scene): string {
    const key = AssetKeys.PLAYER;
    if (scene.textures.exists(key)) return key;

    const w = 80;
    const h = 60;
    const cy = h / 2; // 30
    const graphics = scene.make.graphics();

    // --- Layer 1: Dark Hull Shadow/Outline (Thick Navy outline) ---
    graphics.fillStyle(0x0a1128, 1);
    graphics.beginPath();
    graphics.moveTo(74, cy);       // nose tip
    graphics.lineTo(46, cy - 12);  // top nose ridge
    graphics.lineTo(26, cy - 12);  // canopy base
    graphics.lineTo(12, cy - 26);  // top wing tip
    graphics.lineTo(18, cy - 6);   // top trailing wing
    graphics.lineTo(4, cy - 6);    // top rear tail fin
    graphics.lineTo(8, cy);        // rear exhaust center
    graphics.lineTo(4, cy + 6);    // bottom rear tail fin
    graphics.lineTo(18, cy + 6);   // bottom trailing wing
    graphics.lineTo(12, cy + 26);  // bottom wing tip
    graphics.lineTo(26, cy + 12);  // canopy base
    graphics.lineTo(46, cy + 12);  // bottom nose ridge
    graphics.closePath();
    graphics.fillPath();

    // --- Layer 2: Main Body (Electric Blue) ---
    graphics.fillStyle(0x0088ff, 1); // Sky blue base
    graphics.beginPath();
    graphics.moveTo(71, cy);
    graphics.lineTo(45, cy - 10);
    graphics.lineTo(26, cy - 10);
    graphics.lineTo(14, cy - 24);
    graphics.lineTo(19, cy - 5);
    graphics.lineTo(6, cy - 5);
    graphics.lineTo(9, cy);
    graphics.lineTo(6, cy + 5);
    graphics.lineTo(19, cy + 5);
    graphics.lineTo(14, cy + 24);
    graphics.lineTo(26, cy + 10);
    graphics.lineTo(45, cy + 10);
    graphics.closePath();
    graphics.fillPath();

    // --- Layer 3: Light Blue Highlights/Lighting ---
    graphics.fillStyle(0x38bdf8, 1); // Bright cyan/light blue
    // Top wing panel highlight
    graphics.beginPath();
    graphics.moveTo(35, cy - 10);
    graphics.lineTo(18, cy - 22);
    graphics.lineTo(21, cy - 8);
    graphics.closePath();
    graphics.fillPath();

    // Bottom wing panel highlight
    graphics.fillStyle(0x0284c7, 1); // Darker blue shadow for bottom wings
    graphics.beginPath();
    graphics.moveTo(35, cy + 10);
    graphics.lineTo(18, cy + 22);
    graphics.lineTo(21, cy + 8);
    graphics.closePath();
    graphics.fillPath();

    // Top nose panel highlight
    graphics.fillStyle(0x7dd3fc, 1); // Very bright highlight
    graphics.beginPath();
    graphics.moveTo(71, cy);
    graphics.lineTo(45, cy - 10);
    graphics.lineTo(45, cy);
    graphics.closePath();
    graphics.fillPath();

    // --- Layer 4: Engine Exhaust Nozzle ---
    graphics.fillStyle(0x475569, 1);
    graphics.fillRoundedRect(5, cy - 4, 6, 8, 2);

    // --- Layer 5: Cockpit Canopy (Rounded Glass) ---
    // Background glass color (Cyan-400)
    graphics.fillStyle(0x22d3ee, 1);
    graphics.beginPath();
    graphics.moveTo(42, cy);
    graphics.lineTo(28, cy - 6);
    graphics.lineTo(22, cy);
    graphics.lineTo(28, cy + 6);
    graphics.closePath();
    graphics.fillPath();

    // Glass reflection white highlight
    graphics.fillStyle(0xffffff, 0.85);
    graphics.beginPath();
    graphics.moveTo(38, cy - 2);
    graphics.lineTo(32, cy - 4);
    graphics.lineTo(28, cy - 2);
    graphics.closePath();
    graphics.fillPath();

    // Finalize player ship texture
    graphics.generateTexture(key, w, h);
    graphics.destroy();

    return key;
  }

  /**
   * Generates the red Scout spaceship texture.
   * Dimensions: 48x40
   */
  public static createEnemyScout(scene: Phaser.Scene): string {
    const key = AssetKeys.ENEMY;
    if (scene.textures.exists(key)) return key;

    const w = 48;
    const h = 40;
    const cy = h / 2; // 20
    const graphics = scene.make.graphics();

    // Outer Shadow / Border
    graphics.fillStyle(0x450a0a, 1); // Dark red border
    graphics.beginPath();
    graphics.moveTo(44, cy);
    graphics.lineTo(14, cy - 16);
    graphics.lineTo(18, cy - 4);
    graphics.lineTo(6, cy - 4);
    graphics.lineTo(8, cy);
    graphics.lineTo(6, cy + 4);
    graphics.lineTo(18, cy + 4);
    graphics.lineTo(14, cy + 16);
    graphics.closePath();
    graphics.fillPath();

    // Main Body (Red Crimson)
    graphics.fillStyle(0xef4444, 1);
    graphics.beginPath();
    graphics.moveTo(41, cy);
    graphics.lineTo(15, cy - 14);
    graphics.lineTo(18, cy - 3);
    graphics.lineTo(7, cy - 3);
    graphics.lineTo(9, cy);
    graphics.lineTo(7, cy + 3);
    graphics.lineTo(18, cy + 3);
    graphics.lineTo(15, cy + 14);
    graphics.closePath();
    graphics.fillPath();

    // Yellow Core highlight
    graphics.fillStyle(0xf59e0b, 1);
    graphics.beginPath();
    graphics.moveTo(35, cy);
    graphics.lineTo(22, cy - 4);
    graphics.lineTo(18, cy);
    graphics.lineTo(22, cy + 4);
    graphics.closePath();
    graphics.fillPath();

    // Cockpit
    graphics.fillStyle(0x1e293b, 1);
    graphics.fillCircle(25, cy, 3);

    graphics.generateTexture(key, w, h);
    graphics.destroy();

    return key;
  }

  /**
   * Generates the gold/orange Elite spaceship texture.
   * Dimensions: 56x46
   */
  public static createEnemyElite(scene: Phaser.Scene): string {
    const key = 'enemy_elite';
    if (scene.textures.exists(key)) return key;

    const w = 56;
    const h = 46;
    const cy = h / 2; // 23
    const graphics = scene.make.graphics();

    // Shadow
    graphics.fillStyle(0x2d1a00, 1);
    graphics.beginPath();
    graphics.moveTo(52, cy);
    graphics.lineTo(22, cy - 18);
    graphics.lineTo(28, cy - 6);
    graphics.lineTo(8, cy - 10);
    graphics.lineTo(12, cy);
    graphics.lineTo(8, cy + 10);
    graphics.lineTo(28, cy + 6);
    graphics.lineTo(22, cy + 18);
    graphics.closePath();
    graphics.fillPath();

    // Body (Gold Yellow-600)
    graphics.fillStyle(0xd97706, 1);
    graphics.beginPath();
    graphics.moveTo(49, cy);
    graphics.lineTo(23, cy - 16);
    graphics.lineTo(28, cy - 5);
    graphics.lineTo(9, cy - 8);
    graphics.lineTo(13, cy);
    graphics.lineTo(9, cy + 8);
    graphics.lineTo(28, cy + 5);
    graphics.lineTo(23, cy + 16);
    graphics.closePath();
    graphics.fillPath();

    // Orange highlights
    graphics.fillStyle(0xea580c, 1);
    graphics.beginPath();
    graphics.moveTo(42, cy);
    graphics.lineTo(26, cy - 8);
    graphics.lineTo(26, cy + 8);
    graphics.closePath();
    graphics.fillPath();

    // Cockpit glass (Cyan-400)
    graphics.fillStyle(0x06b6d4, 1);
    graphics.fillCircle(33, cy, 4);

    graphics.generateTexture(key, w, h);
    graphics.destroy();

    return key;
  }

  /**
   * Generates the huge heavy Boss battleship texture.
   * Dimensions: 96x80
   */
  public static createBossShip(scene: Phaser.Scene): string {
    const key = 'enemy_boss';
    if (scene.textures.exists(key)) return key;

    const w = 96;
    const h = 80;
    const cy = h / 2; // 40
    const graphics = scene.make.graphics();

    // Shadow Outline (Slate-950)
    graphics.fillStyle(0x020617, 1);
    graphics.beginPath();
    graphics.moveTo(92, cy);
    graphics.lineTo(52, cy - 28);
    graphics.lineTo(32, cy - 38);
    graphics.lineTo(36, cy - 14);
    graphics.lineTo(12, cy - 18);
    graphics.lineTo(16, cy);
    graphics.lineTo(12, cy + 18);
    graphics.lineTo(36, cy + 14);
    graphics.lineTo(32, cy + 38);
    graphics.lineTo(52, cy + 28);
    graphics.closePath();
    graphics.fillPath();

    // Heavy Plating (Slate-700)
    graphics.fillStyle(0x334155, 1);
    graphics.beginPath();
    graphics.moveTo(88, cy);
    graphics.lineTo(50, cy - 26);
    graphics.lineTo(34, cy - 36);
    graphics.lineTo(36, cy - 12);
    graphics.lineTo(14, cy - 16);
    graphics.lineTo(17, cy);
    graphics.lineTo(14, cy + 16);
    graphics.lineTo(36, cy + 12);
    graphics.lineTo(34, cy + 36);
    graphics.lineTo(50, cy + 26);
    graphics.closePath();
    graphics.fillPath();

    // Inner Armor Highlights (Crimson-500)
    graphics.fillStyle(0xef4444, 1);
    graphics.beginPath();
    graphics.moveTo(76, cy);
    graphics.lineTo(50, cy - 16);
    graphics.lineTo(36, cy - 16);
    graphics.lineTo(44, cy);
    graphics.lineTo(36, cy + 16);
    graphics.lineTo(50, cy + 16);
    graphics.closePath();
    graphics.fillPath();

    // Dark grey mechanical deck
    graphics.fillStyle(0x1e293b, 1);
    graphics.fillRect(40, cy - 8, 16, 16);

    // Glowing Bridge Cockpit (Neon Yellow)
    graphics.fillStyle(0xfacc15, 1);
    graphics.fillCircle(62, cy, 6);

    graphics.generateTexture(key, w, h);
    graphics.destroy();

    return key;
  }

  /**
   * Generates the engine flame texture to be layered dynamically behind the player ship.
   * Dimensions: 32x24
   */
  public static createEngineFlameTexture(scene: Phaser.Scene): string {
    const key = 'engine_flame';
    if (scene.textures.exists(key)) return key;

    const w = 32;
    const h = 24;
    const cy = h / 2; // 12
    const graphics = scene.make.graphics();

    // Outer glow (Alpha yellow)
    graphics.fillStyle(0xeab308, 0.4);
    graphics.beginPath();
    graphics.moveTo(30, cy);
    graphics.lineTo(4, cy - 10);
    graphics.lineTo(0, cy);
    graphics.lineTo(4, cy + 10);
    graphics.closePath();
    graphics.fillPath();

    // Inner solid core (Bright orange-red)
    graphics.fillStyle(0xff5500, 1);
    graphics.beginPath();
    graphics.moveTo(24, cy);
    graphics.lineTo(8, cy - 6);
    graphics.lineTo(4, cy);
    graphics.lineTo(8, cy + 6);
    graphics.closePath();
    graphics.fillPath();

    // Core heat white highlight
    graphics.fillStyle(0xffffff, 0.9);
    graphics.fillCircle(10, cy, 3);

    graphics.generateTexture(key, w, h);
    graphics.destroy();

    return key;
  }
}
