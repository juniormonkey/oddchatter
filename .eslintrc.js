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
  },
  rules: {
    'no-console': [
      'error',
      {
        allow: [
          'error',
        ]
      },
    ],
  },
  globals: {
    analytics: 'readonly',
    exports: 'readonly',
    firebase: 'readonly',
  },
};
