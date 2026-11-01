export const AssetKeys = {
  // Core Entities
  PLAYER: 'player',
  LASER: 'laser',
  BULLET: 'bullet',
  ENEMY: 'enemy',
  EXPLOSION: 'explosion',
  ENGINE_FLAME: 'engine_flame',

  // Specialized Projectiles
  PROJECTILE_BLASTER: 'bullet',
  PROJECTILE_SHOTGUN: 'projectile_shotgun',
  PROJECTILE_MISSILE: 'projectile_missile',
  PROJECTILE_LASER: 'projectile_laser',
  PROJECTILE_LIGHTNING: 'projectile_lightning',
} as const;

export type AssetKey = (typeof AssetKeys)[keyof typeof AssetKeys];
