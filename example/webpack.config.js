const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: 'development',
  target: 'web',
  entry: './app.js',
  output: {
    path: __dirname + './dist',
    publicPath: '/',
    filename: 'bundle.js'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['*', '.js', '.jsx']
  },
  devServer: {
    contentBase: './dist',
    port: 3000
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: ['babel-loader']
    }]
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: './index.html',
      filename: './index.html'
    })
  ]
};