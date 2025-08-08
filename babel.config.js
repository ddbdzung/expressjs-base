module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: '18', // Minimum Node.js version
        },
        modules: 'commonjs', // CommonJS for Node.js compatibility
        useBuiltIns: 'usage', // Only include polyfills that are used
        corejs: {
          version: 3,
          proposals: true, // Include stage 3 proposals
        },
      },
    ],
  ],
  plugins: [
    // Essential plugins for modern JavaScript
    '@babel/plugin-transform-runtime',

    // Class properties syntax
    [
      '@babel/plugin-transform-class-properties',
      {
        loose: true,
      },
    ],

    // Private methods and properties
    [
      '@babel/plugin-transform-private-methods',
      {
        loose: true,
      },
    ],

    // Private property in object
    [
      '@babel/plugin-transform-private-property-in-object',
      {
        loose: true,
      },
    ],

    // Object rest spread
    '@babel/plugin-transform-object-rest-spread',

    // Optional chaining (?.)
    '@babel/plugin-transform-optional-chaining',

    // Nullish coalescing (??)
    '@babel/plugin-transform-nullish-coalescing-operator',

    // Dynamic imports
    '@babel/plugin-syntax-dynamic-import',

    // Top-level await support
    '@babel/plugin-syntax-top-level-await',
  ],

  // Environment-specific configurations
  env: {
    development: {
      sourceMaps: 'inline',
      retainLines: true,
      comments: true,
      ignore: ['**/*.test.js', '**/*.spec.js'],
    },
    production: {
      comments: false,
      plugins: [
        // Remove console.log statements in production
        [
          'babel-plugin-transform-remove-console',
          {
            exclude: ['error', 'warn', 'info'],
          },
        ],
      ],
      ignore: ['**/*.test.js', '**/*.spec.js'],
    },
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' },
            modules: 'commonjs',
          },
        ],
      ],
      plugins: ['@babel/plugin-transform-runtime'],
      ignore: ['dist', 'build', 'coverage'],
    },
  },

  // Files/directories to ignore
  ignore: ['dist', 'build', 'coverage'],

  // Only process JavaScript files
};
