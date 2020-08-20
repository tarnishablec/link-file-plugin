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
         * @param {Options} options
         */
        (url, options) => {
          let opt = this.urls.get(url)
          this.urls.set(url, opt ? mergeOptions(opt, options) : options)
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
 * @returns {Options[]}
 */
function mergeOptions(opt1, opt2) {
  const { rels: rels1, slient: slient1, ...attrs1 } = opt1
  const { rels: rels2, slient: slient2, ...attrs2 } = opt2
  const keys = [...Object.keys(attrs1), ...Object.keys(attrs2)]
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (attrs1[key] !== attrs2[key]) {
      return [opt1, opt2]
    }
  }
  const rels = [...new Set([...rels1, ...rels2])]
  return [{ rels, slient: slient1 || slient2, ...attrs1 }]
}

LinkFilePlugin.loader = require.resolve('./loader')
export default LinkFilePlugin
