export default {
    input: 'lib/index.js',
    output: {
        file: 'dist/index.js',
        name: 'mobxBind',
        format: 'umd'
    },
    external: [
        'mobx'
    ]
};
