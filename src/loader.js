/**
 * @typedef {import('webpack').loader.LoaderContext} LoaderContext
 * @typedef {import('./index').Options} Options
 * @typedef {import('webpack').compilation.Compilation} Compilation
 */

const loaderUtils = require('loader-utils')

/**
 * @this {LoaderContext}
 * @param {string} content
 */
export default function loader(content) {
  /** @type {Options} */
  const url = content.match(/"(\S+)"/)[1]
  if(!url) throw new Error("url can not be empty")
  /**
   * @type {Options}
   */
  const options = loaderUtils.getOptions(this)
  /**
   * @type {Compilation}
   */
  const compilation = this._compilation
  compilation.hooks.linkFile.call(url, options)
  this.callback(null, content)
  return
}
