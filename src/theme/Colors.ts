/**
 * Centralized color palette for Deep Space UI.
 * All hex values must be used here — never hardcode colors in UI components.
 */
export const Colors = {
  // --- Brand / Primary ---
  primary: '#38bdf8',       // Sky-400 — main neon accent
  primaryDark: '#0284c7',   // Sky-600 — stroke, border
  primaryDim: '#0369a1',    // Sky-700 — inactive

  // --- State Colors ---
  success: '#22c55e',       // Green-500
  warning: '#eab308',       // Yellow-500
  danger: '#ef4444',        // Red-500
  dangerDark: '#b91c1c',    // Red-700
  info: '#06b6d4',          // Cyan-500

  // --- Buff Colors ---
  buffRapidFire: '#eab308', // Yellow-500
  buffDamage: '#ef4444',    // Red-500
  buffSpeed: '#06b6d4',     // Cyan-500
  buffShield: '#3b82f6',    // Blue-500
  buffHealth: '#22c55e',    // Green-500

  // --- Text ---
  textPrimary: '#f8fafc',   // Slate-50
  textSecondary: '#94a3b8', // Slate-400
  textMuted: '#475569',     // Slate-600
  textAccent: '#38bdf8',    // Sky-400

  // --- Backgrounds ---
  bgDeep: '#020617',        // Slate-950 — game background
  bgPanel: '#0f172a',       // Slate-900 — panel bg
  bgOverlay: '#020617',     // Overlay fill (use with alpha)
  bgCard: '#1e293b',        // Slate-800 — card / bar track
  bgCardBorder: '#475569',  // Slate-600 — card border

  // --- Numeric hex versions for Phaser Graphics calls ---
  hex: {
    primary: 0x38bdf8,
    primaryDark: 0x0284c7,
    success: 0x22c55e,
    warning: 0xeab308,
    danger: 0xef4444,
    dangerDark: 0xb91c1c,
    info: 0x06b6d4,
    buffShield: 0x3b82f6,
    textPrimary: 0xf8fafc,
    bgDeep: 0x020617,
    bgCard: 0x1e293b,
    bgCardBorder: 0x475569,
  },
} as const;
