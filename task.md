# Task Checklist

## Phase 9 — Mobile-First Portrait Mode Redesign
- [x] 1. Remove forced landscape (deleted Rotate Device overlay & portrait blocker)
- [x] 2. Switch from `FIT` to `RESIZE` scale mode in `gameConfig.ts`
- [x] 3. Create `UILayoutManager` as the authority for dynamic layout adjustments
- [x] 4. Camera responsive zoom: Portrait (1.25x zoom), Desktop (1.0x) with smooth interpolation
- [x] 5. Health Bar redesign: 20px height, centered HP text, rounded pill, green gradient fill
- [x] 6. Score Panel: compact top-right in portrait, standard on desktop
- [x] 7. Weapon Panel: anchored to bottom-left (above joystick in portrait)
- [x] 8. Timer: bottom-right (above fire button in portrait)
- [x] 9. Wave Banner: top-center, smaller on mobile, hides after 2 seconds
- [x] 10. Settings & Debug: HUD Scale, Control Size, Camera Zoom, Debug toggles (persisted via localStorage)
- [x] 11. Clean TypeScript build output

## Phase 10 — UI Alignment & Spaceship Visual Redesign
- [x] 1. Create `src/ui/UILayout.ts` as the layout coordinates system exposing getTopLeft(), getTopRight(), etc.
- [x] 2. Fix standard margins: Desktop (24px), Tablet (20px), Mobile (16px)
- [x] 3. Align Health Panel perfectly to Top Left (with standard margin)
- [x] 4. Align Score Panel perfectly to Top Right (symmetrical to Health Panel)
- [x] 5. Anchor Weapon Card to Bottom Left, always above safe area and never overlapping joystick
- [x] 6. Align Timer to Bottom Right
- [x] 7. Align Notification Stack to Bottom Right above the timer, stacking upwards (max 5)
- [x] 8. Center Wave Banner mathematically (`x = scene.scale.width / 2`, origin `0.5`)
- [x] 9. Center Pause Menu using `camera.centerX` / `camera.centerY`
- [x] 10. Center Game Over Panel using `camera.centerX` / `camera.centerY` with all children positioned relative to container center (0, 0)
- [x] 11. Create `ShipFactory.ts` to procedurally draw spaceships in layers
- [x] 12. Redesign Player Interceptor: modern futuristic geometry, electric blue body, light cyan glass canopy, navy outline, orange engine exhaust
- [x] 13. Redesign Enemies: Scout (red/crimson), Elite (gold/orange), Boss (large dreadnought slate/slate-grey)
- [x] 14. Animate Engine Flame: separate texture, pulses with sin(time), scales dynamically based on state (idle, moving, firing)
- [x] 15. Visual Scaling: scaled player ship model up by 15% without affecting collision box size (`setSize(64, 48)`)
- [x] 16. Adjust weapon spawn point muzzle offset to X = 34
- [x] 17. Verify production build compiles cleanly (`npm run build`)
