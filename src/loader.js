/**
 * @typedef {import('webpack').loader.LoaderContext} LoaderContext
 * @typedef {import('./index').Options} Options
 * @typedef {import('webpack').compilation.Compilation} Compilation
 */

const loaderUtils = require('loader-utils')

/**
 * @param {string} content
 * @this {LoaderContext}
 */
export default function loader(content) {
  const matches = content.match(/"(\S+)"/)
  const url = matches && matches[1]
  if (!url) throw new Error('url can not be empty')
  /** @type {Options} */
  const options = loaderUtils.getOptions(this)
  /** @type {Compilation} */
  const compilation = this._compilation
  // debugger
  /** @type {import('tapable').SyncHook} */
  const linkFileHook = Reflect.get(compilation.hooks, 'linkFile')
  linkFileHook.call(url, options)
  this.callback(null, content)
  return
}
