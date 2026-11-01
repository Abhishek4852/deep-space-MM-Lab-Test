import Phaser from 'phaser';
import { UIConstants } from '@/theme/UIConstants';

type EasingFunction = string;

// Convenience type for objects that have x/y and setVisible/setPosition
type TransformObject = { x: number; y: number };
type VisibleObject = { setVisible: (v: boolean) => void };
type PositionObject = { setPosition: (x: number, y: number) => void };

/**
 * UIAnimator — centralized Phaser tween helper.
 *
 * Every UI component should use these methods instead of directly calling
 * scene.tweens.add(). This ensures animation durations and easing curves
 * are consistent across the entire UI.
 */
export class UIAnimator {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // ---------------------------------------------------------------------------
  // Fade
  // ---------------------------------------------------------------------------

  fadeIn(
    target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    duration: number = UIConstants.duration.normal,
    onComplete?: () => void
  ): Phaser.Tweens.Tween {
    const targets = Array.isArray(target) ? target : [target];
    targets.forEach((t) => {
      if ('setVisible' in t) (t as unknown as VisibleObject).setVisible(true);
    });
    return this.scene.tweens.add({
      targets,
      alpha: 1,
      duration,
      ease: 'Power2.easeOut',
      onComplete,
    });
  }

  fadeOut(
    target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    duration: number = UIConstants.duration.normal,
    onComplete?: () => void
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: Array.isArray(target) ? target : [target],
      alpha: 0,
      duration,
      ease: 'Power2.easeIn',
      onComplete,
    });
  }

  // ---------------------------------------------------------------------------
  // Slide
  // ---------------------------------------------------------------------------

  slideIn(
    target: Phaser.GameObjects.GameObject,
    fromX: number,
    toX: number,
    fromY: number,
    toY: number,
    duration: number = UIConstants.duration.normal,
    onComplete?: () => void
  ): Phaser.Tweens.Tween {
    if ('setPosition' in target) {
      (target as unknown as PositionObject).setPosition(fromX, fromY);
      if ('setVisible' in target) (target as unknown as VisibleObject).setVisible(true);
    }
    return this.scene.tweens.add({
      targets: target,
      x: toX,
      y: toY,
      alpha: 1,
      duration,
      ease: 'Cubic.easeOut',
      onComplete,
    });
  }

  slideOut(
    target: Phaser.GameObjects.GameObject,
    toX: number,
    toY: number,
    duration: number = UIConstants.duration.normal,
    onComplete?: () => void
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      x: toX,
      y: toY,
      alpha: 0,
      duration,
      ease: 'Cubic.easeIn',
      onComplete,
    });
  }

  // ---------------------------------------------------------------------------
  // Scale effects
  // ---------------------------------------------------------------------------

  bounce(
    target: Phaser.GameObjects.GameObject,
    scale = 1.25,
    duration: number = UIConstants.duration.fast
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      scaleX: scale,
      scaleY: scale,
      duration,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  pulse(
    target: Phaser.GameObjects.GameObject,
    minAlpha = 0.2,
    duration: number = UIConstants.duration.verySlow
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      alpha: minAlpha,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  shake(
    target: Phaser.GameObjects.GameObject,
    magnitude = 6,
    duration: number = UIConstants.duration.fast
  ): Phaser.Tweens.Tween {
    const startX = (target as unknown as TransformObject).x;
    return this.scene.tweens.add({
      targets: target,
      x: startX + magnitude,
      duration: duration / 4,
      yoyo: true,
      repeat: 3,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        (target as unknown as TransformObject).x = startX;
      },
    });
  }

  pop(
    target: Phaser.GameObjects.GameObject,
    scale = 1.4,
    duration: number = UIConstants.duration.fast
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({
      targets: target,
      scaleX: scale,
      scaleY: scale,
      alpha: 0,
      duration,
      ease: 'Quad.easeOut',
    });
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Stops all tweens on a target immediately */
  stopAll(target: Phaser.GameObjects.GameObject): void {
    this.scene.tweens.killTweensOf(target);
  }

  /** Custom tween shorthand */
  custom(
    targets: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
    props: Omit<Phaser.Types.Tweens.TweenBuilderConfig, 'targets'>,
    ease: EasingFunction = 'Linear'
  ): Phaser.Tweens.Tween {
    return this.scene.tweens.add({ targets, ease, ...props });
  }
}
