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
      secondary: '#10B981',
      background: '#FFFFFF',
      text: '#1E293B',
      textSecondary: '#64748B',
      accent: '#F59E0B',
      border: '#E2E8F0'
    },
    fonts: {
      heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      code: '"SF Mono", Monaco, "Cascadia Code", monospace'
    },
    spacing: {
      slidePadding: '40px',
      elementGap: '1rem',
      sectionGap: '2rem'
    },
    borders: {
      radius: '4px',
      width: '1px'
    },
    shadows: {
      small: '0 1px 3px rgba(0,0,0,0.12)',
      medium: '0 4px 6px rgba(0,0,0,0.1)',
      large: '0 10px 15px rgba(0,0,0,0.1)'
    }
  },
  light: {
    colors: {
      primary: '#3B82F6',
      secondary: '#14B8A6',
      background: '#F8FAFC',
      text: '#0F172A',
      textSecondary: '#475569',
      accent: '#8B5CF6',
      border: '#CBD5E1'
    },
    fonts: {
      heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      code: '"SF Mono", Monaco, "Cascadia Code", monospace'
    },
    spacing: {
      slidePadding: '40px',
      elementGap: '1rem',
      sectionGap: '2rem'
    },
    borders: {
      radius: '6px',
      width: '1px'
    },
    shadows: {
      small: '0 1px 3px rgba(0,0,0,0.08)',
      medium: '0 4px 6px rgba(0,0,0,0.06)',
      large: '0 10px 15px rgba(0,0,0,0.08)'
    }
  },
  dark: {
    colors: {
      primary: '#60A5FA',
      secondary: '#34D399',
      background: '#0F172A',
      text: '#F1F5F9',
      textSecondary: '#94A3B8',
      accent: '#A78BFA',
      border: '#334155'
    },
    fonts: {
      heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      code: '"SF Mono", Monaco, "Cascadia Code", monospace'
    },
    spacing: {
      slidePadding: '40px',
      elementGap: '1rem',
      sectionGap: '2rem'
    },
    borders: {
      radius: '4px',
      width: '1px'
    },
    shadows: {
      small: '0 1px 3px rgba(0,0,0,0.3)',
      medium: '0 4px 6px rgba(0,0,0,0.4)',
      large: '0 10px 15px rgba(0,0,0,0.5)'
    }
  },
  academic: {
    colors: {
      primary: '#1E40AF',
      secondary: '#059669',
      background: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      accent: '#DC2626',
      border: '#D1D5DB'
    },
    fonts: {
      heading: 'Georgia, "Times New Roman", serif',
      body: 'Georgia, "Times New Roman", serif',
      code: '"Courier New", Courier, monospace'
    },
    spacing: {
      slidePadding: '50px',
      elementGap: '1.25rem',
      sectionGap: '2.5rem'
    },
    borders: {
      radius: '2px',
      width: '2px'
    },
    shadows: {
      small: '0 1px 2px rgba(0,0,0,0.05)',
      medium: '0 2px 4px rgba(0,0,0,0.05)',
      large: '0 4px 8px rgba(0,0,0,0.05)'
    }
  },
  minimal: {
    colors: {
      primary: '#000000',
      secondary: '#404040',
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#737373',
      accent: '#525252',
      border: '#E5E5E5'
    },
    fonts: {
      heading: 'system-ui, -apple-system, sans-serif',
      body: 'system-ui, -apple-system, sans-serif',
      code: '"Menlo", monospace'
    },
    spacing: {
      slidePadding: '60px',
      elementGap: '1.5rem',
      sectionGap: '3rem'
    },
    borders: {
      radius: '0px',
      width: '1px'
    },
    shadows: {
      small: 'none',
      medium: 'none',
      large: 'none'
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
    },
    spacing: {
      ...baseTheme.spacing,
      ...(customTheme.spacing || {})
    },
    borders: {
      ...baseTheme.borders,
      ...(customTheme.borders || {})
    },
    shadows: {
      ...baseTheme.shadows,
      ...(customTheme.shadows || {})
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

  // Spacing variables
  if (theme.spacing) {
    Object.entries(theme.spacing).forEach(([key, value]) => {
      cssVars.push(`  --spacing-${key}: ${value};`);
    });
  }

  // Border variables
  if (theme.borders) {
    Object.entries(theme.borders).forEach(([key, value]) => {
      cssVars.push(`  --border-${key}: ${value};`);
    });
  }

  // Shadow variables
  if (theme.shadows) {
    Object.entries(theme.shadows).forEach(([key, value]) => {
      cssVars.push(`  --shadow-${key}: ${value};`);
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
