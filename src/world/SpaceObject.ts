import Phaser from 'phaser';

export abstract class SpaceObject extends Phaser.GameObjects.Container {
  protected id: string;
  protected objectName: string;
  protected radius: number;
  protected isCulled = false;

  constructor(scene: Phaser.Scene, x: number, y: number, id: string, name: string, radius: number) {
    super(scene, x, y);
    this.id = id;
    this.objectName = name;
    this.radius = radius;

    (scene.add as unknown as { existing: (go: unknown) => void }).existing(this);
  }

  public abstract update(playerX: number, playerY: number, delta: number): void;

  /**
   * Culls the object, hiding its elements and stopping animation logic when far away.
   */
  public setCull(cull: boolean): void {
    if (this.isCulled === cull) return;
    this.isCulled = cull;
    this.setVisible(!cull);
    this.setActive(!cull);
  }

  public getRadius(): number {
    return this.radius;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.objectName;
  }
}
