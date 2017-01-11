var webpack = require('webpack');
module.exports = {
    entry: __dirname + '/lib/index.js',
    output: {
        libraryTarget: 'umd',
        library: 'mobxBind',
        path: __dirname + '/dist',
        filename: 'mobx-bind.umd.js',
    },
    resolve: {
        modules: [
            __dirname + 'node_modules'
        ],
        extensions: ['.js']
    },
    externals: {
        'mobx': 'mobx'
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ]
};
