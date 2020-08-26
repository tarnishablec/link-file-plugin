/** @typedef {import('rollup').RollupOptions} RollupOptions */

import path from 'path'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'

/** @type {RollupOptions[]} */
const config = [
  {
    input: path.resolve('./src/index.js'),
    output: { file: path.resolve('./dist/index.js'), format: 'cjs' },
    plugins: [getBabelOutputPlugin({ presets: ['@babel/preset-env'] })]
  },
  {
    input: path.resolve('./src/loader.js'),
    output: { file: path.resolve('./dist/loader.js'), format: 'cjs' },
    plugins: [getBabelOutputPlugin({ presets: ['@babel/preset-env'] })]
  }
]

export default config
