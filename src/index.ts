import HtmlWebpackPlugin from 'html-webpack-plugin'
import { load } from 'cheerio'
import { SyncHook } from 'tapable'
import { yellowBright } from 'chalk'
import type webpack from 'webpack'

type LinkAttr = Partial<
  Pick<
    HTMLLinkElement,
    | 'as'
    | 'crossOrigin'
    | 'disabled'
    | 'href'
    | 'hreflang'
    | 'imageSizes'
    | 'imageSrcset'
    | 'integrity'
    | 'charset'
    | 'media'
    | 'type'
  >
>

type RelType =
  | 'alternate'
  | 'author'
  | 'canonical'
  | 'dns-prefetch'
  | 'help'
  | 'icon'
  | 'license'
  | 'manifest'
  | 'next'
  | 'pingback'
  | 'preconnect'
  | 'prefetch'
  | 'preload'
  | 'prerender'
  | 'prev'
  | 'search'
  | 'shortlink'
  | 'stylesheet'

type Option = {
  rels?: RelType[]
  slient?: boolean
} & LinkAttr

export class LinkFilePlugin {
  static loader = require.resolve('./loader')
  urls: Map<string, Option[]>

  protected static hooks = new WeakMap<
    webpack.Compilation,
    { linkFile: SyncHook<[string, Option]> }
  >()

  static getHooks(
    compilation: webpack.Compilation
  ): { linkFile: SyncHook<[string, Option]> } | undefined {
    return LinkFilePlugin.hooks.get(compilation)
  }

  constructor() {
    this.urls = new Map()
  }
  apply(compiler: webpack.Compiler): void {
    const pluginName = LinkFilePlugin.name

    if (Reflect.get(compiler.hooks, 'linkFile'))
      throw new Error('Hooks Existed!')

    compiler.hooks.shouldEmit.tap(
      pluginName,
      (compilation: webpack.Compilation) => {
        if (HtmlWebpackPlugin) {
          HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
            pluginName,
            (htmlPluginData, cb) => {
              const { assets } = compilation
              const keys = Object.keys(assets)
              const dels: string[] = []
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
                    `<link rel="${
                      rels?.filter(Boolean).join(' ') ?? ''
                    }" href="${url}" ${attr}>`
                  )
                  !slient &&
                    console.log(yellowBright(`inject ${url} to your template`))
                })
              })
              htmlPluginData.html = $.html()
              cb(null, htmlPluginData)
              // debugger
            }
          )
        }
        return false
      }
    )

    compiler.hooks.compilation.tap(
      pluginName,
      (compilation: webpack.Compilation) => {
        // this.links = []
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        LinkFilePlugin.hooks.set(compilation, {
          linkFile: new SyncHook<[string, Option]>(['url', 'option'])
        })
        const linkFileHook = LinkFilePlugin.getHooks(compilation)?.linkFile
        linkFileHook?.tap(
          pluginName,
          /**
           * @param {string} url
           * @param {Option} option
           */
          (url: string, option: Option) => {
            const opts = this.urls.get(url)
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
      }
    )
  }
}

function shouldMergeOptions(opt1: Option, opt2: Option) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rels: rels1, slient: slient1, ...attrs1 } = opt1
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { rels: rels2, slient: slient2, ...attrs2 } = opt2
  const keys = [...Object.keys(attrs1), ...Object.keys(attrs2)]
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (attrs1[key] !== attrs2[key]) {
      return false
    }
  }
  return true
}

function mergeOptions(opt1: Option, opt2: Option) {
  const { rels: rels1, slient: slient1 } = opt1
  const { rels: rels2, slient: slient2 } = opt2
  opt1.rels = [...new Set([...(rels1 ?? []), ...(rels2 ?? [])])]
  opt1.slient = slient1 || slient2
}

// LinkFilePlugin.loader = require.resolve('./loader')
