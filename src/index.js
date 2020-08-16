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
    /** @type {Map<string, Options>} */
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
          this.urls.set(url, options)
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
            this.urls.forEach((opt, url) => {
              const { rels, slient, ...attrs } = opt

              const attr = Object.entries(attrs).reduce((acc, [k, v]) => {
                return `${acc} ${`${k}="${v}"`}`
              }, '')

              $('head').append(
                `<link rel="${rels
                  .filter(Boolean)
                  .join(' ')}" href="${url}" ${attr}>`
              )
              !slient &&
                console.log(yellowBright(`inject ${url} to your template`))
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

LinkFilePlugin.loader = require.resolve('./loader')
export default LinkFilePlugin
