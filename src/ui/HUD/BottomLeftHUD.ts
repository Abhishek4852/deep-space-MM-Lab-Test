import Phaser from 'phaser';
import { GAME_EVENTS } from '@/core/Constants';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { UIConstants } from '@/theme/UIConstants';
import { Spacing } from '@/theme/Spacing';
import { UIText } from '@/theme/UIText';
import { UILayoutManager, UILayout } from '@/ui/UILayoutManager';
import { ActiveBuff } from '@/systems/PowerUpSystem';
import { WeaponMetadata, WeaponType, WEAPON_REGISTRY } from '@/weapons/WeaponType';
import { audioManager } from '@/audio/AudioManager';

interface WeaponPill {
  index: number;
  label: string;
  type: WeaponType;
  x: number;
  y: number;
  width: number;
  height: number;
  textObj: Phaser.GameObjects.Text;
}

/**
 * BottomLeftHUD — Interactive Multi-Weapon Card & Switcher.
 *
 * Displays the currently equipped weapon, active modifiers, a dedicated
 * [ 🔄 SWITCH WEAPON ] button, and interactive weapon pill tabs.
 * Supports desktop mouse clicks, keyboard hotkeys [1-5]/[Q/E], mouse scroll,
 * and mobile touch events with direct screen-space hit testing.
 */
export class BottomLeftHUD extends Phaser.GameObjects.Container {
  private cardBg: Phaser.GameObjects.Graphics;

  private labelText: Phaser.GameObjects.Text;
  private weaponNameText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;
  private switchBtnText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;

  private weaponPills: WeaponPill[] = [];
  private pillGraphics: Phaser.GameObjects.Graphics;

  private currentWeaponIndex: number = 0;
  private currentWeaponName = 'Plasma Blaster';
  private currentWeaponLevel = 1;
  private currentAccentHex: number = 0x38bdf8;
  private activeStatus = 'READY';
  private statusColor: string = Colors.success;

  private cardWidth = 280;
  private cardHeight = 118;
  private screenPos = { x: 20, y: 500 };

  constructor(scene: Phaser.Scene, layoutMgr: UILayoutManager) {
    const l = layoutMgr.get();
    super(scene, l.anchors.bottomLeft.x, l.anchors.bottomLeft.y - 118);

    // 1. Background Graphics
    this.cardBg = scene.add.graphics();
    this.add(this.cardBg);

    this.pillGraphics = scene.add.graphics();
    this.add(this.pillGraphics);

    // 2. Card Label (Category)
    this.labelText = scene.add
      .text(Spacing.internalPadding, Spacing.internalPadding, UIText.weapon, {
        fontFamily: Typography.fontMono,
        fontSize: Typography.size.xs,
        color: Colors.warning,
        fontStyle: Typography.weight.bold,
      })
      .setOrigin(0, 0);
    this.add(this.labelText);

    // 3. Dedicated Change Weapon Button (Top Right of Card)
    this.switchBtnText = scene.add
      .text(this.cardWidth - Spacing.internalPadding, Spacing.internalPadding, '🔄 SWITCH', {
        fontFamily: Typography.fontMono,
        fontSize: '11px',
        color: '#ffffff',
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(56,189,248,0.25)',
        padding: { x: 8, y: 3 },
      })
      .setOrigin(1, 0);
    this.add(this.switchBtnText);

    // 4. Weapon Name
    this.weaponNameText = scene.add
      .text(Spacing.internalPadding, Spacing.internalPadding + 16, this.currentWeaponName, {
        fontFamily: Typography.fontMono,
        fontSize: Typography.size.md,
        color: '#38bdf8',
        fontStyle: Typography.weight.bold,
      })
      .setOrigin(0, 0);
    this.add(this.weaponNameText);

    // 5. Status Indicator (Level & Active Modifiers)
    this.statusText = scene.add
      .text(
        Spacing.internalPadding,
        Spacing.internalPadding + 38,
        `LV.${this.currentWeaponLevel}  |  STATUS: ${this.activeStatus}`,
        {
          fontFamily: Typography.fontMono,
          fontSize: Typography.size.xs,
          color: Colors.success,
          fontStyle: Typography.weight.bold,
        }
      )
      .setOrigin(0, 0);
    this.add(this.statusText);

    // 6. Interactive Weapon Pills (1 to 5)
    this.createWeaponPills(scene);

    // 7. On-Screen Instruction / Hint
    this.hintText = scene.add
      .text(Spacing.internalPadding, this.cardHeight - 16, 'KEYS: [1-5] [Q/E] or TAP TABS', {
        fontFamily: Typography.fontMono,
        fontSize: '9px',
        color: Colors.textMuted,
        fontStyle: Typography.weight.normal,
      })
      .setOrigin(0, 0);
    this.add(this.hintText);

    this.setScrollFactor(0).setDepth(UIConstants.depth.hud as number);
    (scene.add as unknown as { existing: (go: unknown) => void }).existing(this);

    this.updateLayout(l);

    // Direct screen-space pointer listener to guarantee weapon switching on touch & mouse
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleScreenPointerDown, this);

