import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { SceneKeys } from '@/core/SceneKeys';
import { AssetKeys } from '@/core/AssetKeys';
import { Colors } from '@/theme/Colors';
import { Typography } from '@/theme/Typography';
import { audioManager } from '@/audio/AudioManager';
import { WEAPON_REGISTRY, WeaponType } from '@/weapons/WeaponType';

interface StarData {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  color: number;
}

interface CometData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  active: boolean;
}

export class MenuScene extends BaseScene {
  private bgGraphics!: Phaser.GameObjects.Graphics;
  private nebulaGraphics!: Phaser.GameObjects.Graphics;
  private starGraphics!: Phaser.GameObjects.Graphics;
  private cometGraphics!: Phaser.GameObjects.Graphics;

  // Showcase Spaceship
  private shipContainer!: Phaser.GameObjects.Container;
  private shipSprite!: Phaser.GameObjects.Sprite;
  private flameSprite!: Phaser.GameObjects.Sprite;
  private shieldRing!: Phaser.GameObjects.Graphics;

  // Title & Badges
  private titleText!: Phaser.GameObjects.Text;
  private subtitleText!: Phaser.GameObjects.Text;

  // Interactive Buttons
  private startBtn!: Phaser.GameObjects.Text;
  private arsenalBtn!: Phaser.GameObjects.Text;
  private settingsBtn!: Phaser.GameObjects.Text;

  // Info & Watermark
  private controlsCard!: Phaser.GameObjects.Container;
  private controlsBg!: Phaser.GameObjects.Graphics;
  private controlsText!: Phaser.GameObjects.Text;
  private watermarkText!: Phaser.GameObjects.Text;

  // Weapon Arsenal Modal
  private arsenalModal!: Phaser.GameObjects.Container;
  private isArsenalOpen: boolean = false;

  // Quick Settings Modal
  private settingsModal!: Phaser.GameObjects.Container;
  private isSettingsOpen: boolean = false;

  // Animated Stars & Comets Data
  private stars: StarData[] = [];
  private comets: CometData[] = [];
  private cometTimer: number = 0;

  constructor() {
    super(SceneKeys.MENU);
  }

