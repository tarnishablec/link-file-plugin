import type webpack from 'webpack'
import { getOptions } from 'loader-utils'

export default function loader(this: any, content: string): void {
  const url = content.match(/"(\S+)"/)?.[1] ?? ''
  if (!url) throw new Error('url can not be empty')
  const options = getOptions(this)
  // debugger
  const compilation: webpack.Compilation = this._compilation
  const linkFileHook = Reflect.get(compilation, '_link_customHooks')
  linkFileHook?.call(url, options)
  this.callback(null, content)
  return
}
