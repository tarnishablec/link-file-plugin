import type webpack from 'webpack'
import { getOptions } from 'loader-utils'

export default function loader(
  this: webpack.loader.LoaderContext,
  content: string
): void {
  const url = content.match(/"(\S+)"/)?.[1] ?? ''
  if (!url) throw new Error('url can not be empty')
  const options = getOptions(this)
  const compilation: webpack.compilation.Compilation = this._compilation
  // debugger
  const linkFileHook = Reflect.get(compilation.hooks, 'linkFile')
  linkFileHook.call(url, options)
  this.callback(null, content)
  return
}
