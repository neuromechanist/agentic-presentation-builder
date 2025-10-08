/**
 * Theme utilities
 * Converts JSON theme definitions to CSS variables
 */

/**
 * Default theme colors
 */
const DEFAULT_THEMES = {
  default: {
    colors: {
      primary: '#2563EB',
      background: '#FFFFFF',
      text: '#1E293B',
      accent: '#10B981'
    },
    fonts: {
      heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  },
  light: {
    colors: {
      primary: '#3B82F6',
      background: '#F8FAFC',
      text: '#0F172A',
      accent: '#14B8A6'
    },
    fonts: {
      heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  },
  dark: {
    colors: {
      primary: '#60A5FA',
      background: '#0F172A',
      text: '#F1F5F9',
      accent: '#34D399'
    },
    fonts: {
      heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }
  },
  academic: {
    colors: {
      primary: '#1E40AF',
      background: '#FFFFFF',
      text: '#1F2937',
      accent: '#059669'
    },
    fonts: {
      heading: 'Georgia, serif',
      body: 'Georgia, serif'
    }
  },
  minimal: {
    colors: {
      primary: '#000000',
      background: '#FFFFFF',
      text: '#000000',
      accent: '#6B7280'
    },
    fonts: {
      heading: 'system-ui, sans-serif',
      body: 'system-ui, sans-serif'
    }
  }
};

/**
 * Get theme definition
 * @param {string} themeName - Theme name
 * @param {object} customTheme - Custom theme override
 * @returns {object} Theme definition
 */
export function getTheme(themeName = 'default', customTheme = null) {
  const baseTheme = DEFAULT_THEMES[themeName] || DEFAULT_THEMES.default;

  if (!customTheme) {
    return baseTheme;
  }

  // Merge custom theme with base theme
  return {
    colors: {
      ...baseTheme.colors,
      ...(customTheme.colors || {})
    },
    fonts: {
      ...baseTheme.fonts,
      ...(customTheme.fonts || {})
    }
  };
}

/**
 * Convert theme to CSS variables
 * @param {object} theme - Theme definition
 * @returns {string} CSS variable declarations
 */
export function themeToCss(theme) {
  const cssVars = [];

  // Color variables
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      cssVars.push(`  --theme-${key}: ${value};`);
    });
  }

  // Font variables
  if (theme.fonts) {
    Object.entries(theme.fonts).forEach(([key, value]) => {
      cssVars.push(`  --font-${key}: ${value};`);
    });
  }

  return `:root {\n${cssVars.join('\n')}\n}`;
}

/**
 * Generate inline CSS for theme
 * @param {string} themeName - Theme name
 * @param {object} customTheme - Custom theme override
 * @returns {string} CSS string
 */
export function generateThemeCSS(themeName, customTheme) {
  const theme = getTheme(themeName, customTheme);
  return themeToCss(theme);
}

export default {
  getTheme,
  themeToCss,
  generateThemeCSS
};
