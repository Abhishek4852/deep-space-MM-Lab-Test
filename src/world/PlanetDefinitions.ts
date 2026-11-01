export interface PlanetDefinition {
  id: string;
  name: string;
  tagline: string;
  radius: number;
  x: number;
  y: number;
  primaryColor: string;
  secondaryColor: string;
  atmosphereColor: string;
  cloudColor: string;
  glowColor: string;
  hasClouds?: boolean;
  hasRing?: boolean;
  rotationSpeed: number;
}

export const PLANET_DATABASE: PlanetDefinition[] = [
  {
    id: 'mercury',
    name: 'MERCURY',
    tagline: 'The Scorched Messenger',
    radius: 120,
    x: 900,
    y: 900,
    primaryColor: '#888888',
    secondaryColor: '#444444',
    atmosphereColor: '',
    cloudColor: '',
    glowColor: '#555555',
    hasClouds: false,
    hasRing: false,
    rotationSpeed: 0.0006
  },
  {
    id: 'venus',
    name: 'VENUS',
    tagline: 'The Veiled Greenhouse',
    radius: 180,
    x: 2200,
    y: 1500,
    primaryColor: '#eab308',
    secondaryColor: '#ca8a04',
    atmosphereColor: '#fbbf24',
    cloudColor: '#fef9c3',
    glowColor: '#eab308',
    hasClouds: true,
    rotationSpeed: -0.0003
  },
  {
    id: 'earth',
    name: 'EARTH',
    tagline: 'The Blue Planet',
    radius: 220,
    x: 3500,
    y: 3000,
    primaryColor: '#3b82f6',
    secondaryColor: '#22c55e',
    atmosphereColor: '#60a5fa',
    cloudColor: '#ffffff',
    glowColor: '#3b82f6',
    hasClouds: true,
    rotationSpeed: 0.001
  },
  {
    id: 'mars',
    name: 'MARS',
    tagline: 'The Red Frontier',
    radius: 180,
    x: 5200,
    y: 4100,
    primaryColor: '#ef4444',
    secondaryColor: '#991b1b',
    atmosphereColor: '#fca5a5',
    cloudColor: '',
    glowColor: '#ef4444',
    hasClouds: false,
    hasRing: false,
    rotationSpeed: 0.0009
  },
  {
    id: 'jupiter',
    name: 'JUPITER',
    tagline: 'The Colossus',
    radius: 420,
    x: 7200,
    y: 5000,
    primaryColor: '#f97316',
    secondaryColor: '#c2410c',
    atmosphereColor: '#fed7aa',
    cloudColor: '#ffedd5',
    glowColor: '#f97316',
    hasClouds: true,
    rotationSpeed: 0.002
  },
  {
    id: 'saturn',
    name: 'SATURN',
    tagline: 'The Jewel of the System',
    radius: 360,
    x: 9300,
    y: 6800,
    primaryColor: '#f59e0b',
    secondaryColor: '#b45309',
    atmosphereColor: '#fde047',
    cloudColor: '#fef9c3',
    glowColor: '#d97706',
    hasClouds: true,
    hasRing: true,
    rotationSpeed: 0.0018
  },
  {
    id: 'uranus',
    name: 'URANUS',
    tagline: 'The Sideways Ice Giant',
    radius: 260,
    x: 10300,
    y: 9300,
    primaryColor: '#06b6d4',
    secondaryColor: '#0891b2',
    atmosphereColor: '#67e8f9',
    cloudColor: '',
    glowColor: '#06b6d4',
    hasClouds: false,
    hasRing: false,
    rotationSpeed: -0.0012
  },
  {
    id: 'neptune',
    name: 'NEPTUNE',
    tagline: 'The Stormy Sentinel',
    radius: 250,
    x: 11500,
    y: 11100,
    primaryColor: '#2563eb',
    secondaryColor: '#1e3a8a',
    atmosphereColor: '#3b82f6',
    cloudColor: '',
    glowColor: '#2563eb',
    hasClouds: false,
    hasRing: false,
    rotationSpeed: 0.0015
  },
  {
    id: 'pluto',
    name: 'PLUTO',
    tagline: 'The Outcast Voyager',
    radius: 80,
    x: 11800,
    y: 11800,
    primaryColor: '#8c6239',
    secondaryColor: '#593e1a',
    atmosphereColor: '',
    cloudColor: '',
    glowColor: '#7a583a',
    hasClouds: false,
    hasRing: false,
    rotationSpeed: 0.0004
  }
];
