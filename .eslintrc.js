module.exports = {
  root: true,
  extends: 'airbnb-base',
  env: {
    browser: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    allowImportExportEverywhere: true,
    sourceType: 'module',
    requireConfigFile: false,
  },
  rules: {
    'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
    'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
    'no-param-reassign': [2, { props: false }], // allow modifying properties of param
  },
  overrides: [
    {
      files: ['tools/experimentation-ui-tests/*.{js,mjs}'],
      rules: {
        'import/extensions': ['error', { js: 'always', mjs: 'always' }],
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
      },
    },
    {
      files: ['tools/experimentation-ui-tests/*.mjs'],
      env: { node: true },
    },
    {
      files: ['tools/plugins/experimentation/index.js'],
      rules: {
        'import/no-unresolved': ['error', {
          ignore: ['^https://da\\.live/nx/utils/sdk\\.js$'],
        }],
      },
    },
    {
      files: ['tools/experimentation-demo/*.{js,mjs}'],
      rules: {
        'import/extensions': ['error', { js: 'always', mjs: 'always' }],
        'no-console': ['error', { allow: ['log', 'error'] }],
      },
    },
    {
      files: ['tools/experimentation-demo/*.mjs'],
      env: { node: true },
    },
    {
      files: ['tools/experimentation-demo/browser.js', 'tools/experimentation-demo/fixtures.mjs'],
      rules: {
        // DOM cases and staged CLI proposals must run serially.
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
      },
    },
    {
      files: [
        'blocks/discover-coffee-machines/*.js',
        'blocks/find-coffee-by-taste/*.js',
        'blocks/find-frescopa-cafe/*.js',
        'blocks/find-nearby-cafe/*.js',
        'blocks/join-machine-waitlist/*.js',
        'blocks/preview-atelier-routine/*.js',
        'blocks/search-coffee-machines/*.js',
      ],
      rules: {
        // Renderers use hoisted declarations; variables must still be defined first.
        'no-use-before-define': ['error', { functions: false }],
      },
    },
    {
      files: ['blocks/search/search.js', 'postinstall.js'],
      rules: {
        'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      },
    },
    {
      files: ['tools/plugins/helloworld/*.js', 'tools/plugins/contextual-experimentation/*.js'],
      rules: {
        // These modules are resolved by the plugin's browser import map and DA host.
        'import/no-unresolved': ['error', {
          ignore: ['^da-lit$', '^https://da\\.live/nx/utils/sdk\\.js$'],
        }],
      },
    },
    {
      // Adobe Commerce boilerplate code, kept as-is upstream
      files: [
        'scripts/commerce.js',
        'scripts/consent-check.js',
        'scripts/consented.js',
        'scripts/initializers/**/*.js',
        'blocks/product-details/**/*.js',
        'blocks/commerce-cart/**/*.js',
        'blocks/commerce-mini-cart/**/*.js',
        'blocks/commerce-login/**/*.js',
        'blocks/product-list-page/**/*.js',
        'blocks/commerce-create-account/**/*.js',
        'blocks/commerce-confirm-account/**/*.js',
        'blocks/modal/**/*.js',
        'scripts/components/**/*.js',
      ],
      rules: {
        'import/prefer-default-export': 'off',
        'import/no-cycle': 'off',
        'no-use-before-define': [2, { functions: false }],
        'no-console': ['error', { allow: ['warn', 'error', 'info', 'debug'] }],
        'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'no-underscore-dangle': 'off',
      },
    },
    {
      files: ['build.mjs', 'postinstall.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
