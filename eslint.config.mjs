// @ts-check
// Configuration ESLint générée par @nuxt/eslint, complétée par nos règles (ADR 0007).
import withNuxt from './.nuxt/eslint.config.mjs';
import eslintConfigPrettier from 'eslint-config-prettier';

export default withNuxt(
  {
    rules: {
      'arrow-parens': 'off',
      semi: ['error', 'always'],
      'space-before-function-paren': ['error', 'never'],
      'no-template-curly-in-string': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
  // En dernier : désactive les règles de mise en forme, laissées au formateur (oxfmt).
  eslintConfigPrettier,
);
