/* eslint-disable */
module.exports = {
  env: {
    browser: true,
    es2020: true,
  },
  extends: [
    'closure-es6'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
    'quote-props': 'off',
    'no-console': [
      'error',
      {
        allow: [
          'error',
        ]
      },
    ],
    'no-unused-vars': [
      'error',
      {
         'argsIgnorePattern': '^_',
      }
    ],
  },
  globals: {
    analytics: 'readonly',
    exports: 'readonly',
    firebase: 'readonly',
  },
};
