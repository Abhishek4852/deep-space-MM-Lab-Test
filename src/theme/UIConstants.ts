/**
 * Global UI constants — z-depths, animation durations, bar sizes, border radii.
 */
export const UIConstants = {
  // --- Render Depths (z-order) ---
  depth: {
    world:        -10,   // Starfield background
    game:           0,   // Game entities (default)
    effects:      100,   // Explosions, damage numbers
    hudBackground: 90,   // HUD panel backgrounds
    hud:          100,   // HUD elements
    notification: 200,   // Toast notifications
    waveBanner:   300,   // Wave banners
    mobileControls: 400, // Virtual joystick + fire button
    overlay:      500,   // Pause, settings, game over
    debug:       9999,   // Debug panel — always on top
  } as Record<string, number>,

  // --- Animation Durations (ms) ---
  // Typed as Record<string, number> to prevent literal narrowing (Phaser expects number, not 150|300 etc.)
  duration: {
    instant:   0,
    fast:    150,
    normal:  300,
    slow:    500,
    verySlow: 800,
  } as Record<string, number>,

  // --- Health Bar Dimensions ---
  healthBar: {
    width:  220,
    height:  16,
    radius:   4,
  },

  // --- Buff Icon Dimensions ---
  buffIcon: {
    size:    36,
    gap:      6,
    ringWidth: 3,
  },

  // --- Notification ---
  notification: {
    maxVisible:     5,
    lifetime:    2200,   // ms before auto-dismiss
    slideDistance:  80,  // px slide-in travel
  },

  // --- Mobile Controls ---
  joystick: {
    baseRadius:   70,
    thumbRadius:  30,
    deadzone:     12,
  },
  fireButton: {
    radius: 60,
  },

  // --- Border Radii ---
  radius: {
    sm:  4,
    md:  8,
    lg: 12,
    pill: 999,
  },

  // --- Breakpoints (game canvas width) ---
  breakpoint: {
    mobile:  480,
    tablet:  768,
    desktop: 1024,
  },
} as const;
