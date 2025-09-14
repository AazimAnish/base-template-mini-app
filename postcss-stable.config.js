// PostCSS configuration for stable Tailwind CSS v3
// Migrated from v4 alpha to stable v3 production build

module.exports = {
  plugins: {
    // Tailwind CSS v3 stable
    tailwindcss: {},
    
    // Autoprefixer for cross-browser compatibility
    autoprefixer: {
      // Target the last 2 versions of all browsers
      overrideBrowserslist: [
        'last 2 versions',
        '> 1%',
        'not dead',
        'not ie 11',
      ],
      // Enable flexbox prefixes
      flexbox: 'no-2009',
      // Enable grid prefixes
      grid: 'autoplace',
    },
    
    // CSS optimization for production
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: [
          'default',
          {
            // Disable CSS minification that might break functionality
            discardComments: {
              removeAll: true,
            },
            // Preserve important CSS custom properties
            normalizeWhitespace: true,
            // Optimize calc() expressions
            calc: true,
            // Optimize color values
            colormin: true,
            // Optimize font values
            minifyFontValues: true,
            // Optimize gradient values
            minifyGradients: true,
            // Optimize selector names (be careful with this)
            reduceIdents: false,
            // Merge rules with identical selectors
            mergeRules: true,
            // Remove unused CSS (handled by Tailwind's purge)
            unused: false,
          },
        ],
      },
    }),
  },
};