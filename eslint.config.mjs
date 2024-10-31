import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    { files: ['**/*.{js,mjs,cjs,ts}'] },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        rules: {
            curly: ['error', 'all'],
            'no-unused-vars': ['error', { caughtErrors: 'none' }],
            '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
        },
    },
];
