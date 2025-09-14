/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  // Enable dark mode support
  darkMode: ["class"],
  
  // Content paths for Tailwind to scan
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  
  // Prefix for Tailwind classes (if needed)
  prefix: "",
  
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Custom colors for the SUS game theme
      colors: {
        // Semantic color system
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Primary colors
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        
        // Secondary colors
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        
        // Destructive colors (for game actions)
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        
        // Muted colors
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        // Accent colors
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        
        // Popover colors
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        
        // Card colors
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // Game-specific colors
        traitor: {
          DEFAULT: "#dc2626", // red-600
          light: "#fee2e2",   // red-50
          dark: "#991b1b",    // red-800
        },
        crew: {
          DEFAULT: "#2563eb", // blue-600
          light: "#dbeafe",   // blue-50
          dark: "#1e40af",    // blue-800
        },
        pot: {
          DEFAULT: "#f59e0b", // amber-500
          light: "#fef3c7",   // amber-50
          dark: "#d97706",    // amber-600
        },
      },
      
      // Border radius system
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      
      // Font family system
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        mono: ["var(--font-source-code-pro)", ...fontFamily.mono],
      },
      
      // Animation system
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.3s ease-out",
        "pulse-slow": "pulse-slow 3s ease-in-out infinite",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
      },
      
      // Spacing system extensions
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Typography extensions
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      
      // Screen size extensions for game layouts
      screens: {
        'xs': '475px',
        '3xl': '1920px',
      },
      
      // Box shadow extensions
      boxShadow: {
        'game': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'game-hover': '0 8px 24px rgba(0, 0, 0, 0.15)',
        'inner-game': 'inset 0 2px 8px rgba(0, 0, 0, 0.1)',
      },
      
      // Backdrop blur extensions
      backdropBlur: {
        xs: '2px',
      },
      
      // Z-index extensions
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  
  // Tailwind plugins
  plugins: [
    // Tailwind CSS Animate plugin for animations
    require("tailwindcss-animate"),
    
    // Custom plugin for game-specific utilities
    function({ addUtilities, addComponents, theme }) {
      // Game-specific utility classes
      const gameUtilities = {
        '.game-card': {
          '@apply bg-card text-card-foreground rounded-lg border shadow-game': {},
        },
        '.game-button': {
          '@apply inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50': {},
        },
        '.game-input': {
          '@apply flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50': {},
        },
        '.traitor-glow': {
          '@apply ring-2 ring-traitor/50 shadow-lg shadow-traitor/25': {},
        },
        '.crew-glow': {
          '@apply ring-2 ring-crew/50 shadow-lg shadow-crew/25': {},
        },
        '.pot-glow': {
          '@apply ring-2 ring-pot/50 shadow-lg shadow-pot/25': {},
        },
      };
      
      // Game-specific component classes
      const gameComponents = {
        '.lobby-player-card': {
          '@apply game-card p-4 transition-all hover:shadow-game-hover': {},
          '&.active': {
            '@apply crew-glow': {},
          },
          '&.eliminated': {
            '@apply opacity-50 grayscale': {},
          },
        },
        '.voting-card': {
          '@apply game-card p-6 cursor-pointer transition-all hover:shadow-game-hover': {},
          '&:hover': {
            '@apply scale-[1.02]': {},
          },
          '&.selected': {
            '@apply traitor-glow': {},
          },
        },
        '.game-header': {
          '@apply flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b': {},
        },
        '.chat-message': {
          '@apply rounded-lg p-3 max-w-sm break-words': {},
          '&.own': {
            '@apply bg-crew text-crew-foreground ml-auto': {},
          },
          '&.other': {
            '@apply bg-muted text-muted-foreground': {},
          },
          '&.system': {
            '@apply bg-pot text-pot-foreground text-center': {},
          },
        },
      };
      
      addUtilities(gameUtilities);
      addComponents(gameComponents);
      
      // Responsive typography scale
      const responsiveTypography = {
        '.text-responsive-sm': {
          fontSize: theme('fontSize.sm[0]'),
          lineHeight: theme('fontSize.sm[1].lineHeight'),
          '@screen md': {
            fontSize: theme('fontSize.base[0]'),
            lineHeight: theme('fontSize.base[1].lineHeight'),
          },
        },
        '.text-responsive-base': {
          fontSize: theme('fontSize.base[0]'),
          lineHeight: theme('fontSize.base[1].lineHeight'),
          '@screen md': {
            fontSize: theme('fontSize.lg[0]'),
            lineHeight: theme('fontSize.lg[1].lineHeight'),
          },
        },
        '.text-responsive-lg': {
          fontSize: theme('fontSize.lg[0]'),
          lineHeight: theme('fontSize.lg[1].lineHeight'),
          '@screen md': {
            fontSize: theme('fontSize.xl[0]'),
            lineHeight: theme('fontSize.xl[1].lineHeight'),
          },
        },
        '.text-responsive-xl': {
          fontSize: theme('fontSize.xl[0]'),
          lineHeight: theme('fontSize.xl[1].lineHeight'),
          '@screen md': {
            fontSize: theme('fontSize.2xl[0]'),
            lineHeight: theme('fontSize.2xl[1].lineHeight'),
          },
        },
      };
      
      addUtilities(responsiveTypography);
    },
  ],
}