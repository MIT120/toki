module.exports = {
    extends: ['next/core-web-vitals'],
    root: true,
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    env: {
        browser: true,
        node: true,
        es2022: true,
    },
    rules: {
        // Add any custom rules here
        '@next/next/no-html-link-for-pages': 'error',
        'react/no-unescaped-entities': 'off',
        '@next/next/no-page-custom-font': 'off',
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
}; 