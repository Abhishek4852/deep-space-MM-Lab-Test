import Phaser from 'phaser';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';
import { Spacing } from '@/theme/Spacing';

export class BossHealthBar extends Phaser.GameObjects.Container {
  private bgPanel: Phaser.GameObjects.Graphics;
  private fillBar: Phaser.GameObjects.Graphics;
  
  private bossNameText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;
  private hpText: Phaser.GameObjects.Text;

  private currentPct = 1.0;
  private targetPct = 1.0;

  constructor(scene: Phaser.Scene, bossName: string, maxHp: number) {
    const w = scene.scale.width;
    // Position at top center, slide down entrance
    const startY = -60;
    const targetY = 70;
    super(scene, w / 2, startY);

    // 1. Base panels
    this.bgPanel = scene.add.graphics();
    this.fillBar = scene.add.graphics();
    this.add([this.bgPanel, this.fillBar]);

    const barW = Math.min(w * 0.75, 480);
    const barH = 14;

    // Draw static track borders
    const borderHex = parseInt(Colors.bgCardBorder.replace('#', ''), 16);
    const trackHex = 0x1e1b4b; // Deep dark indigo
    this.bgPanel.fillStyle(trackHex, 0.7);
    this.bgPanel.fillRoundedRect(-barW / 2, -barH / 2, barW, barH, Spacing.borderRadius);
    this.bgPanel.lineStyle(1.5, borderHex, 0.8);
    this.bgPanel.strokeRoundedRect(-barW / 2, -barH / 2, barW, barH, Spacing.borderRadius);

    // 2. Boss Name text
    this.bossNameText = scene.add.text(-barW / 2, -30, bossName.toUpperCase(), {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.sm,
      color: '#f8fafc',
      fontStyle: Typography.weight.bold
    }).setOrigin(0, 0.5);
    this.add(this.bossNameText);

    // 3. Phase indicators
    this.phaseText = scene.add.text(barW / 2, -30, 'PHASE 1', {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.xs,
      color: Colors.primary,
      fontStyle: Typography.weight.bold
    }).setOrigin(1, 0.5);
    this.add(this.phaseText);

    // 4. HP ratio values label
    this.hpText = scene.add.text(0, 18, `${maxHp} / ${maxHp}`, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.xs,
      color: Colors.textSecondary,
    }).setOrigin(0.5, 0.5);
    this.add(this.hpText);

    // Setup coordinate scroll metrics
    this.setScrollFactor(0);
    this.setDepth(UIConstants.depth.hud + 10);
    this.setAlpha(0);

    scene.add.existing(this);

    // 5. Entrance Slide Animation
    scene.tweens.add({
      targets: this,
      y: targetY,
      alpha: 1,
      duration: 500,
      ease: 'Cubic.easeOut'
    });

    // Run frame-loop rendering ticks
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.postUpdateUpdate, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.postUpdateUpdate, this);
    });
  }

  public updateHealth(health: number, maxHealth: number): void {
    this.targetPct = Phaser.Math.Clamp(health / maxHealth, 0, 1);
    this.hpText.setText(`${health} / ${maxHealth}`);
  }

  public updatePhase(phase: number): void {
    this.phaseText.setText(`PHASE ${phase}`);
    
    // Bounce text to denote transition
    this.scene.tweens.add({
      targets: this.phaseText,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  }

  public deactivate(): void {
    this.scene.tweens.add({
      targets: this,
      y: -60,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  private postUpdateUpdate(): void {
    if (!this.active) return;

    // Smoothly interpolate fill bar percentage updates
    if (Math.abs(this.currentPct - this.targetPct) > 0.002) {
      this.currentPct = Phaser.Math.Linear(this.currentPct, this.targetPct, 0.08);
      this.redrawFillBar();
    }
  }

  private redrawFillBar(): void {
    this.fillBar.clear();
    if (this.currentPct <= 0) return;

    const w = this.scene.scale.width;
    const barW = Math.min(w * 0.75, 480);
    const barH = 14;

    const fillWidth = barW * this.currentPct;

    // Boss health fill color: Red gradient
    const fillHex = 0xdc2626; // Red-600
    this.fillBar.fillStyle(fillHex, 0.9);
    this.fillBar.fillRoundedRect(
      -barW / 2, 
      -barH / 2, 
      fillWidth, 
      barH, 
      Spacing.borderRadius
    );
  }
}
