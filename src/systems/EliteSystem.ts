import { WaveComposition } from '@/enemies/WaveDefinitions';

export class EliteSystem {
  /**
   * Evaluates if a newly spawned enemy is decorated as an Elite variant.
   * Starts at wave 5 and depends on wave composition chances.
   */
  public static rollForElite(waveNumber: number, composition: WaveComposition): boolean {
    if (waveNumber < 5) return false;
    
    // Read deterministic elite chance from wave configuration definitions
    const chance = composition.eliteChance;
    return Math.random() <= chance;
  }
}
