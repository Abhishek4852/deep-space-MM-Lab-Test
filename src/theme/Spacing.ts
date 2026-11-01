/**
 * Spacing scale — margins, padding, and gaps.
 * Based on an 8px base grid system for consistent visual rhythm.
 */
export const Spacing = {
  /** 4px */  xs:  4,
  /** 8px */  sm:  8,
  /** 12px */ md: 12,
  /** 16px */ lg: 16,
  /** 20px */ xl: 20,
  /** 24px */ '2xl': 24,
  /** 32px */ '3xl': 32,
  /** 48px */ '4xl': 48,

  // --- HUD Design Grid (Phase 8.1 Guidelines) ---
  hudMargin: 24,        // Outer Margin from edge/safe-area
  sectionGap: 16,       // Section Gap between elements
  internalPadding: 12,  // Internal padding inside cards
  borderRadius: 8,      // Standard rounded border corners

  // --- Touch target minimum size ---
  touchTarget: 44,      // 44px minimum touch target (Apple HIG)

  // --- Notification stacking ---
  notificationGap: 8,
  notificationWidth: 280,
} as const;
