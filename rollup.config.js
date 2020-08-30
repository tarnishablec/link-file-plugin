/** @typedef {import('rollup').RollupOptions} RollupOptions */

import path from 'path'
import { getBabelOutputPlugin } from '@rollup/plugin-babel'
import ts from '@wessberg/rollup-plugin-ts'

/** @type {RollupOptions[]} */
const config = [
  {
    input: path.resolve('./src/index.ts'),
    output: {
      file: path.resolve('./dist/index.js'),
      format: 'cjs',
      exports: 'auto'
    },
    plugins: [ts(), getBabelOutputPlugin({ presets: ['@babel/preset-env'] })],
    external: ['html-webpack-plugin']
  },
  {
    input: path.resolve('./src/loader.ts'),
    output: {
      file: path.resolve('./dist/loader.js'),
      format: 'cjs',
      exports: 'auto'
    },
    plugins: [ts(), getBabelOutputPlugin({ presets: ['@babel/preset-env'] })]
  }
]

export default config
