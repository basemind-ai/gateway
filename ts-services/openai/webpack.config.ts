import path from 'node:path';

import NodemonPlugin from 'nodemon-webpack-plugin';
import { PinoWebpackPlugin } from 'pino-webpack-plugin';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import type { Configuration } from 'webpack';
import nodeExternals from 'webpack-node-externals';

const isDevelopment = process.env.NODE_ENV === 'development';

const config: Configuration = {
	entry: path.resolve(__dirname, 'src', 'index.ts'),
	devtool: isDevelopment ? 'eval-source-map' : 'inline-source-map',
	externalsPresets: { node: true },
	externals: [nodeExternals()],
	plugins: [
		new NodemonPlugin(),
		new PinoWebpackPlugin({
			transports: isDevelopment ? ['pino-pretty'] : [],
		}),
	],
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							configFile: 'tsconfig.build.json',
						},
					},
				],
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		alias: {
			gen: path.resolve(__dirname, '../../gen/ts/proto'),
		},
		modules: [
			path.resolve(__dirname, '../../node_modules'),
			path.resolve(__dirname, '../../gen/ts/proto'),
		],
		extensions: ['.ts', '.js', '.json'],
		plugins: [new TsconfigPathsPlugin()],
	},
	optimization: {
		splitChunks: false,
		nodeEnv: process.env.NODE_ENV ?? 'production',
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
	},
};

export default config;
