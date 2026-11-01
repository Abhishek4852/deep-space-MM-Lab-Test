export enum PowerUpType {
  HEALTH_PACK = 'HEALTH_PACK',
  RAPID_FIRE = 'RAPID_FIRE',
  DAMAGE_BOOST = 'DAMAGE_BOOST',
  SPEED_BOOST = 'SPEED_BOOST',
  SHIELD = 'SHIELD'
}

export interface PowerUpConfig {
  type: PowerUpType;
  name: string;
  textureKey: string;
  duration: number; // in milliseconds (0 for instant/permanent counts)
  color: string; // hex color for popup text notifications
  colorHex: number; // numeric hex for visual highlights
}

export const POWER_UP_LIST: PowerUpType[] = [
  PowerUpType.HEALTH_PACK,
  PowerUpType.RAPID_FIRE,
  PowerUpType.DAMAGE_BOOST,
  PowerUpType.SPEED_BOOST,
  PowerUpType.SHIELD
];

export const POWER_UP_CONFIGS: Record<PowerUpType, PowerUpConfig> = {
  [PowerUpType.HEALTH_PACK]: {
    type: PowerUpType.HEALTH_PACK,
    name: 'Health Pack',
    textureKey: 'powerup_health',
    duration: 0,
    color: '#22c55e', // Green-500
    colorHex: 0x22c55e
  },
  [PowerUpType.RAPID_FIRE]: {
    type: PowerUpType.RAPID_FIRE,
    name: 'Rapid Fire',
    textureKey: 'powerup_rapid',
    duration: 15000,
    color: '#eab308', // Yellow-500
    colorHex: 0xeab308
  },
  [PowerUpType.DAMAGE_BOOST]: {
    type: PowerUpType.DAMAGE_BOOST,
    name: 'Damage Boost',
    textureKey: 'powerup_damage',
    duration: 15000,
    color: '#ef4444', // Red-500
    colorHex: 0xef4444
  },
  [PowerUpType.SPEED_BOOST]: {
    type: PowerUpType.SPEED_BOOST,
    name: 'Speed Boost',
    textureKey: 'powerup_speed',
    duration: 15000,
    color: '#06b6d4', // Cyan-500
    colorHex: 0x06b6d4
  },
  [PowerUpType.SHIELD]: {
    type: PowerUpType.SHIELD,
    name: 'Shield',
    textureKey: 'powerup_shield',
    duration: 0,
    color: '#3b82f6', // Blue-500
    colorHex: 0x3b82f6
  }
};

export const LOOT_SETTINGS = {
  DROP_CHANCE: 0.2, // 20% default drop rate
  DESPAWN_TIME: 10000, // 10 seconds total lifetime
  FLASH_TIME: 2000, // starts flashing during final 2 seconds
  POOL_SIZE: 30 // max pooled power-ups
} as const;
