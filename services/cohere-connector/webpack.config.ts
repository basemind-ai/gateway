import path from 'node:path';

import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { Issue } from 'fork-ts-checker-webpack-plugin/lib/issue';
import NodemonPlugin from 'nodemon-webpack-plugin';
import { PinoWebpackPlugin } from 'pino-webpack-plugin';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import type { Configuration } from 'webpack';
import nodeExternals from 'webpack-node-externals';

const isDevelopment = process.env.NODE_ENV === 'development';

const config: Configuration = {
	devtool: isDevelopment ? 'eval-source-map' : 'inline-source-map',
	entry: path.resolve(__dirname, 'src', 'index.ts'),
	externals: [nodeExternals()],
	externalsPresets: { node: true },
	module: {
		rules: [
			{
				exclude: /node_modules/,
				test: /\.tsx?$/,
				use: [
					{
						loader: 'ts-loader',
						options: {
							configFile: 'tsconfig.build.json',
						},
					},
				],
			},
		],
	},
	optimization: {
		nodeEnv: process.env.NODE_ENV,
		splitChunks: false,
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist'),
	},
	plugins: [
		new ForkTsCheckerWebpackPlugin({
			issue: {
				exclude: [
					(issue: Issue) => {
						return !!issue.file?.includes(
							'/node_modules/.pnpm/openai',
						);
					},
				],
			},
			typescript: { configFile: 'tsconfig.build.json' },
		}),
		new NodemonPlugin(),
		new PinoWebpackPlugin({
			transports: isDevelopment ? ['pino-pretty'] : [],
		}),
	],
	resolve: {
		alias: {
			gen: path.resolve(__dirname, '../../gen/ts'),
			shared: path.resolve(__dirname, '../../shared/ts/src'),
		},
		extensions: ['.ts', '.js', '.json'],
		modules: [
			path.resolve(__dirname, '../../node_modules'),
			path.resolve(__dirname, '../../gen/ts'),
			path.resolve(__dirname, '../../shared/ts/src'),
		],
		plugins: [new TsconfigPathsPlugin()],
	},
};

export default config;
