/**
 * Typography tokens — font families, sizes, weights.
 * Use these constants in all Phaser Text style objects.
 */
export const Typography = {
  // --- Font Families ---
  // High-definition modern sci-fi typography for sharp, clear rendering on Retina & mobile
  fontMono: '"Rajdhani", "Orbitron", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
  fontSans: '"Orbitron", "Rajdhani", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

  // --- Font Sizes ---
  size: {
    xs:   '11px',
    sm:   '13px',
    base: '15px',
    md:   '18px',
    lg:   '22px',
    xl:   '28px',
    '2xl':'36px',
    '3xl':'48px',
    '4xl':'64px',
  },

  // --- Font Weights (Phaser fontStyle strings) ---
  weight: {
    normal: 'normal',
    bold: 'bold',
  },

  // --- Line Heights (used in multi-line text) ---
  lineSpacing: {
    tight: 2,
    normal: 6,
    relaxed: 10,
  },
} as const;
