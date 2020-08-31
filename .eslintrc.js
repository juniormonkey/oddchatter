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
  },
  globals: {
    exports: 'readonly',
    firebase: 'readonly',
  },
};
