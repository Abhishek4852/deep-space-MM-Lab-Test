import Phaser from 'phaser';
import { Boss } from './Boss';
import { ProjectileType } from '@/enemies/EnemyProjectile';
import { EnemyType } from '@/enemies/EnemyTypes';
import { ENEMY_DEFINITIONS } from '@/enemies/EnemyDefinitions';
import { GAME_EVENTS } from '@/core/Constants';

export class PlanetGuardian extends Boss {
  private shieldGraphics: Phaser.GameObjects.Graphics;
  private shieldAngle = 0;
  private shieldSpeed = 1.2; // rad/s
  private isShieldActive = false;

  // Attack timers
  private missileTimer = 0;
  private droneTimer = 0;
  private laserTimer = 0;
  private shockwaveTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Planet Guardian: ID 'guardian', Name, HP 5000
    super(scene, x, y, 'guardian', 'PLANET GUARDIAN', 5000);

    // 1. Add procedural battlestation sprite
    const coreSprite = scene.add.image(0, 0, 'boss_guardian');
    this.add(coreSprite);

    // 2. Add rotating shield graphics child
    this.shieldGraphics = scene.add.graphics();
    this.add(this.shieldGraphics);

    // Configure larger physical body size
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(140, 140);
    body.setOffset(-70, -70);
    body.setMass(100);

