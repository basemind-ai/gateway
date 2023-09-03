import path from 'node:path';

import tsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import type { Configuration } from 'webpack';
import nodeExternals from 'webpack-node-externals';

const isDevelopment = process.env.NODE_ENV === 'development';

const config: Configuration = {
	entry: path.resolve(__dirname, 'src', 'index.ts'),
	devtool: isDevelopment ? 'eval-source-map' : 'inline-source-map',
	externalsPresets: { node: true },
	externals: [nodeExternals()],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		alias: {
			gen: path.resolve(__dirname, '../../gen/ts'),
		},
		modules: [
			path.resolve(__dirname, '../../node_modules'),
			path.resolve(__dirname, '../../gen/ts'),
		],
		extensions: ['.ts', '.js', '.json'],
		plugins: [new tsconfigPathsPlugin()],
	},
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname, 'dist'),
	},
};
export default config;