    // Event listeners
    scene.events.on('weapon-switched', this.onWeaponSwitched, this);
    scene.events.on(GAME_EVENTS.BUFFS_UPDATED, this.onBuffsUpdated, this);
    scene.events.on(GAME_EVENTS.GAME_RESTARTED, this.onRestart, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    scene.events.on('layout-updated', (newLayout: UILayout) => {
      this.updateLayout(newLayout);
    });
  }

  private createWeaponPills(scene: Phaser.Scene): void {
    const weaponKeys: WeaponType[] = [
      WeaponType.BLASTER,
      WeaponType.SHOTGUN,
      WeaponType.MISSILE,
      WeaponType.LASER,
      WeaponType.LIGHTNING,
    ];

    const shortLabels = ['1:BLAST', '2:SHOTG', '3:MISSL', '4:LASER', '5:ARC'];
    const pillW = 46;
    const pillH = 22;
    const startY = 62;

    weaponKeys.forEach((type, i) => {
      const pillX = Spacing.internalPadding + i * (pillW + 6);
      const text = scene.add
        .text(pillX + pillW / 2, startY + pillH / 2, shortLabels[i], {
          fontFamily: Typography.fontMono,
          fontSize: '9px',
          color: i === 0 ? '#38bdf8' : Colors.textMuted,
          fontStyle: Typography.weight.bold,
          align: 'center',
        })
        .setOrigin(0.5);

      this.add(text);

      this.weaponPills.push({
        index: i,
        label: shortLabels[i],
        type,
        x: pillX,
        y: startY,
        width: pillW,
        height: pillH,
        textObj: text,
      });
    });
  }

  private updateLayout(l: UILayout): void {
    if (l.isPortrait) {
      this.cardWidth = Math.min(l.width - 32, 290);
      const posX = l.anchors.bottomLeft.x;
      const posY = l.joystickPosition.y - l.joystickBaseSize / 2 - l.gap - this.cardHeight - 10;
      this.setPosition(posX, posY);
      this.screenPos = { x: posX, y: posY };
      this.hintText.setText('TAP [SWITCH] OR WEAPON TABS');
    } else {
      this.cardWidth = 290;
      const posX = l.anchors.bottomLeft.x;
      const posY = l.anchors.bottomLeft.y - this.cardHeight;
      this.setPosition(posX, posY);
      this.screenPos = { x: posX, y: posY };
      this.hintText.setText('KEYS: [1-5] [Q/E] · SCROLL · TAP');
    }

    this.switchBtnText.setPosition(this.cardWidth - Spacing.internalPadding, Spacing.internalPadding);
    this.drawCard();
  }

  private drawCard(): void {
    this.cardBg.clear();
    // Inner fill
    const cardBgHex = parseInt(Colors.bgPanel.replace('#', ''), 16);
    this.cardBg.fillStyle(cardBgHex, 0.88);
    this.cardBg.fillRoundedRect(0, 0, this.cardWidth, this.cardHeight, Spacing.borderRadius);

    // Glowing border outline matching current weapon
    this.cardBg.lineStyle(2, this.currentAccentHex, 0.9);
    this.cardBg.strokeRoundedRect(0, 0, this.cardWidth, this.cardHeight, Spacing.borderRadius);

    // Draw pills
    this.pillGraphics.clear();
    this.weaponPills.forEach((p) => {
      const isSelected = p.index === this.currentWeaponIndex;
      const meta = WEAPON_REGISTRY[p.type];

      if (isSelected) {
        this.pillGraphics.fillStyle(meta.colorHex, 0.25);
        this.pillGraphics.fillRoundedRect(p.x, p.y, p.width, p.height, 4);
        this.pillGraphics.lineStyle(1.5, meta.colorHex, 1.0);
        this.pillGraphics.strokeRoundedRect(p.x, p.y, p.width, p.height, 4);
        p.textObj.setColor(meta.color);
      } else {
        this.pillGraphics.fillStyle(0x0f172a, 0.6);
        this.pillGraphics.fillRoundedRect(p.x, p.y, p.width, p.height, 4);
        this.pillGraphics.lineStyle(1, 0x334155, 0.5);
        this.pillGraphics.strokeRoundedRect(p.x, p.y, p.width, p.height, 4);
        p.textObj.setColor('#64748b');
      }
    });
  }

