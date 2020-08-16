/** @type {import('prettier').Options} */
module.exports = {
  semi: false,
  trailingComma: 'none',
  singleQuote: true,
  tabWidth: 2,
  printWidth: 80,
  arrowParens: 'always',
  overrides: [
    {
      files: '*.js',
      options: {
        parser: 'jsdoc-parser'
      }
    }
  ]
}
