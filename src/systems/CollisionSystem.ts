import Phaser from 'phaser';
import { Player } from '@/entities/Player';
import { Bullet } from '@/entities/Bullet';
import { Enemy } from '@/enemies/Enemy';
import { GAME_EVENTS } from '@/core/Constants';
import { audioManager } from '@/audio/AudioManager';

type PhysicsObject =
  | Phaser.Types.Physics.Arcade.GameObjectWithBody
  | Phaser.Physics.Arcade.Body
  | Phaser.Physics.Arcade.StaticBody
  | Phaser.Tilemaps.Tile;

export class CollisionSystem {
  private scene: Phaser.Scene;
  private player: Player;
  private bulletGroup: Phaser.Physics.Arcade.Group;
  private enemyGroup: Phaser.Physics.Arcade.Group;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    bulletGroup: Phaser.Physics.Arcade.Group,
    enemyGroup: Phaser.Physics.Arcade.Group
  ) {
    this.scene = scene;
    this.player = player;
    this.bulletGroup = bulletGroup;
    this.enemyGroup = enemyGroup;

    // Set up collision physics overlaps
    this.setupOverlaps();
  }

  /**
   * Registers physical overlaps inside Phaser's Arcade Physics engine.
   */
  private setupOverlaps(): void {
    // 1. Bullets intersecting with Enemies
    this.scene.physics.add.overlap(
      this.bulletGroup,
      this.enemyGroup,
      this.handleBulletEnemyOverlap,
      undefined,
      this
    );

    // 2. Enemies colliding directly with the Player ship
    this.scene.physics.add.overlap(
      this.player,
      this.enemyGroup,
      this.handleEnemyPlayerOverlap,
      this.checkPlayerCollisionActive,
      this
    );
  }

  /**
   * Safety filter callback to prevent collisions registering if the player is dead.
   */
  private checkPlayerCollisionActive(): boolean {
    return !this.player.getIsDead();
  }

  /**
   * Processes overlapping bullets and enemy instances, deducting health and emitting hit events.
   */
  private handleBulletEnemyOverlap(bulletObj: PhysicsObject, enemyObj: PhysicsObject): void {
    const bullet = bulletObj as Bullet;
    const enemy = enemyObj as Enemy;

    // Fast reject if either projectile or entity is already inactive
    if (!bullet.active || !enemy.active) return;

    // Process specialized weapon hit logic (piercing, explosive, lightning, or direct impact)
    const hitRegistered = bullet.handleHit(enemy);
    if (!hitRegistered) return;

    // Apply damage to enemy
    enemy.takeDamage(bullet.getDamage());

    // Play crisp impact audio feedback
    audioManager.playEnemyHit();

    // Emit decoupled event to allow scoring and graphics systems to process hits
    this.scene.events.emit(GAME_EVENTS.BULLET_HIT, bullet, enemy);
  }

  /**
   * Processes collision of an enemy crashing into the player, damaging the player and destroying the enemy.
   */
  private handleEnemyPlayerOverlap(playerObj: PhysicsObject, enemyObj: PhysicsObject): void {
    const player = playerObj as Player;
    const enemy = enemyObj as Enemy;

    // Fast reject if either player or enemy is inactive
    if (player.getIsDead() || !enemy.active) return;

    // 1. Inflict damage onto player
    player.takeDamage(enemy.getDamageValue());

    // 2. Emit damage notification event for screen tinting
    this.scene.events.emit(GAME_EVENTS.PLAYER_HIT, player, enemy);

    // 3. Destroy the crashing enemy ship (triggering its death state)
    enemy.die();
  }
}
