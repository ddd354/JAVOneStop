const webpack = require('webpack');
const resolve = require('path').resolve;

const config = {
 devtool: 'eval-source-map',
 entry: __dirname + '/JavHelper/static/webHelper/entry.jsx',
 output:{
      path: resolve('JavHelper/static/js'),
      filename: 'webHelper.js',
      publicPath: resolve('JavHelper/static/js')
},
 resolve: {
  extensions: ['.js','.jsx','.css']
 },
 module: {
  rules: [
  {
   test: /\.jsx?/,
   loader: 'babel-loader',
   exclude: /node_modules/,
   query:{
     presets: ['react','es2015']
   }
  },
  {
         test: /\.css$/,
         use: [
            'style-loader',
            'css-loader'
         ]
  }]
 }
};

module.exports = config;