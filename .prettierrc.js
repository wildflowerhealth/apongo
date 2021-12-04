module.exports = {
    trailingComma: 'all',
    tabWidth: 4,
    semi: true,
    singleQuote: true,
    printWidth: 100,
    arrowParens: 'avoid',
    overrides: [
        {
            files: 'package.json',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: 'package-lock.json',
            options: {
                tabWidth: 2,
            },
        },
    ],
};
