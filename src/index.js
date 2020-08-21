// @ts-check

import HtmlWebpackPlugin from 'html-webpack-plugin'
import { load } from 'cheerio'
import { SyncHook } from 'tapable'
import { yellowBright } from 'chalk'

/**
 * @typedef {import('webpack').Compiler} Compiler
 * @typedef {Partial<
 *   Pick<
 *     HTMLLinkElement,
 *     | 'as'
 *     | 'crossOrigin'
 *     | 'disabled'
 *     | 'href'
 *     | 'hreflang'
 *     | 'imageSizes'
 *     | 'imageSrcset'
 *     | 'integrity'
 *     | 'charset'
 *     | 'media'
 *     | 'type'
 *   >
 * >} LinkAttr
 * @typedef {  | 'alternate'
 *   | 'author'
 *   | 'canonical'
 *   | 'dns-prefetch'
 *   | 'help'
 *   | 'icon'
 *   | 'license'
 *   | 'manifest'
 *   | 'next'
 *   | 'pingback'
 *   | 'preconnect'
 *   | 'prefetch'
 *   | 'preload'
 *   | 'prerender'
 *   | 'prev'
 *   | 'search'
 *   | 'shortlink'
 *   | 'stylesheet'} RelType
 * @typedef {{
 *   rels?: RelType[]
 *   slient?: boolean
 * } & LinkAttr} Options
 */

class LinkFilePlugin {
  constructor() {
    /** @type {Map<string, Options[]>} */
    this.urls = new Map()
  }
  /** @param {Compiler} compiler */
  apply(compiler) {
    const pluginName = LinkFilePlugin.name

    if (Reflect.get(compiler.hooks, 'linkFile'))
      throw new Error('Hooks Existed!')

    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      // this.links = []
      Reflect.set(
        compilation.hooks,
        'linkFile',
        new SyncHook(['url', 'options'])
      )
      compilation.hooks['linkFile'].tap(
        pluginName,
        /**
         * @param {string} url
         * @param {Options} option
         */
        (url, option) => {
          let opts = this.urls.get(url)
          if (!opts) {
            this.urls.set(url, [option])
          } else {
            for (let i = 0; i < opts.length; i++) {
              const opt = opts[i]
              const should = shouldMergeOptions(opt, option)
              if (should) {
                mergeOptions(opt, option)
                return
              }
            }
            this.urls.set(url, [...opts, option])
          }
        }
      )

      if (HtmlWebpackPlugin) {
        HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tap(
          pluginName,
          (htmlPluginData) => {
            const { assets } = compilation
            const keys = Object.keys(assets)

            const dels = []
            this.urls.forEach((_, link) => {
              if (!keys.includes(link)) {
                dels.push(link)
              }
            })
            dels.forEach((del) => {
              this.urls.delete(del)
            })

            const { html } = htmlPluginData
            const $ = load(html, { decodeEntities: false })
            this.urls.forEach((opts, url) => {
              opts.forEach((opt) => {
                const { rels, slient, ...attrs } = opt

                const attr = Object.entries(attrs).reduce(
                  (acc, [k, v]) => `${acc} ${`${k}="${v}"`}`,
                  ''
                )

                $('head').append(
                  `<link rel="${rels
                    .filter(Boolean)
                    .join(' ')}" href="${url}" ${attr}>`
                )
                !slient &&
                  console.log(yellowBright(`inject ${url} to your template`))
              })
            })
            htmlPluginData.html = $.html()
            return htmlPluginData
            // debugger
          }
        )
      }
    })
  }
}

/**
 * @param {Options} opt1
 * @param {Options} opt2
 * @returns {boolean}
 */
function shouldMergeOptions(opt1, opt2) {
  // eslint-disable-next-line no-unused-vars
  const { rels: rels1, slient: slient1, ...attrs1 } = opt1
  // eslint-disable-next-line no-unused-vars
  const { rels: rels2, slient: slient2, ...attrs2 } = opt2
  const keys = [...Object.keys(attrs1), ...Object.keys(attrs2)]
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (attrs1[key] !== attrs2[key]) {
      return false
    }
  }
  return true
}

/**
 * @param {Options} opt1
 * @param {Options} opt2
 * @returns {Options}
 */
function mergeOptions(opt1, opt2) {
  const { rels: rels1, slient: slient1 } = opt1
  const { rels: rels2, slient: slient2 } = opt2
  opt1.rels = [...new Set([...rels1, ...rels2])]
  opt1.slient = slient1 || slient2
}

LinkFilePlugin.loader = require.resolve('./loader')
export default LinkFilePlugin