  create(): void {
    this.fadeIn(600);
    audioManager.startAmbientSpaceMusic();

    const w = this.scale.width;
    const h = this.scale.height;

    // 1. Multi-layered background rendering
    this.bgGraphics = this.add.graphics().setDepth(-30);
    this.nebulaGraphics = this.add.graphics().setDepth(-20);
    this.starGraphics = this.add.graphics().setDepth(-10);
    this.cometGraphics = this.add.graphics().setDepth(-5);

    this.initStars(w, h);

    // 2. Centerpiece: Player Spaceship Showcase
    this.createShipShowcase();

    // 3. Cyberpunk Neon Game Title
    this.titleText = this.add
      .text(0, 0, '★ DEEP SPACE ★', {
        fontFamily: Typography.fontMono,
        fontSize: '48px',
        color: '#38bdf8',
        fontStyle: Typography.weight.bold,
        stroke: '#0369a1',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5);

    this.subtitleText = this.add
      .text(0, 0, '── TACTICAL INTERSTELLAR ASSAULT ──', {
        fontFamily: Typography.fontMono,
        fontSize: '13px',
        color: '#94a3b8',
        fontStyle: Typography.weight.bold,
        align: 'center',
      })
      .setOrigin(0.5);

    // 4. Interactive Primary Action Buttons
    this.createActionButtons();

    // 5. Controls Info Card
    this.controlsCard = this.add.container(0, 0);
    this.controlsBg = this.add.graphics();
    this.controlsCard.add(this.controlsBg);

    this.controlsText = this.add
      .text(0, 0, '', {
        fontFamily: Typography.fontMono,
        fontSize: '11px',
        color: '#94a3b8',
        align: 'center',
      })
      .setOrigin(0.5);
    this.controlsCard.add(this.controlsText);

    // 6. Creator Watermark Badge
    this.watermarkText = this.add
      .text(0, 0, '⚡ Created by Abhishek Yaduwanshi 2026 ⚡', {
        fontFamily: Typography.fontMono,
        fontSize: '12px',
        color: '#38bdf8',
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(56,189,248,0.12)',
        padding: { x: 16, y: 7 },
      })
      .setOrigin(0.5, 1);

    // 7. Modals (Arsenal & Settings)
    this.createArsenalModal();
    this.createSettingsModal();

    // 8. Layout calculation
    this.updateLayout();

    // Resize listener
    this.scale.on(Phaser.Scale.Events.RESIZE, this.updateLayout, this);

    // Keyboard ENTER shortcut to start
    const enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    enterKey?.on('down', () => {
      if (!this.isArsenalOpen && !this.isSettingsOpen) {
        this.startGame();
      }
    });

    // Cleanup on shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.updateLayout, this);
    });
  }

  // ---------------------------------------------------------------------------
  // 🌌 Space Visuals (Nebulae, Stars, Comets)
  // ---------------------------------------------------------------------------

  private initStars(w: number, h: number): void {
    this.stars = [];
    const colors = [0xffffff, 0x38bdf8, 0xc084fc, 0xfde047];

    for (let i = 0; i < 220; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() < 0.15 ? 2.5 : Math.random() < 0.4 ? 1.8 : 1.0,
        alpha: 0.2 + Math.random() * 0.8,
        speed: 0.001 + Math.random() * 0.003,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  private drawNebulae(w: number, h: number): void {
    this.nebulaGraphics.clear();

    // Cosmic violet / cyan nebula clouds
    const clouds = [
      { x: w * 0.2, y: h * 0.3, rx: 220, ry: 160, color: 0x581c87, alpha: 0.25 },
      { x: w * 0.8, y: h * 0.4, rx: 260, ry: 190, color: 0x0284c7, alpha: 0.22 },
      { x: w * 0.5, y: h * 0.75, rx: 320, ry: 140, color: 0x1e1b4b, alpha: 0.35 },
    ];

    clouds.forEach((c) => {
      this.nebulaGraphics.fillStyle(c.color, c.alpha);
      this.nebulaGraphics.fillEllipse(c.x, c.y, c.rx * 2, c.ry * 2);
    });
  }

  // ---------------------------------------------------------------------------
  // 🚀 Spaceship Centerpiece Showcase
  // ---------------------------------------------------------------------------

  private createShipShowcase(): void {
    this.shipContainer = this.add.container(0, 0);

    // Shield aura ring
    this.shieldRing = this.add.graphics();
    this.shieldRing.lineStyle(2, 0x38bdf8, 0.45);
    this.shieldRing.strokeCircle(0, 0, 52);
    this.shieldRing.fillStyle(0x38bdf8, 0.04);
    this.shieldRing.fillCircle(0, 0, 52);
    this.shipContainer.add(this.shieldRing);

    // Engine flame
    this.flameSprite = this.add.sprite(-38, 0, AssetKeys.ENGINE_FLAME);
    this.flameSprite.setOrigin(1, 0.5);
    this.flameSprite.setScale(1.6);
    this.shipContainer.add(this.flameSprite);

    // Player spaceship
    this.shipSprite = this.add.sprite(0, 0, AssetKeys.PLAYER);
    this.shipSprite.setScale(1.5);
    this.shipContainer.add(this.shipSprite);

    // Subtle hover animation (floating up and down)
    this.tweens.add({
      targets: this.shipContainer,
      y: '+=10',
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Pulsing shield ring
    this.tweens.add({
      targets: this.shieldRing,
      scaleX: 1.08,
      scaleY: 1.08,
      alpha: 0.8,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeInOut',
    });
  }

  // ---------------------------------------------------------------------------
  // 🔘 Interactive Action Buttons
  // ---------------------------------------------------------------------------

  private createActionButtons(): void {
    // 1. [ 🚀 START MISSION ]
    this.startBtn = this.add
      .text(0, 0, '🚀  START MISSION', {
        fontFamily: Typography.fontMono,
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(56,189,248,0.25)',
        padding: { x: 36, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.startBtn.on('pointerover', () => {
      this.startBtn.setScale(1.06);
      this.startBtn.setStyle({ backgroundColor: 'rgba(56,189,248,0.45)' });
    });
    this.startBtn.on('pointerout', () => {
      this.startBtn.setScale(1.0);
      this.startBtn.setStyle({ backgroundColor: 'rgba(56,189,248,0.25)' });
    });
    this.startBtn.on('pointerdown', () => this.startGame());

    // Pulsing glow on primary Start button
    this.tweens.add({
      targets: this.startBtn,
      alpha: 0.85,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 2. [ ⚡ WEAPON ARSENAL ]
    this.arsenalBtn = this.add
      .text(0, 0, '⚡  WEAPON ARSENAL', {
        fontFamily: Typography.fontMono,
        fontSize: '14px',
        color: '#c084fc',
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(192,132,252,0.12)',
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.arsenalBtn.on('pointerover', () => {
      this.arsenalBtn.setScale(1.05);
      this.arsenalBtn.setStyle({ backgroundColor: 'rgba(192,132,252,0.28)' });
    });
    this.arsenalBtn.on('pointerout', () => {
      this.arsenalBtn.setScale(1.0);
      this.arsenalBtn.setStyle({ backgroundColor: 'rgba(192,132,252,0.12)' });
    });
    this.arsenalBtn.on('pointerdown', () => this.openArsenal());

    // 3. [ ⚙️ SETTINGS ]
    this.settingsBtn = this.add
      .text(0, 0, '⚙  SETTINGS', {
        fontFamily: Typography.fontMono,
        fontSize: '14px',
        color: '#94a3b8',
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(255,255,255,0.06)',
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.settingsBtn.on('pointerover', () => {
      this.settingsBtn.setScale(1.05);
      this.settingsBtn.setStyle({ backgroundColor: 'rgba(255,255,255,0.15)' });
    });
    this.settingsBtn.on('pointerout', () => {
      this.settingsBtn.setScale(1.0);
      this.settingsBtn.setStyle({ backgroundColor: 'rgba(255,255,255,0.06)' });
    });
    this.settingsBtn.on('pointerdown', () => this.openSettings());
  }

  // ---------------------------------------------------------------------------
  // ⚡ Weapon Arsenal Modal
  // ---------------------------------------------------------------------------

  private createArsenalModal(): void {
    this.arsenalModal = this.add.container(0, 0).setDepth(200).setVisible(false).setAlpha(0);

    const backdrop = this.add.graphics();
    this.arsenalModal.add(backdrop);

    const panel = this.add.graphics();
    this.arsenalModal.add(panel);

    const title = this.add
      .text(0, 0, '⚡ WEAPON ARSENAL ⚡', {
        fontFamily: Typography.fontMono,
        fontSize: '22px',
        color: '#fde047',
        fontStyle: Typography.weight.bold,
      })
      .setOrigin(0.5);
    this.arsenalModal.add(title);

    const weapons = [
      WEAPON_REGISTRY[WeaponType.BLASTER],
      WEAPON_REGISTRY[WeaponType.SHOTGUN],
      WEAPON_REGISTRY[WeaponType.MISSILE],
      WEAPON_REGISTRY[WeaponType.LASER],
      WEAPON_REGISTRY[WeaponType.LIGHTNING],
    ];

    weapons.forEach((w) => {
      const rowContainer = this.add.container(0, 0);

      const numBadge = this.add
        .text(0, 0, `[${w.keyLabel}] ${w.name}`, {
          fontFamily: Typography.fontMono,
          fontSize: '14px',
          color: w.color,
          fontStyle: Typography.weight.bold,
        })
        .setOrigin(0, 0.5);
      rowContainer.add(numBadge);

      const desc = this.add
        .text(0, 20, `${w.description} (DMG: ${w.damage} | RATE: ${w.fireRate}ms)`, {
          fontFamily: Typography.fontMono,
          fontSize: '11px',
          color: '#cbd5e1',
        })
        .setOrigin(0, 0.5);
      rowContainer.add(desc);

      this.arsenalModal.add(rowContainer);
    });

    // Close button
    const closeBtn = this.add
      .text(0, 0, '✕  CLOSE', {
        fontFamily: Typography.fontMono,
        fontSize: '14px',
        color: '#38bdf8',
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(56,189,248,0.15)',
        padding: { x: 28, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.closeArsenal());
    this.arsenalModal.add(closeBtn);
  }

  private openArsenal(): void {
    audioManager.playWeaponSwitch();
    this.isArsenalOpen = true;
    this.rebuildArsenalLayout();
    this.arsenalModal.setVisible(true);
    this.tweens.add({ targets: this.arsenalModal, alpha: 1, duration: 250, ease: 'Power2.easeOut' });
  }

  private closeArsenal(): void {
    audioManager.playWeaponSwitch();
    this.isArsenalOpen = false;
    this.tweens.add({
      targets: this.arsenalModal,
      alpha: 0,
      duration: 200,
      ease: 'Power2.easeIn',
      onComplete: () => this.arsenalModal.setVisible(false),
    });
  }

  private rebuildArsenalLayout(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const isPortrait = h > w;
    const panelW = isPortrait ? Math.min(w - 32, 380) : 560;
    const panelH = isPortrait ? Math.min(h - 40, 520) : 460;

    this.arsenalModal.setPosition(w / 2, h / 2);

    const children = this.arsenalModal.list;
    const backdrop = children[0] as Phaser.GameObjects.Graphics;
    const panel = children[1] as Phaser.GameObjects.Graphics;
    const title = children[2] as Phaser.GameObjects.Text;
    const closeBtn = children[children.length - 1] as Phaser.GameObjects.Text;

    // Backdrop
    backdrop.clear();
    backdrop.fillStyle(0x020617, 0.85);
    backdrop.fillRect(-w / 2, -h / 2, w, h);

    // Panel
    panel.clear();
    panel.fillStyle(0x0f172a, 0.98);
    panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);
    panel.lineStyle(2, 0x38bdf8, 0.8);
    panel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);

    title.setPosition(0, -panelH / 2 + 35);

    // Position 5 weapon rows
    let rowY = -panelH / 2 + 80;
    const step = isPortrait ? 65 : 58;

    for (let i = 0; i < 5; i++) {
      const row = children[3 + i] as Phaser.GameObjects.Container;
      row.setPosition(-panelW / 2 + 24, rowY);
      rowY += step;
    }

    closeBtn.setPosition(0, panelH / 2 - 32);
  }

  // ---------------------------------------------------------------------------
  // ⚙️ Quick Settings Modal
  // ---------------------------------------------------------------------------

  private createSettingsModal(): void {
    this.settingsModal = this.add.container(0, 0).setDepth(200).setVisible(false).setAlpha(0);

    const backdrop = this.add.graphics();
    this.settingsModal.add(backdrop);

    const panel = this.add.graphics();
    this.settingsModal.add(panel);

    const title = this.add
      .text(0, 0, '⚙ AUDIO & SETTINGS ⚙', {
        fontFamily: Typography.fontMono,
        fontSize: '20px',
        color: '#38bdf8',
        fontStyle: Typography.weight.bold,
      })
      .setOrigin(0.5);
    this.settingsModal.add(title);

    // Sound toggle
    const isMuted = audioManager.getIsMuted();
    const soundToggle = this.add
      .text(0, 0, `Sound & Music: ${!isMuted ? '[ ON ]' : '[ OFF ]'}`, {
        fontFamily: Typography.fontMono,
        fontSize: '15px',
        color: !isMuted ? Colors.success : Colors.textMuted,
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(255,255,255,0.06)',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    soundToggle.on('pointerdown', () => {
      audioManager.toggleMute();
      audioManager.playWeaponSwitch();
      const muted = audioManager.getIsMuted();
      soundToggle.setText(`Sound & Music: ${!muted ? '[ ON ]' : '[ OFF ]'}`);
      soundToggle.setColor(!muted ? Colors.success : Colors.textMuted);
    });
    this.settingsModal.add(soundToggle);

    // Fullscreen toggle
    const fsToggle = this.add
      .text(0, 0, 'Toggle Fullscreen', {
        fontFamily: Typography.fontMono,
        fontSize: '14px',
        color: '#f8fafc',
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(255,255,255,0.06)',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    fsToggle.on('pointerdown', () => {
      audioManager.playWeaponSwitch();
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });
    this.settingsModal.add(fsToggle);

    // Close button
    const closeBtn = this.add
      .text(0, 0, '✕  CLOSE', {
        fontFamily: Typography.fontMono,
        fontSize: '14px',
        color: '#38bdf8',
        fontStyle: Typography.weight.bold,
        backgroundColor: 'rgba(56,189,248,0.15)',
        padding: { x: 28, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    closeBtn.on('pointerdown', () => this.closeSettings());
    this.settingsModal.add(closeBtn);
  }

  private openSettings(): void {
    audioManager.playWeaponSwitch();
    this.isSettingsOpen = true;
    this.rebuildSettingsLayout();
    this.settingsModal.setVisible(true);
    this.tweens.add({ targets: this.settingsModal, alpha: 1, duration: 250, ease: 'Power2.easeOut' });
  }

  private closeSettings(): void {
    audioManager.playWeaponSwitch();
    this.isSettingsOpen = false;
    this.tweens.add({
      targets: this.settingsModal,
      alpha: 0,
      duration: 200,
      ease: 'Power2.easeIn',
      onComplete: () => this.settingsModal.setVisible(false),
    });
  }

  private rebuildSettingsLayout(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const isPortrait = h > w;
    const panelW = isPortrait ? Math.min(w - 32, 340) : 420;
    const panelH = 300;

    this.settingsModal.setPosition(w / 2, h / 2);

    const children = this.settingsModal.list;
    const backdrop = children[0] as Phaser.GameObjects.Graphics;
    const panel = children[1] as Phaser.GameObjects.Graphics;
    const title = children[2] as Phaser.GameObjects.Text;
    const soundToggle = children[3] as Phaser.GameObjects.Text;
    const fsToggle = children[4] as Phaser.GameObjects.Text;
    const closeBtn = children[5] as Phaser.GameObjects.Text;

    backdrop.clear();
    backdrop.fillStyle(0x020617, 0.85);
    backdrop.fillRect(-w / 2, -h / 2, w, h);

    panel.clear();
    panel.fillStyle(0x0f172a, 0.98);
    panel.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);
    panel.lineStyle(2, 0x38bdf8, 0.8);
    panel.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 16);

    title.setPosition(0, -panelH / 2 + 35);
    soundToggle.setPosition(0, -30);
    fsToggle.setPosition(0, 30);
    closeBtn.setPosition(0, panelH / 2 - 32);
  }

  // ---------------------------------------------------------------------------
  // 📐 Responsive Layout Updates
  // ---------------------------------------------------------------------------

  private updateLayout(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const isPortrait = h > w;

    // 1. Draw rich background
    this.bgGraphics.clear();
    this.bgGraphics.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x0f172a, 1);
    this.bgGraphics.fillRect(0, 0, w, h);

    this.drawNebulae(w, h);

    // 2. Title positioning
    const titleY = isPortrait ? h * 0.12 : h * 0.14;
    this.titleText.setPosition(cx, titleY);
    this.titleText.setFontSize(isPortrait ? '32px' : '52px');

    this.subtitleText.setPosition(cx, titleY + (isPortrait ? 36 : 46));
    this.subtitleText.setFontSize(isPortrait ? '11px' : '13px');

    // 3. Centerpiece Spaceship
    const shipY = isPortrait ? h * 0.32 : h * 0.40;
    this.shipContainer.setPosition(cx, shipY);
    this.shipContainer.setScale(isPortrait ? 1.3 : 1.6);

    // 4. Action Buttons
    const btnStartY = isPortrait ? h * 0.52 : h * 0.62;
    this.startBtn.setPosition(cx, btnStartY);
    this.arsenalBtn.setPosition(cx - (isPortrait ? 0 : 130), btnStartY + (isPortrait ? 58 : 62));
    this.settingsBtn.setPosition(cx + (isPortrait ? 0 : 130), btnStartY + (isPortrait ? 108 : 62));

    // 5. Controls Info Card
    const cardY = isPortrait ? h * 0.82 : h * 0.84;
    this.controlsCard.setPosition(cx, cardY);

    const isTouch = this.sys.game.device.input.touch;
    const controlsMsg = isTouch
      ? '📱 Touch Controls: Left Side = Joystick (Move) · Right Side = Fire Button\nTap [SWITCH] or Weapon Pills on HUD to change weapons'
      : '⌨ Keyboard: WASD / Arrows to Move · Mouse to Aim & Fire\nWeapon Hotkeys: [1-5] · Cycle: [Q / E] · Scroll Mouse Wheel';
    this.controlsText.setText(controlsMsg);

    const cardW = isPortrait ? Math.min(w - 32, 420) : 580;
    const cardH = isPortrait ? 54 : 46;
    this.controlsBg.clear();
    this.controlsBg.fillStyle(0x0f172a, 0.7);
    this.controlsBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
    this.controlsBg.lineStyle(1, 0x334155, 0.5);
    this.controlsBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);

    // 6. Watermark at bottom
    this.watermarkText.setPosition(cx, h - 14);

    if (this.isArsenalOpen) this.rebuildArsenalLayout();
    if (this.isSettingsOpen) this.rebuildSettingsLayout();
  }

  // ---------------------------------------------------------------------------
  // 🔄 Update Loop (Twinkling stars & Shooting comets)
  // ---------------------------------------------------------------------------

  update(time: number, delta: number): void {
    // 1. Draw twinkling stars
    this.starGraphics.clear();
    this.stars.forEach((s) => {
      s.alpha += Math.sin(time * s.speed) * 0.015;
      const currentAlpha = Phaser.Math.Clamp(s.alpha, 0.15, 1.0);
      this.starGraphics.fillStyle(s.color, currentAlpha);
      this.starGraphics.fillCircle(s.x, s.y, s.size);
    });

    // 2. Animate engine flame
    if (this.flameSprite) {
      const flicker = 1.3 + Math.sin(time * 0.02) * 0.3;
      this.flameSprite.setScale(flicker * 1.2, 1.4);
    }

    // 3. Shooting Comets
    this.updateComets(time, delta);
  }

  private updateComets(_time: number, delta: number): void {
    this.cometGraphics.clear();
    this.cometTimer += delta;

    // Spawn a new comet every 3.5 seconds
    if (this.cometTimer >= 3500) {
      this.cometTimer = 0;
      const w = this.scale.width;
      this.comets.push({
        x: Math.random() * w,
        y: -40,
        vx: (Math.random() - 0.4) * 600,
        vy: 700 + Math.random() * 300,
        length: 70 + Math.random() * 40,
        alpha: 1.0,
        active: true,
      });
    }

    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];
      if (!c.active) {
        this.comets.splice(i, 1);
        continue;
      }

      c.x += (c.vx * delta) / 1000;
      c.y += (c.vy * delta) / 1000;
      c.alpha -= 0.012;

      if (c.y > this.scale.height + 100 || c.alpha <= 0) {
        c.active = false;
        continue;
      }

      // Draw comet tail
      this.cometGraphics.lineStyle(2, 0x38bdf8, c.alpha);
      this.cometGraphics.beginPath();
      this.cometGraphics.moveTo(c.x, c.y);
      this.cometGraphics.lineTo(c.x - (c.vx / 800) * c.length, c.y - (c.vy / 800) * c.length);
      this.cometGraphics.strokePath();

      // Comet head glow
      this.cometGraphics.fillStyle(0xffffff, c.alpha);
      this.cometGraphics.fillCircle(c.x, c.y, 2.5);
    }
  }

  private startGame(): void {
    audioManager.playWeaponSwitch();
    this.transitionTo(SceneKeys.GAME, 600);
  }
}
