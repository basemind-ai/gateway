const rules = {};

const tsWebRules = {
	...rules,
	'@next/next/no-html-link-for-pages': 0,
};

const tsWebTestRules = {
	...tsWebRules,
	'no-restricted-imports': [
		'error',
		{
			name: '@testing-library/react',
			message: 'Please use tests/test-utils instead.',
		},
	],
};

const project = [
	'./frontend/tsconfig.json',
	'./services/*/tsconfig.json',
	'./tsconfig.json',
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
			files: ['{frontend,docs}/**/*.{ts,tsx}'],
			excludedFiles: [
				'{frontend,docs}/**/tests/**/*.{ts,tsx}',
				'{frontend,docs}/**/*.spec.{ts,tsx}',
			],
			extends: [
				'@tool-belt/eslint-config/react',
				'plugin:@next/next/recommended',
			],
			rules: tsWebRules,
		},
		{
			files: [
				'{frontend,docs}/tests/**/*.{ts,tsx}',
				'{frontend,docs}/**/*.spec.{ts,tsx}',
			],
			extends: [
				'@tool-belt/eslint-config/react',
				'plugin:vitest/recommended',
			],
			rules: {
				...tsWebTestRules,
				'testing-library/no-wait-for-side-effects': 0,
			},
		},
	],
};
