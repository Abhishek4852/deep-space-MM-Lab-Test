import Phaser from 'phaser';
import { Boss } from './Boss';

export class AncientCore extends Boss {
  private shockwaveTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Ancient Core: ID 'core', Name, HP 10000
    super(scene, x, y, 'core', 'ANCIENT MECHANICAL CORE', 10000);

    const coreSprite = scene.add.image(0, 0, 'boss_core');
    this.add(coreSprite);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(110, 110);
    body.setOffset(-55, -55);

    this.setDepth(-10);
  }

  public update(_time: number, delta: number): void {
    if (this.isDead) return;

    // Core stays relatively stationary or drifts very slowly
    if (this.target && this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target.x, this.target.y);
      this.rotation += 0.005; // Spooky slow self rotation

      this.scene.physics.velocityFromRotation(angle, this.speed * 0.5, body.velocity);
    }

    // Shockwave pulses
    this.shockwaveTimer += delta;
    if (this.shockwaveTimer >= 5000) {
      this.shockwaveTimer = 0;
      this.releasePlaceholderShockwave();
    }
  }

  protected restoreOriginalColors(): void {
    // Placeholder clean
  }

  protected checkPhaseThresholds(): void {
    const pct = this.health / this.maxHealth;
    if (pct <= 0.5 && this.activePhase < 2) {
      this.activePhase = 2;
      this.scene.events.emit('boss-phase-change', 2, this);
    }
  }

  private releasePlaceholderShockwave(): void {
    // Spawns visual shockwave expanding outwards
    const wave = this.scene.add.graphics();
    wave.lineStyle(2.5, 0xec4899, 0.7); // Pink ring
    wave.strokeCircle(this.x, this.y, 10);

    const maxRadius = 250;

    this.scene.tweens.add({
      targets: wave,
      scaleX: maxRadius / 10,
      scaleY: maxRadius / 10,
      alpha: 0,
      duration: 1000,
      onUpdate: () => {
        const radius = wave.scaleX * 10;
        const player = this.target as unknown as { x: number; y: number; takeDamage: (d: number) => void; getIsDead: () => boolean };
        if (player && !player.getIsDead()) {
          const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
          if (Math.abs(dist - radius) < 12) {
            player.takeDamage(20);
          }
        }
      },
      onComplete: () => wave.destroy()
    });
  }
}
