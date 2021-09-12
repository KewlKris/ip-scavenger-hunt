const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

const DIST_PATH = path.resolve(__dirname, 'dist');

module.exports = {
    entry: {
        background: './src/background/background.js',
        popup: './src/popup/popup.js',
        options: './src/options/options.js'
    },
    devtool: 'source-map',
    output: {
        filename: '[name].js',
        path: DIST_PATH,
        clean: true
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'manifest.json', to: path.resolve(DIST_PATH, 'manifest.json')
                },
                {
                    from: './pages', context: '.', to: path.resolve(DIST_PATH)
                },
                {
                    from: './icons', to: path.resolve(DIST_PATH, 'icons')
                }
            ]
        })
    ],
    module: {
        rules: [
            {
                test: /\.(bin|tiny\.geojson)$/i,
                type: 'asset/resource'
            },
            {
                test: /\.m?js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ['@babel/plugin-proposal-object-rest-spread']
                    }
                }
            }
        ]
    }
};