module.exports = {
    entry: __dirname + '/lib/index.js',
    output: {
        path: __dirname + '/dist',
        filename: 'mobx-bind.umd.js',
        libraryTarget: 'umd'
    },
    externals: [
        'mobx'
    ]
};
