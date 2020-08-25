/** @typedef {import('rollup').RollupOptions} RollupOptions */

import path from 'path'

/** @type {RollupOptions[]} */
const config = [
  {
    input: path.resolve('./src/index.js'),
    output: {
      file: path.resolve('./dist/index.js'),
      format: 'cjs',
      esModule: true
    }
  },
  {
    input: path.resolve('./src/loader.js'),
    output: { file: path.resolve('./dist/loader.js'), format: 'cjs' }
  }
]

export default config
