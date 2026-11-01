import Phaser from 'phaser';
import { PLAYER, GAME_EVENTS } from '@/core/Constants';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';
import { Spacing } from '@/theme/Spacing';
import { UIText } from '@/theme/UIText';
import { UILayoutManager, UILayout } from '@/ui/UILayoutManager';
import { ActiveBuff } from '@/systems/PowerUpSystem';

/**
 * TopLeftHUD — Unified Health & Status Card.
 *
 * Portrait: full-width health bar at top, centered.
 * Desktop: 280px card at top-left.
 */
export class TopLeftHUD extends Phaser.GameObjects.Container {
  private cardBg: Phaser.GameObjects.Graphics;
  private healthTrack: Phaser.GameObjects.Graphics;
  private healthFill: Phaser.GameObjects.Graphics;

  private healthLabelText: Phaser.GameObjects.Text;
  private healthValText: Phaser.GameObjects.Text;
  private shieldText: Phaser.GameObjects.Text;
  private buffTexts: Phaser.GameObjects.Text[] = [];

  private maxHealth: number = PLAYER.MAX_HEALTH;
  private currentHealth: number = PLAYER.MAX_HEALTH;
  private displayHealth: number = PLAYER.MAX_HEALTH;
  private shieldCharges = 0;
  private activeBuffs: ActiveBuff[] = [];

  private layoutMgr: UILayoutManager;
  private cardWidth = 280;
  private currentCardHeight = 60;

  constructor(scene: Phaser.Scene, layoutMgr: UILayoutManager) {
    const l = layoutMgr.get();
    const pos = l.isPortrait
      ? new Phaser.Math.Vector2(l.width / 2 - l.healthBarWidth / 2, l.anchors.topLeft.y)
      : l.anchors.topLeft;
    super(scene, pos.x, pos.y);

    this.layoutMgr = layoutMgr;
    this.cardWidth = l.healthBarWidth;

    this.cardBg = scene.add.graphics();
    this.add(this.cardBg);

    this.healthLabelText = scene.add.text(Spacing.internalPadding, Spacing.internalPadding, UIText.health, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.xs,
      color: Colors.textSecondary,
      fontStyle: Typography.weight.bold,
    }).setOrigin(0, 0);

    this.healthValText = scene.add.text(this.cardWidth - Spacing.internalPadding, Spacing.internalPadding, `${PLAYER.MAX_HEALTH} / ${PLAYER.MAX_HEALTH}`, {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.sm,
      color: Colors.textPrimary,
      fontStyle: Typography.weight.bold,
    }).setOrigin(1, 0);

    this.add([this.healthLabelText, this.healthValText]);

    this.healthTrack = scene.add.graphics();
    this.healthFill = scene.add.graphics();
    this.add([this.healthTrack, this.healthFill]);

    this.shieldText = scene.add.text(Spacing.internalPadding, 0, '', {
      fontFamily: Typography.fontMono,
      fontSize: Typography.size.sm,
      color: Colors.buffShield,
      fontStyle: Typography.weight.bold,
    }).setOrigin(0, 0);
    this.add(this.shieldText);

    this.setScrollFactor(0).setDepth(UIConstants.depth.hud as number);
    (scene.add as unknown as { existing: (go: unknown) => void }).existing(this);

    this.redrawCard();

    scene.events.on(GAME_EVENTS.HEALTH_CHANGED, this.onHealthChanged, this);
    scene.events.on(GAME_EVENTS.SHIELD_CHANGED, this.onShieldChanged, this);
    scene.events.on(GAME_EVENTS.BUFFS_UPDATED, this.onBuffsUpdated, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    scene.events.on('layout-updated', (newLayout: UILayout) => {
      this.updateLayout(newLayout);
    });
  }

  private updateLayout(l: UILayout): void {
    this.cardWidth = l.healthBarWidth;
    const pos = l.isPortrait
      ? new Phaser.Math.Vector2(l.width / 2 - l.healthBarWidth / 2, l.anchors.topLeft.y)
      : l.anchors.topLeft;
    this.setPosition(pos.x, pos.y);
    this.healthValText.setPosition(this.cardWidth - Spacing.internalPadding, Spacing.internalPadding);
    this.redrawCard();
  }

