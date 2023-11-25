const rules = {};

const tsWebRules = {
	...rules,
	'@next/next/no-html-link-for-pages': 0,
};

const project = [
	'./tsconfig.json',
	'./frontend/tsconfig.json',
	'./services/*/tsconfig.json',
];

const settings = {
	'import/parsers': {
		'@typescript-eslint/parser': ['.ts', '.tsx'],
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
	ignorePatterns: ['.eslintrc.js', '**/*.js', '*.js', 'gen/**/*.*'],
	extends: ['@tool-belt/eslint-config'],
	rules,
	overrides: [
		{
			files: ['services/**/tests/**/*.ts'],
			extends: ['@tool-belt/eslint-config', 'plugin:vitest/recommended'],
			rules,
		},
		{
			files: ['frontend/**/*.{ts,tsx}'],
			excludedFiles: [
				'frontend/**/tests/**/*.{ts,tsx}',
				'frontend/**/*.spec.{ts,tsx}',
			],
			extends: [
				'@tool-belt/eslint-config/react',
				'plugin:@next/next/recommended',
			],
			rules: tsWebRules,
		},
		{
			files: [
				'frontend/tests/**/*.{ts,tsx}',
				'frontend/**/*.spec.{ts,tsx}',
			],
			extends: [
				'@tool-belt/eslint-config/react',
				'plugin:vitest/recommended',
			],
			rules: {
				...tsWebRules,
				'testing-library/no-wait-for-side-effects': 0,
			},
		},
	],
};
