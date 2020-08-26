const path = require('path')
const LinkFilePlugin = require('../dist/index')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

/** @type {import('webpack').ConfigurationFactory} */
module.exports = () => {
  return {
    entry: path.resolve(__dirname, './index.js'),
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: '[name].js',
      libraryTarget: 'umd'
    },
    resolve: { extensions: ['.js', '.css'] },
    module: {
      rules: [
        {
          test: /\.css$/,
          oneOf: [
            {
              resourceQuery: /link/,
              rules: [
                {
                  loader: LinkFilePlugin.loader,
                  options: { rels: ['preload'], as: 'style', slient: false }
                },
                {
                  loader: 'file-loader',
                  options: {
                    name: 'css/[contenthash:10].css'
                  }
                },
                { loader: 'extract-loader' },
                { loader: '2string-loader' },
                { loader: 'css-loader' }
              ]
            },
            {
              rules: [
                {
                  loader: LinkFilePlugin.loader,
                  options: { rels: ['stylesheet'], slient: true }
                },
                {
                  loader: 'file-loader',
                  options: {
                    name: 'css/[contenthash:10].css'
                  }
                },
                { loader: 'extract-loader' },
                { loader: '2string-loader' },
                { loader: 'css-loader' }
              ]
            }
          ]
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin({
        cleanAfterEveryBuildPatterns: './dist'
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, './index.html'),
        inject: true,
        filename: 'index.html',
        minify: false
      }),
      new LinkFilePlugin()
    ]
  }
}