    this.setDepth(-10); // Placed above background stars
  }

  public update(_time: number, delta: number): void {
    if (this.isDead) return;

    const dt = delta; // ms
    const dtSec = delta / 1000;

    // Rotate shield
    this.shieldAngle += this.shieldSpeed * dtSec;
    this.drawShield();

    // Soft homing movement towards player
    if (this.target && this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
      this.rotation = angle; // Face the player

      // Move slightly faster in Phase 3
      const currentSpeed = this.activePhase === 3 ? this.speed * 1.3 : this.speed;
      this.scene.physics.velocityFromRotation(angle, currentSpeed, body.velocity);
    }

    // --- Execute Phase Attack Patterns ---
    this.missileTimer += dt;
    if (this.missileTimer >= 4000) {
      this.missileTimer = 0;
      this.fireMissileBarrage();
    }

    if (this.activePhase >= 2) {
      this.droneTimer += dt;
      if (this.droneTimer >= 8000) {
        this.droneTimer = 0;
        this.spawnGuardDrones();
      }
    }

    if (this.activePhase === 3) {
      this.laserTimer += dt;
      if (this.laserTimer >= 10000) {
        this.laserTimer = 0;
        this.fireLaserSweep();
      }

      this.shockwaveTimer += dt;
      if (this.shockwaveTimer >= 6000) {
        this.shockwaveTimer = 0;
        this.releaseShockwave();
      }
    }
  }

  /**
   * Overridden takeDamage checking rotating shield block angles in Phase 2 & 3.
   */
  public takeDamageWithAngle(amount: number, impactAngle: number): void {
    if (this.isDead) return;

    if (this.isShieldActive) {
      // Calculate relative impact angle against current shield angle
      const diff = Phaser.Math.Angle.Wrap(impactAngle - this.shieldAngle);
      // Shield spans 100 degrees total (Math.PI / 1.8)
      if (Math.abs(diff) < Math.PI / 3.6) {
        // Blocked! Spark effect and no damage
        this.triggerShieldBlockFlash();
        return;
      }
    }

    super.takeDamage(amount);
  }

  protected restoreOriginalColors(): void {
    // Custom tints aren't used on core sprite, just clear
  }

  protected checkPhaseThresholds(): void {
    const pct = this.health / this.maxHealth;

    if (pct <= 0.3 && this.activePhase < 3) {
      this.activePhase = 3;
      this.isShieldActive = true;
      this.shieldSpeed = 2.0; // Rotate shield much faster
      this.scene.events.emit('boss-phase-change', 3, this);
    } else if (pct <= 0.7 && this.activePhase < 2) {
      this.activePhase = 2;
      this.isShieldActive = true;
      this.scene.events.emit('boss-phase-change', 2, this);
    }
  }

  private drawShield(): void {
    this.shieldGraphics.clear();
    if (!this.isShieldActive) return;

    // Draw rotating cyan forcefield arc
    this.shieldGraphics.lineStyle(6, 0x06b6d4, 0.75); // sky blue arc
    // Radius 95px (slightly larger than core)
    this.shieldGraphics.beginPath();
    this.shieldGraphics.arc(
      0, 0, 95, 
      this.shieldAngle - Math.PI / 3.6, 
      this.shieldAngle + Math.PI / 3.6
    );
    this.shieldGraphics.strokePath();
  }

  private fireMissileBarrage(): void {
    if (!this.target) return;

    // Fire 3 homing missiles from sides
    const angles = [-Math.PI / 4, 0, Math.PI / 4];
    angles.forEach((offset) => {
      const spawnAngle = this.rotation + offset;
      const sx = this.x + Math.cos(spawnAngle) * 60;
      const sy = this.y + Math.sin(spawnAngle) * 60;

      this.scene.events.emit('enemy-projectile-spawn', {
        x: sx,
        y: sy,
        angle: spawnAngle,
        type: ProjectileType.MISSILE,
        damage: 25,
        target: this.target
      });
    });
  }

  private spawnGuardDrones(): void {
    // Spawns 2 swarm drones flanking the guardian
    const leftAngle = this.rotation - Math.PI / 2;
    const rightAngle = this.rotation + Math.PI / 2;

    const spawnList = [
      { x: this.x + Math.cos(leftAngle) * 90, y: this.y + Math.sin(leftAngle) * 90 },
      { x: this.x + Math.cos(rightAngle) * 90, y: this.y + Math.sin(rightAngle) * 90 }
    ];

    spawnList.forEach((pos) => {
      this.scene.events.emit(GAME_EVENTS.ENEMY_SPAWN_REQUEST, {
        x: pos.x,
        y: pos.y,
        stats: ENEMY_DEFINITIONS[EnemyType.SWARM]
      });
    });
  }

  private fireLaserSweep(): void {
    if (!this.target) return;

    // Charge a sweeping warning laser red line
    const warning = this.scene.add.graphics().setDepth(-5);
    let elapsed = 0;
    const duration = 1200;

    const sweepTimer = this.scene.time.addEvent({
      delay: 16,
      repeat: Math.floor(duration / 16),
      callback: () => {
        if (!this.active || !this.target) {
          warning.destroy();
          sweepTimer.destroy();
          return;
        }

        elapsed += 16;
        warning.clear();

        const pct = elapsed / duration;
        const color = pct > 0.85 ? 0xef4444 : 0xf97316; // Turns red right before fire
        warning.lineStyle(2.0 + pct * 2.0, color, 0.4 + pct * 0.5);
        warning.lineBetween(this.x, this.y, this.target.x, this.target.y);

        if (elapsed >= duration) {
          warning.destroy();
          this.executeLaserBeam();
        }
      }
    });
  }

  private executeLaserBeam(): void {
    if (!this.target) return;

    // Fire thick energy beam dealing instant damage if intersecting player
    const beamAngle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
    const laserBeam = this.scene.add.graphics().setDepth(-4);

    laserBeam.lineStyle(16, 0xffffff, 0.95);
    laserBeam.strokeLineShape(new Phaser.Geom.Line(
      this.x, this.y, 
      this.x + Math.cos(beamAngle) * 1500, 
      this.y + Math.sin(beamAngle) * 1500
    ));

    // Intersection damage check (line vs player bounding circle)
    const player = this.target as unknown as { x: number; y: number; takeDamage: (d: number) => void; getIsDead: () => boolean };
    const line = new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(beamAngle) * 1500, this.y + Math.sin(beamAngle) * 1500);
    const circle = new Phaser.Geom.Circle(player.x, player.y, 25);
    
    if (Phaser.Geom.Intersects.LineToCircle(line, circle) && !player.getIsDead()) {
      player.takeDamage(45); // Heavy laser sweep damage
      this.scene.events.emit('player-hit-custom');
    }

    // Fade out laser beam graphic
    this.scene.tweens.add({
      targets: laserBeam,
      alpha: 0,
      duration: 300,
      onComplete: () => laserBeam.destroy()
    });
  }

  private releaseShockwave(): void {
    // Release expanding circular shockwave pushing player away
    const wave = this.scene.add.graphics();
    wave.lineStyle(3, 0x06b6d4, 0.8);
    wave.strokeCircle(this.x, this.y, 10);

    const maxRadius = 350;

    this.scene.tweens.add({
      targets: wave,
      scaleX: maxRadius / 10,
      scaleY: maxRadius / 10,
      alpha: 0,
      duration: 800,
      onUpdate: () => {
        const radius = wave.scaleX * 10;
        const player = this.target as unknown as { x: number; y: number; body: Phaser.Physics.Arcade.Body };
        if (player && player.body) {
          const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
          // Push player back if crossing shockwave boundary
          if (Math.abs(dist - radius) < 15) {
            const pushAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            player.body.setVelocity(
              Math.cos(pushAngle) * 450, 
              Math.sin(pushAngle) * 450
            );
          }
        }
      },
      onComplete: () => wave.destroy()
    });
  }

  private triggerShieldBlockFlash(): void {
    // Flash shield graphic bright white momentarily
    this.shieldGraphics.clear();
    this.shieldGraphics.lineStyle(9, 0xffffff, 1.0);
    this.shieldGraphics.beginPath();
    this.shieldGraphics.arc(
      0, 0, 95, 
      this.shieldAngle - Math.PI / 3.6, 
      this.shieldAngle + Math.PI / 3.6
    );
    this.shieldGraphics.strokePath();

    this.scene.time.delayedCall(80, () => {
      this.drawShield();
    });
  }
}
