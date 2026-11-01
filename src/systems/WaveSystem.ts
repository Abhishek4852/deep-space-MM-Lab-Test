import Phaser from 'phaser';
import { getWaveComposition } from '@/enemies/WaveDefinitions';
import { GAME_EVENTS } from '@/core/Constants';

export type WaveState = 'PLAYING' | 'RESTING';

export class WaveSystem {
  private scene: Phaser.Scene;

  // Wave status indicators
  private waveNumber = 1;
  private waveState: WaveState = 'PLAYING';

  private enemiesLeftToSpawn = 0;
  private enemiesRemaining = 0; // Total left to be destroyed to complete the wave
  private activeEnemiesCount = 0; // Active on screen right now

  // Countdown timer during breaks
  private restTimerRemaining = 0;
  private spawnTimer = 0;
  private restDuration = 4; // seconds rest between waves

  // Difficulty scaling coefficients per wave step
  private hpScaling = 0.15; // +15% HP per wave
  private speedScaling = 0.08; // +8% Speed per wave

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 1. Subscribe to gameplay events
    this.setupEventListeners();

    // 2. Load and initialize Wave 1
    this.startWave(1);

    // 3. Clean up on shutdown
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  private setupEventListeners(): void {
    const events = this.scene.events;

    events.on(GAME_EVENTS.ENEMY_SPAWNED, this.handleEnemySpawned, this);
    events.on(GAME_EVENTS.ENEMY_DIED, this.handleEnemyDied, this);
    events.on(GAME_EVENTS.GAME_RESTARTED, this.handleGameRestarted, this);
    events.on(GAME_EVENTS.WAVE_COMPLETED_CHECK_PAUSE, this.handleWaveCheckPause, this);
  }

  /**
   * Drives rest timer countdowns and ticks spawn trigger requests.
   */
  public update(_time: number, delta: number): void {
    const config = getWaveComposition(this.waveNumber);
    const hpMultiplier = 1.0 + (this.waveNumber - 1) * this.hpScaling;
    const speedMultiplier = 1.0 + (this.waveNumber - 1) * this.speedScaling;

    if (this.waveState === 'RESTING') {
      // Process break countdown
      this.restTimerRemaining = Math.max(0, this.restTimerRemaining - delta / 1000);
      this.scene.events.emit(GAME_EVENTS.WAVE_COUNTDOWN_TICK, this.restTimerRemaining);

      if (this.restTimerRemaining <= 0) {
        this.scene.events.emit(GAME_EVENTS.WAVE_COUNTDOWN_FINISHED);
        this.startWave(this.waveNumber + 1);
      }
    } else if (this.waveState === 'PLAYING') {
      // If it's a boss wave, do not spawn regular enemies
      if (config.isBossWave) return;

      // Process spawning frequency interval checks
      this.spawnTimer += delta;

      if (this.spawnTimer >= config.spawnInterval) {
        this.spawnTimer = 0;

        if (this.enemiesLeftToSpawn > 0 && this.activeEnemiesCount < config.maxActive) {
          this.enemiesLeftToSpawn--;

          // Fire decoupled spawn request including waveNumber details
          this.scene.events.emit(GAME_EVENTS.ENEMY_SPAWN_REQUEST, {
            waveNumber: this.waveNumber,
            hpMultiplier: hpMultiplier,
            speedMultiplier: speedMultiplier
          });
        }
      }
    }
  }

  /**
   * Commences a target wave number, updating config stats and emitting notifications.
   */
  private startWave(num: number): void {
    this.waveNumber = num;
    this.waveState = 'PLAYING';
    this.spawnTimer = 0;

    const config = getWaveComposition(this.waveNumber);
    
    if (config.isBossWave) {
      this.enemiesLeftToSpawn = 0;
      this.enemiesRemaining = 1; // Need to destroy the boss to clear wave
      this.activeEnemiesCount = 0;

      // Notify boss system to trigger spawning alert
      this.scene.events.emit('request-boss-spawn', config.bossType);
    } else {
      this.enemiesLeftToSpawn = config.totalCount;
      this.enemiesRemaining = config.totalCount;
      this.activeEnemiesCount = 0;
    }

    // Dispatches wave-started notification
    this.scene.events.emit(GAME_EVENTS.WAVE_STARTED, this.waveNumber, {
      waveNumber: this.waveNumber,
      enemyCount: config.totalCount,
      isBoss: !!config.isBossWave
    });
  }

  /**
   * Increments active enemies count when a physical spawn succeeds.
   */
  private handleEnemySpawned(): void {
    this.activeEnemiesCount++;
  }

  /**
   * Decrements active and remaining counts on enemy death, triggering wave complete checks.
   */
  private handleEnemyDied(): void {
    this.activeEnemiesCount = Math.max(0, this.activeEnemiesCount - 1);
    this.enemiesRemaining = Math.max(0, this.enemiesRemaining - 1);

    // If all wave enemies are dead, start rest phase
    if (this.enemiesRemaining <= 0 && this.waveState === 'PLAYING') {
      this.enterRestPhase();
    }
  }

  private handleWaveCheckPause(): void {
    // Stubs
  }

  /**
   * Transitions state into resting and begins the transition clock.
   */
  private enterRestPhase(): void {
    this.waveState = 'RESTING';
    this.restTimerRemaining = this.restDuration;

    const events = this.scene.events;
    events.emit(GAME_EVENTS.WAVE_COMPLETED, this.waveNumber);
    events.emit(GAME_EVENTS.WAVE_COUNTDOWN_STARTED, this.restTimerRemaining);
  }

  /**
   * Resets the entire WaveSystem state on game restarts.
   */
  private handleGameRestarted(): void {
    this.activeEnemiesCount = 0;
    this.startWave(1);
  }

  private shutdown(): void {
    const events = this.scene.events;
    events.off(GAME_EVENTS.ENEMY_SPAWNED, this.handleEnemySpawned, this);
    events.off(GAME_EVENTS.ENEMY_DIED, this.handleEnemyDied, this);
    events.off(GAME_EVENTS.GAME_RESTARTED, this.handleGameRestarted, this);
    events.off(GAME_EVENTS.WAVE_COMPLETED_CHECK_PAUSE, this.handleWaveCheckPause, this);
  }

  /* --- DATA ACCESSORS --- */

  public getWaveNumber(): number {
    return this.waveNumber;
  }

  public getWaveState(): WaveState {
    return this.waveState;
  }

  public getEnemiesRemaining(): number {
    return this.enemiesRemaining;
  }

  public getEnemiesLeftToSpawn(): number {
    return this.enemiesLeftToSpawn;
  }

  public getCountdownTime(): number {
    return this.restTimerRemaining;
  }

  public getDifficultyMultiplier(): number {
    return 1.0 + (this.waveNumber - 1) * this.hpScaling;
  }
}