  private redrawCard(): void {
    const l = this.layoutMgr.get();
    const isPortrait = l.isPortrait;

    const barW = this.cardWidth - (isPortrait ? 0 : Spacing.internalPadding * 2);
    const barH = 20; // 20px height
    const barX = isPortrait ? 0 : Spacing.internalPadding;
    const barY = isPortrait ? 0 : Spacing.internalPadding + 18;

    let targetHeight = barY + barH;
    const showShield = this.shieldCharges > 0;
    const showBuffs = this.activeBuffs.length > 0;

    if (!isPortrait) {
      if (showShield) targetHeight += 20;
      if (showBuffs) targetHeight += this.activeBuffs.length * 20;
      targetHeight += Spacing.sm;
    } else {
      // In portrait, shields and buffs are drawn below the health bar
      if (showShield) targetHeight += 24;
      if (showBuffs) targetHeight += this.activeBuffs.length * 20;
      targetHeight += 8;
    }
    this.currentCardHeight = targetHeight;

    this.cardBg.clear();
    if (!isPortrait) {
      // Draw card background (semi-transparent panel slate-900)
      const cardBgHex = parseInt(Colors.bgPanel.replace('#', ''), 16);
      this.cardBg.fillStyle(cardBgHex, 0.75);
      this.cardBg.fillRoundedRect(0, 0, this.cardWidth, this.currentCardHeight, Spacing.borderRadius);
      
      const cardBorderHex = parseInt(Colors.bgCardBorder.replace('#', ''), 16);
      this.cardBg.lineStyle(1.5, cardBorderHex, 0.5);
      this.cardBg.strokeRoundedRect(0, 0, this.cardWidth, this.currentCardHeight, Spacing.borderRadius);

      this.healthLabelText.setVisible(true);
      this.healthLabelText.setPosition(Spacing.internalPadding, Spacing.internalPadding);
    } else {
      // Hide card background in portrait mode to keep screen clean
      this.healthLabelText.setVisible(false);
    }

    // Draw health bar track
    this.healthTrack.clear();
    const trackBgHex = parseInt(Colors.bgCard.replace('#', ''), 16);
    this.healthTrack.fillStyle(trackBgHex, 0.8);
    this.healthTrack.fillRoundedRect(barX, barY, barW, barH, 10); // rounded pill shape
    const borderHex = parseInt(Colors.bgCardBorder.replace('#', ''), 16);
    this.healthTrack.lineStyle(1.5, borderHex, 0.6);
    this.healthTrack.strokeRoundedRect(barX, barY, barW, barH, 10);

    // Draw health bar fill
    this.healthFill.clear();
    const ratio = this.displayHealth / this.maxHealth;
    if (this.displayHealth > 0) {
      let c1 = 0x22c55e; // Green gradient start
      let c2 = 0x16a34a; // Green gradient end
      if (ratio <= 0.25) {
        c1 = 0xef4444; // Red
        c2 = 0xdc2626;
      } else if (ratio <= 0.5) {
        c1 = 0xeab308; // Yellow
        c2 = 0xca8a04;
      }
      this.healthFill.fillGradientStyle(c1, c1, c2, c2, 1, 1, 1, 1);
      this.healthFill.fillRoundedRect(barX, barY, Math.max(16, barW * ratio), barH, 10);
    }

    // Center HP value text exactly on the health bar
    this.healthValText.setText(`${Math.round(this.currentHealth)} / ${this.maxHealth}`);
    this.healthValText.setPosition(barX + barW / 2, barY + barH / 2);
    this.healthValText.setOrigin(0.5, 0.5);
    this.healthValText.setFontStyle(Typography.weight.bold);
    this.healthValText.setColor(Colors.textPrimary);
    this.healthValText.setFontSize(Typography.size.xs);

    // Position Shield charges row
    let currentY = barY + barH + Spacing.sm;
    if (showShield) {
      this.shieldText.setVisible(true);
      this.shieldText.setPosition(isPortrait ? barX + 8 : Spacing.internalPadding, currentY);
      this.shieldText.setText(`🛡 ${UIText.shield.toUpperCase()}: ${'█ '.repeat(this.shieldCharges)}`);
      currentY += 20;
    } else {
      this.shieldText.setVisible(false);
    }

    // Draw Buff items
    this.buffTexts.forEach((t) => t.destroy());
    this.buffTexts = [];
    this.activeBuffs.forEach((buff) => {
      const secs = Math.ceil(buff.durationRemaining / 1000);
      const icon = this.getBuffIcon(buff.name);
      const t = this.scene.add.text(isPortrait ? barX + 8 : Spacing.internalPadding, currentY, `${icon} ${buff.name.toUpperCase()}: ${secs}s`, {
        fontFamily: Typography.fontMono,
        fontSize: Typography.size.xs,
        color: buff.color,
        fontStyle: Typography.weight.bold,
      }).setOrigin(0, 0);
      this.add(t);
      this.buffTexts.push(t);
      currentY += 20;
    });
  }

  private getBuffIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('rapid')) return '⚡';
    if (n.includes('damage')) return '⚔️';
    if (n.includes('speed')) return '🚀';
    return '⭐';
  }

  private onHealthChanged(value: number): void {
    const clamped = Math.max(0, Math.min(this.maxHealth, value));
    const isDamage = clamped < this.currentHealth;
    this.currentHealth = clamped;

    this.scene.tweens.add({
      targets: this,
      displayHealth: clamped,
      duration: 200,
      ease: 'Cubic.easeOut',
      onUpdate: () => this.redrawCard(),
    });

    if (isDamage) {
      const l = this.layoutMgr.get();
      const baseX = l.isPortrait
        ? l.width / 2 - l.healthBarWidth / 2
        : l.anchors.topLeft.x;
      this.scene.tweens.add({
        targets: this,
        x: baseX + 4,
        duration: 50,
        yoyo: true,
        repeat: 2,
        onComplete: () => { this.x = baseX; }
      });
    }
  }

  private onShieldChanged(charges: number): void {
    this.shieldCharges = charges;
    this.redrawCard();
  }

  private onBuffsUpdated(buffs: ActiveBuff[]): void {
    this.activeBuffs = buffs;
    this.redrawCard();
  }

  private onShutdown(): void {
    this.scene.events.off(GAME_EVENTS.HEALTH_CHANGED, this.onHealthChanged, this);
    this.scene.events.off(GAME_EVENTS.SHIELD_CHANGED, this.onShieldChanged, this);
    this.scene.events.off(GAME_EVENTS.BUFFS_UPDATED, this.onBuffsUpdated, this);
  }
}
