const {
    defineConfig,
} = require("eslint/config");

const globals = require("globals");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    languageOptions: {
        globals: {
            ...globals.browser,
            analytics: "readonly",
            exports: "readonly",
            firebase: "readonly",
        },

        ecmaVersion: 12,
        sourceType: "module",
        parserOptions: {},
    },

    extends: compat.extends("closure-es6"),

    rules: {
        "quote-props": "off",

        "no-console": ["error", {
            allow: ["error"],
        }],

        "no-unused-vars": ["error", {
            "argsIgnorePattern": "^_",
        }],
    },
}]);
