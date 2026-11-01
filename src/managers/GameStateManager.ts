import Phaser from 'phaser';
import { GameState } from '@/types/GameState';
import { GAME_EVENTS, PLAYER } from '@/core/Constants';
import { Enemy } from '@/enemies/Enemy';
import { Boss } from '@/bosses/Boss';

export class GameStateManager {
  private scene: Phaser.Scene;
  private currentState: GameState = GameState.PLAYING;

  // Live statistical variables
  private score = 0;
  private kills = 0;
  private health: number = PLAYER.MAX_HEALTH;
  private shotsFired = 0;
  private shotsHit = 0;
  private survivalTime = 0; // Accumulated seconds of active survival

  // Phase 12 Additions: Live Statistics Tracker
  private enemiesSpawned = 0;
  private eliteKills = 0;
  private bossKills = 0;
  private damageDealt = 0;
  private damageTaken = 0;
  private longestSurvival = 0; // Session lifetime record
  private combo = 0;
  private highestCombo = 0;

  // TimerEvent to drive the seconds increment
  private survivalTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // 1. Set up survival timer tick loop
    this.survivalTimer = scene.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true
    });

    // 2. Subscribe to gameplay events to process state changes
    this.setupEventListeners();

    // 3. Clean up timers and handlers on scene shutdown
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  /**
   * Registers listeners on the scene event bus to receive actions from physics and weapons systems.
   */
  private setupEventListeners(): void {
    const events = this.scene.events;

    events.on(GAME_EVENTS.ENEMY_DIED, this.handleEnemyDied, this);
    events.on(GAME_EVENTS.BULLET_HIT, this.handleBulletHit, this);
    events.on(GAME_EVENTS.SHOTS_FIRED, this.handleShotFired, this);
    events.on(GAME_EVENTS.HEALTH_CHANGED, this.handleHealthChanged, this);
    events.on(GAME_EVENTS.ENEMY_SPAWNED, this.handleEnemySpawned, this);
  }

  /**
   * Increments the survival timer by 1 second if the game is active.
   */
  private onTimerTick(): void {
    if (this.currentState === GameState.PLAYING) {
      this.survivalTime++;
      this.scene.events.emit(GAME_EVENTS.TIMER_TICK, this.survivalTime);
    }
  }

  /**
   * Increments kills and updates the score when an enemy dies.
   */
  private handleEnemyDied(enemy: any): void {
    if (this.currentState !== GameState.PLAYING) return;

    this.kills++;
    this.combo++;
    if (this.combo > this.highestCombo) {
      this.highestCombo = this.combo;
    }

    // Determine score bonus depending on enemy class
    if (enemy instanceof Boss) {
      this.bossKills++;
      this.score += 2000;
    } else if (enemy instanceof Enemy) {
      this.score += enemy.getScoreValue();
      if (enemy.isEliteEnemy()) {
        this.eliteKills++;
      }
    } else {
      this.score += 100;
    }

    const events = this.scene.events;
    events.emit(GAME_EVENTS.KILLS_CHANGED, this.kills);
    events.emit(GAME_EVENTS.SCORE_CHANGED, this.score);
  }

  private handleEnemySpawned(): void {
    if (this.currentState === GameState.PLAYING) {
      this.enemiesSpawned++;
    }
  }

  /**
   * Tracks successful bullet hits to evaluate accuracy and damage dealt.
   */
  private handleBulletHit(bullet: any, _enemy: any): void {
    if (this.currentState !== GameState.PLAYING) return;
    this.shotsHit++;

    if (bullet && typeof bullet.getDamage === 'function') {
      this.damageDealt += bullet.getDamage();
    }
  }

  /**
   * Tracks bullet shots fired.
   */
  private handleShotFired(totalShots: number): void {
    if (this.currentState !== GameState.PLAYING) return;
    this.shotsFired = totalShots;
  }

  /**
   * Handles player damage/healing changes, triggering game over on zero HP.
   */
  private handleHealthChanged(newHealthValue: number): void {
    if (this.currentState !== GameState.PLAYING) return;

    // Track damage taken difference
    const diff = this.health - newHealthValue;
    if (diff > 0) {
      this.damageTaken += diff;
      this.combo = 0; // Reset combo multiplier on taking damage
    }

    this.health = Math.max(0, Math.min(PLAYER.MAX_HEALTH, newHealthValue));

    if (this.health <= 0) {
      this.setState(GameState.GAME_OVER);
    }
  }

  /**
   * Transitions the game state and dispatches events.
   */
  public setState(newState: GameState): void {
    if (this.currentState === newState) return;

    const oldState = this.currentState;
    this.currentState = newState;

    this.scene.events.emit(GAME_EVENTS.STATE_CHANGED, newState, oldState);

    if (newState === GameState.GAME_OVER) {
      // Set session records
      this.longestSurvival = Math.max(this.longestSurvival, this.survivalTime);

      this.scene.events.emit(GAME_EVENTS.GAME_OVER, {
        score: this.score,
        kills: this.kills,
        accuracy: this.getAccuracy(),
        time: this.survivalTime
      });
    }
  }

  /**
   * Resets all stats to default parameters and restarts the timers.
   */
  public reset(): void {
    this.score = 0;
    this.kills = 0;
    this.health = PLAYER.MAX_HEALTH;
    this.shotsFired = 0;
    this.shotsHit = 0;
    this.survivalTime = 0;
    
    // Reset Phase 12 session variables
    this.enemiesSpawned = 0;
    this.eliteKills = 0;
    this.bossKills = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.combo = 0;
    this.highestCombo = 0;

    this.currentState = GameState.PLAYING;

    // Dispatch restarts
    const events = this.scene.events;
    events.emit(GAME_EVENTS.GAME_RESTARTED);
    events.emit(GAME_EVENTS.HEALTH_CHANGED, this.health);
    events.emit(GAME_EVENTS.SCORE_CHANGED, this.score);
    events.emit(GAME_EVENTS.KILLS_CHANGED, this.kills);
    events.emit(GAME_EVENTS.TIMER_TICK, this.survivalTime);
  }

  /**
   * Removes all event subscriptions and stops the survival clock.
   */
  private shutdown(): void {
    if (this.survivalTimer) {
      this.survivalTimer.destroy();
      this.survivalTimer = null;
    }

    const events = this.scene.events;
    events.off(GAME_EVENTS.ENEMY_DIED, this.handleEnemyDied, this);
    events.off(GAME_EVENTS.BULLET_HIT, this.handleBulletHit, this);
    events.off(GAME_EVENTS.SHOTS_FIRED, this.handleShotFired, this);
    events.off(GAME_EVENTS.HEALTH_CHANGED, this.handleHealthChanged, this);
    events.off(GAME_EVENTS.ENEMY_SPAWNED, this.handleEnemySpawned, this);
  }

  /* --- DATA ACCESSORS --- */

  public getState(): GameState {
    return this.currentState;
  }

  public getScore(): number {
    return this.score;
  }

  public getKills(): number {
    return this.kills;
  }

  public getHealth(): number {
    return this.health;
  }

  public getShotsFired(): number {
    return this.shotsFired;
  }

  public getShotsHit(): number {
    return this.shotsHit;
  }

  public getAccuracy(): number {
    return this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
  }

  public getSurvivalTime(): number {
    return this.survivalTime;
  }

  // Phase 12 additions getters
  public getEnemiesSpawned(): number {
    return this.enemiesSpawned;
  }

  public getEliteKills(): number {
    return this.eliteKills;
  }

  public getBossKills(): number {
    return this.bossKills;
  }

  public getDamageDealt(): number {
    return this.damageDealt;
  }

  public getDamageTaken(): number {
    return this.damageTaken;
  }

  public getLongestSurvival(): number {
    return Math.max(this.longestSurvival, this.survivalTime);
  }

  public getHighestCombo(): number {
    return this.highestCombo;
  }
}
