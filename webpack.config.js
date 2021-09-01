const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

const DIST_PATH = path.resolve(__dirname, 'dist');

module.exports = {
    entry: './src/background.js',
    devtool: 'source-map',
    output: {
        filename: 'background.js',
        path: DIST_PATH,
        clean: true
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'manifest.json', to: path.resolve(DIST_PATH, 'manifest.json')
                }
            ]
        })
    ],
    module: {
        rules: [
            {
                test: /\.zip$/i,
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