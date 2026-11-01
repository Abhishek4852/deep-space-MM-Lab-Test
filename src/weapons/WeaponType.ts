export enum WeaponType {
  BLASTER = 'BLASTER',
  SHOTGUN = 'SHOTGUN',
  MISSILE = 'MISSILE',
  LASER = 'LASER',
  LIGHTNING = 'LIGHTNING'
}

export interface WeaponMetadata {
  type: WeaponType;
  name: string;
  description: string;
  color: string;
  colorHex: number;
  fireRate: number;
  damage: number;
  keyLabel: string;
}

export const WEAPON_REGISTRY: Record<WeaponType, WeaponMetadata> = {
  [WeaponType.BLASTER]: {
    type: WeaponType.BLASTER,
    name: 'Plasma Blaster',
    description: 'Rapid-fire concentrated energy bolts with balanced velocity.',
    color: '#38bdf8', // Sky Blue
    colorHex: 0x38bdf8,
    fireRate: 200,
    damage: 12,
    keyLabel: '1'
  },
  [WeaponType.SHOTGUN]: {
    type: WeaponType.SHOTGUN,
    name: 'Plasma Shotgun',
    description: 'Fires 5 spreading plasma pellets for heavy close-range devastation.',
    color: '#c084fc', // Purple/Violet
    colorHex: 0xc084fc,
    fireRate: 420,
    damage: 8, // 8 x 5 = 40 total
    keyLabel: '2'
  },
  [WeaponType.MISSILE]: {
    type: WeaponType.MISSILE,
    name: 'Homing Missiles',
    description: 'Guided micro-rockets that track nearby enemies and trigger explosive AOE.',
    color: '#f97316', // Fiery Orange
    colorHex: 0xf97316,
    fireRate: 480,
    damage: 35,
    keyLabel: '3'
  },
  [WeaponType.LASER]: {
    type: WeaponType.LASER,
    name: 'Hyper Laser',
    description: 'Continuous high-energy beam pulses that pierce through hordes of enemies.',
    color: '#34d399', // Emerald Green
    colorHex: 0x34d399,
    fireRate: 130,
    damage: 9,
    keyLabel: '4'
  },
  [WeaponType.LIGHTNING]: {
    type: WeaponType.LIGHTNING,
    name: 'Lightning Arc',
    description: 'High-voltage electric discharges that chain between multiple targets.',
    color: '#facc15', // Electric Gold
    colorHex: 0xfacc15,
    fireRate: 380,
    damage: 22,
    keyLabel: '5'
  }
};

