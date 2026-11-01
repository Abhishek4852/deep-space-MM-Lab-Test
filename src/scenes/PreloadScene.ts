import { BaseScene } from './BaseScene';
import { SceneKeys } from '@/core/SceneKeys';
import { AssetKeys } from '@/core/AssetKeys';
import { GAME_WIDTH, GAME_HEIGHT } from '@/core/Constants';
import { ShipFactory } from '@/utils/ShipFactory';

export class PreloadScene extends BaseScene {
  constructor() {
    super(SceneKeys.PRELOAD);
  }

  preload(): void {
    // Create loading interface layout
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1e293b, 0.8); // Slate-800 background
    progressBox.fillRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 15, 320, 30);

    const loadingText = this.make.text({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 - 50,
      text: 'LOADING...',
      style: {
        font: '20px "Courier New", Courier, monospace',
        color: '#f8fafc' // Slate-50
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 + 35,
      text: '0%',
      style: {
        font: '18px "Courier New", Courier, monospace',
        color: '#94a3b8' // Slate-400
      }
    });
    percentText.setOrigin(0.5, 0.5);

    // Update loader graphics on progress events
    this.load.on('progress', (value: number) => {
      percentText.setText(`${Math.floor(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0x38bdf8, 1); // Sky-400 loader bar
      progressBar.fillRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 10, 300 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });
  }

  create(): void {
    // Generate dynamic assets prior to entering the game loop
    this.generateTextures();

    // Smooth fade out transition to Menu Scene
    this.transitionTo(SceneKeys.MENU, 600);
  }

  private generateTextures(): void {
    // Generate ships using ShipFactory
    ShipFactory.createPlayerShip(this);
    ShipFactory.createEngineFlameTexture(this);
    ShipFactory.createEnemyScout(this);
    ShipFactory.createEnemyElite(this);
    ShipFactory.createBossShip(this);

    // Generate a simple glowing bullet texture (horizontal laser capsule pointing right)
    const bulletGraphics = this.make.graphics();
    bulletGraphics.fillStyle(0x38bdf8, 0.4); // Outer cyan glow
    bulletGraphics.fillRoundedRect(0, 0, 16, 6, 2);
    bulletGraphics.fillStyle(0xffffff, 1); // Inner solid core
    bulletGraphics.fillRoundedRect(2, 1.5, 12, 3, 1);
    bulletGraphics.generateTexture(AssetKeys.BULLET, 16, 6);
    bulletGraphics.destroy();

    // 2. Plasma Shotgun Pellet Texture (Glowing violet/magenta plasma orb)
    const shotgunG = this.make.graphics();
    shotgunG.fillStyle(0xc084fc, 0.45); // Outer magenta aura
    shotgunG.fillCircle(7, 7, 7);
    shotgunG.fillStyle(0x9333ea, 0.9); // Inner violet plasma
    shotgunG.fillCircle(7, 7, 4.5);
    shotgunG.fillStyle(0xffffff, 1); // White hot center
    shotgunG.fillCircle(7, 7, 2);
    shotgunG.generateTexture(AssetKeys.PROJECTILE_SHOTGUN, 14, 14);
    shotgunG.destroy();

    // 3. Homing Missile Texture (Sleek micro-rocket with red warhead)
    const missileG = this.make.graphics();
    // Fins
    missileG.fillStyle(0x64748b, 1);
    missileG.fillRect(2, 0, 4, 10);
    // Fuselage
    missileG.fillStyle(0x334155, 1);
    missileG.fillRoundedRect(3, 2, 12, 6, 1);
    // Warhead (Nose cone)
    missileG.fillStyle(0xef4444, 1);
    missileG.beginPath();
    missileG.moveTo(15, 2);
    missileG.lineTo(21, 5);
    missileG.lineTo(15, 8);
    missileG.closePath();
    missileG.fillPath();
    // Engine glow
    missileG.fillStyle(0xf59e0b, 1);
    missileG.fillCircle(2, 5, 2);
    missileG.generateTexture(AssetKeys.PROJECTILE_MISSILE, 22, 10);
    missileG.destroy();

    // 4. Laser Beam Texture (Long vibrant penetrating emerald ray)
    const laserG = this.make.graphics();
    laserG.fillStyle(0x10b981, 0.45); // Outer emerald glow
    laserG.fillRoundedRect(0, 0, 36, 6, 3);
    laserG.fillStyle(0x34d399, 0.9); // Mint laser filament
    laserG.fillRoundedRect(2, 1, 32, 4, 2);
    laserG.fillStyle(0xffffff, 1); // Pure white core
    laserG.fillRoundedRect(4, 2, 28, 2, 1);
    laserG.generateTexture(AssetKeys.PROJECTILE_LASER, 36, 6);
    laserG.destroy();

    // 5. Lightning Arc / EMP Texture (Electric blue & gold spark orb)
    const lightningG = this.make.graphics();
    lightningG.fillStyle(0x38bdf8, 0.4); // Electric blue aura
    lightningG.fillCircle(8, 8, 8);
    lightningG.fillStyle(0xfacc15, 0.9); // Golden electrical core
    lightningG.fillCircle(8, 8, 5);
    lightningG.fillStyle(0xffffff, 1); // White spark
    lightningG.fillCircle(8, 8, 2.5);
    lightningG.generateTexture(AssetKeys.PROJECTILE_LIGHTNING, 16, 16);
    lightningG.destroy();

    // 1. Health Pack power-up texture (Green cross inside dark Slate backing)
    const healthPU = this.make.graphics();
    healthPU.fillStyle(0x1e293b, 1);
    healthPU.lineStyle(2, 0x22c55e, 1);
    healthPU.fillCircle(16, 16, 14);
    healthPU.strokeCircle(16, 16, 14);
    healthPU.fillStyle(0x22c55e, 1);
    healthPU.fillRect(13, 6, 6, 20);
    healthPU.fillRect(6, 13, 20, 6);
    healthPU.generateTexture('powerup_health', 32, 32);

    // 2. Rapid Fire power-up texture (Yellow lightning bolt)
    const rapidPU = this.make.graphics();
    rapidPU.fillStyle(0x1e293b, 1);
    rapidPU.lineStyle(2, 0xeab308, 1);
    rapidPU.fillCircle(16, 16, 14);
    rapidPU.strokeCircle(16, 16, 14);
    rapidPU.fillStyle(0xeab308, 1);
    rapidPU.beginPath();
    rapidPU.moveTo(17, 5);
    rapidPU.lineTo(25, 14);
    rapidPU.lineTo(19, 14);
    rapidPU.lineTo(23, 27);
    rapidPU.lineTo(11, 16);
    rapidPU.lineTo(17, 16);
    rapidPU.closePath();
    rapidPU.fillPath();
    rapidPU.generateTexture('powerup_rapid', 32, 32);

    // 3. Damage Boost power-up texture (Crimson double chevrons)
    const damagePU = this.make.graphics();
    damagePU.fillStyle(0x1e293b, 1);
    damagePU.lineStyle(2, 0xef4444, 1);
    damagePU.fillCircle(16, 16, 14);
    damagePU.strokeCircle(16, 16, 14);
    damagePU.fillStyle(0xef4444, 1);
    damagePU.beginPath();
    // Chevron 1
    damagePU.moveTo(16, 6);
    damagePU.lineTo(8, 14);
    damagePU.lineTo(12, 14);
    damagePU.lineTo(16, 10);
    damagePU.lineTo(20, 14);
    damagePU.lineTo(24, 14);
    damagePU.closePath();
    // Chevron 2
    damagePU.moveTo(16, 15);
    damagePU.lineTo(8, 23);
    damagePU.lineTo(12, 23);
    damagePU.lineTo(16, 19);
    damagePU.lineTo(20, 23);
    damagePU.lineTo(24, 23);
    damagePU.closePath();
    damagePU.fillPath();
    damagePU.generateTexture('powerup_damage', 32, 32);

    // 4. Speed Boost power-up texture (Cyan double right chevrons)
    const speedPU = this.make.graphics();
    speedPU.fillStyle(0x1e293b, 1);
    speedPU.lineStyle(2, 0x06b6d4, 1);
    speedPU.fillCircle(16, 16, 14);
    speedPU.strokeCircle(16, 16, 14);
    speedPU.fillStyle(0x06b6d4, 1);
    speedPU.beginPath();
    // Chevron 1
    speedPU.moveTo(26, 16);
    speedPU.lineTo(18, 8);
    speedPU.lineTo(18, 12);
    speedPU.lineTo(22, 16);
    speedPU.lineTo(18, 20);
    speedPU.lineTo(18, 24);
    speedPU.closePath();
    // Chevron 2
    speedPU.moveTo(17, 16);
    speedPU.lineTo(9, 8);
    speedPU.lineTo(9, 12);
    speedPU.lineTo(13, 16);
    speedPU.lineTo(9, 20);
    speedPU.lineTo(9, 24);
    speedPU.closePath();
    speedPU.fillPath();
    speedPU.generateTexture('powerup_speed', 32, 32);

    // 5. Shield power-up texture (Blue shield crest)
    const shieldPU = this.make.graphics();
    shieldPU.fillStyle(0x1e293b, 1);
    shieldPU.lineStyle(2, 0x3b82f6, 1);
    shieldPU.fillCircle(16, 16, 14);
    shieldPU.strokeCircle(16, 16, 14);
    shieldPU.fillStyle(0x3b82f6, 1);
    shieldPU.beginPath();
    shieldPU.moveTo(16, 7);
    shieldPU.lineTo(24, 10);
    shieldPU.lineTo(24, 18);
    shieldPU.lineTo(16, 25);
    shieldPU.lineTo(8, 18);
    shieldPU.lineTo(8, 10);
    shieldPU.closePath();
    shieldPU.fillPath();
    shieldPU.generateTexture('powerup_shield', 32, 32);
  }
}
