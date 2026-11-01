import Phaser from 'phaser';

/**
 * UILayout — The single source of truth for every HUD and overlay position.
 * Calculates positions based on scale dimensions, safe areas, and responsive padding.
 */
export class UILayout {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Returns the standard margin based on active device type/dimensions
   * Desktop: 24px
   * Tablet: 20px
   * Mobile: 16px
   */
  public getMargin(): number {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const isTouch = this.scene.sys.game.device.input.touch;
    const maxDim = Math.max(w, h);

    if (maxDim < 900 && isTouch) {
      return 16; // Mobile
    } else if (maxDim < 1200 && isTouch) {
      return 20; // Tablet
    } else {
      return 24; // Desktop
    }
  }

  /**
   * Returns safe-area insets parsed from CSS variables.
   * Leverages the env(safe-area-inset-*) injected into body custom properties.
   */
  public getSafeArea(): { top: number; right: number; bottom: number; left: number } {
    if (typeof document !== 'undefined') {
      const style = getComputedStyle(document.documentElement);
      const parse = (prop: string) => {
        const val = style.getPropertyValue(prop);
        return val ? parseInt(val, 10) || 0 : 0;
      };
      return {
        top: parse('--sat') || 0,
        right: parse('--sar') || 0,
        bottom: parse('--sab') || 0,
        left: parse('--sal') || 0,
      };
    }
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }

  /**
   * Pin exactly to Top Left (with margin & safe area)
   */
  public getTopLeft(): Phaser.Math.Vector2 {
    const sa = this.getSafeArea();
    const margin = this.getMargin();
    return new Phaser.Math.Vector2(sa.left + margin, sa.top + margin);
  }

  /**
   * Pin exactly to Top Right (with margin & safe area)
   */
  public getTopRight(): Phaser.Math.Vector2 {
    const sa = this.getSafeArea();
    const margin = this.getMargin();
    return new Phaser.Math.Vector2(this.scene.scale.width - sa.right - margin, sa.top + margin);
  }

  /**
   * Anchor to Bottom Left (with margin & safe area)
   */
  public getBottomLeft(): Phaser.Math.Vector2 {
    const sa = this.getSafeArea();
    const margin = this.getMargin();
    return new Phaser.Math.Vector2(sa.left + margin, this.scene.scale.height - sa.bottom - margin);
  }

  /**
   * Pin to Bottom Right (with margin & safe area)
   */
  public getBottomRight(): Phaser.Math.Vector2 {
    const sa = this.getSafeArea();
    const margin = this.getMargin();
    return new Phaser.Math.Vector2(this.scene.scale.width - sa.right - margin, this.scene.scale.height - sa.bottom - margin);
  }

  /**
   * Mathematically centered coordinates
   */
  public getCenter(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(this.scene.scale.width / 2, this.scene.scale.height / 2);
  }

  /**
   * Mathematically centered top position
   */
  public getTopCenter(): Phaser.Math.Vector2 {
    const sa = this.getSafeArea();
    const margin = this.getMargin();
    return new Phaser.Math.Vector2(this.scene.scale.width / 2, sa.top + margin);
  }

  /**
   * Mathematically centered bottom position
   */
  public getBottomCenter(): Phaser.Math.Vector2 {
    const sa = this.getSafeArea();
    const margin = this.getMargin();
    return new Phaser.Math.Vector2(this.scene.scale.width / 2, this.scene.scale.height - sa.bottom - margin);
  }
}
