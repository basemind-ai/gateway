const rules = {
	'@typescript-eslint/no-extraneous-class': 0,
	'@typescript-eslint/no-magic-numbers': 0,
	'sonarjs/elseif-without-else': 0,
};

const project = ['./tsconfig.json', './ts-services/**/tsconfig.json'];

const settings = {
	'import/parsers': {
		'@typescript-eslint/parser': ['.ts'],
	},
	'import/resolver': {
		typescript: {
			project,
		},
	},
};

module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		tsconfigRootDir: __dirname,
		project,
	},
	settings,
	ignorePatterns: [
		'.eslintrc.js',
		'**/*.js',
		'*.js',
		'ts-services/**/gen/**/*.*',
	],
	extends: ['@tool-belt/eslint-config'],
	rules,
	overrides: [
		{
			files: ['**/*.spec.ts'],
			extends: ['@tool-belt/eslint-config', 'plugin:vitest/recommended'],
			rules,
		},
	],
};