  /**
   * Screen-space hit testing for instant, reliable weapon switching across any touch browser and desktop.
   */
  private handleScreenPointerDown(pointer: Phaser.Input.Pointer): void {
    const localX = pointer.x - this.screenPos.x;
    const localY = pointer.y - this.screenPos.y;

    // Check if clicked inside the weapon card
    if (localX < 0 || localX > this.cardWidth || localY < 0 || localY > this.cardHeight) {
      return;
    }

    // 1. Check if clicked on [ 🔄 SWITCH ] button
    if (localX >= this.cardWidth - 90 && localY <= 38) {
      this.triggerCycle();
      return;
    }

    // 2. Check if clicked on any of the 5 weapon pills
    for (const pill of this.weaponPills) {
      if (
        localX >= pill.x &&
        localX <= pill.x + pill.width &&
        localY >= pill.y &&
        localY <= pill.y + pill.height
      ) {
        this.triggerSelectIndex(pill.index);
        return;
      }
    }

    // 3. Otherwise clicking anywhere on the main body of the card cycles weapon
    this.triggerCycle();
  }

  private triggerCycle(): void {
    audioManager.playWeaponSwitch();
    this.scene.events.emit('request-weapon-cycle');
    this.punchCard();
  }

  private triggerSelectIndex(index: number): void {
    audioManager.playWeaponSwitch();
    const sceneAny = this.scene as unknown as { weaponSystem?: { switchWeapon: (idx: number) => void } };
    sceneAny.weaponSystem?.switchWeapon(index);
    this.punchCard();
  }

  private punchCard(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 65,
      yoyo: true,
      ease: 'Quad.easeInOut',
    });
  }

  public setWeaponName(name: string): void {
    this.currentWeaponName = name;
    this.weaponNameText.setText(name);
  }

  private onWeaponSwitched(weapon: { type?: WeaponType }, metadata: WeaponMetadata): void {
    this.currentWeaponName = metadata.name;
    this.currentAccentHex = metadata.colorHex;

    const type = weapon.type ?? metadata.type;
    const foundIdx = this.weaponPills.findIndex((p) => p.type === type);
    if (foundIdx !== -1) {
      this.currentWeaponIndex = foundIdx;
    }

    this.weaponNameText.setText(metadata.name);
    this.weaponNameText.setColor(metadata.color);
    this.labelText.setColor(metadata.color);
    this.drawCard();
    this.punchCard();
  }

  private onBuffsUpdated(buffs: ActiveBuff[]): void {
    const hasRapid = buffs.some((b) => b.name.toLowerCase().includes('rapid'));
    const hasDamage = buffs.some((b) => b.name.toLowerCase().includes('damage'));

    if (hasRapid && hasDamage) {
      this.activeStatus = 'OVERCHARGED!';
      this.statusColor = Colors.danger;
    } else if (hasRapid) {
      this.activeStatus = 'RAPID FIRE';
      this.statusColor = Colors.warning;
    } else if (hasDamage) {
      this.activeStatus = 'DAMAGE BOOST';
      this.statusColor = Colors.danger;
    } else {
      this.activeStatus = 'READY';
      this.statusColor = Colors.success;
    }

    this.statusText.setText(`LV.${this.currentWeaponLevel}  |  STATUS: ${this.activeStatus}`);
    this.statusText.setColor(this.statusColor);
  }

  private onRestart(): void {
    this.currentWeaponLevel = 1;
    this.currentWeaponIndex = 0;
    this.activeStatus = 'READY';
    this.statusColor = Colors.success;
    this.statusText.setText(`LV.${this.currentWeaponLevel}  |  STATUS: ${this.activeStatus}`);
    this.statusText.setColor(this.statusColor);
    this.drawCard();
  }

  private onShutdown(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleScreenPointerDown, this);
    this.scene.events.off('weapon-switched', this.onWeaponSwitched, this);
    this.scene.events.off(GAME_EVENTS.BUFFS_UPDATED, this.onBuffsUpdated, this);
    this.scene.events.off(GAME_EVENTS.GAME_RESTARTED, this.onRestart, this);
  }
}
