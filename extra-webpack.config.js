const webpack = require("webpack");
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

const webpackConfig = {
    resolve: {
      alias: {
        'lodash-es': 'lodash', // our internal tests showed that lodash is a little bit smaller as lodash-es
      }
    },
    plugins: [
        // https://github.com/chartjs/Chart.js/issues/4303
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
        // new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
        new LodashModuleReplacementPlugin()
      ]
}

module.exports = webpackConfig