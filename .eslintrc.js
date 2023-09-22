const rules = {
	'@typescript-eslint/no-extraneous-class': 0,
	'@typescript-eslint/no-magic-numbers': 0,
	'@typescript-eslint/no-unsafe-enum-comparison': 0,
	'sonarjs/elseif-without-else': 0,
	'n/no-process-exit': 0,
	'unicorn/no-process-exit': 0,
};

const tsWebRules = {
	...rules,
	'@next/next/no-html-link-for-pages': 0,
	'react-hooks/exhaustive-deps': 0,
	'react/react-in-jsx-scope': 0,
};

const project = [
	'./tsconfig.json',
	'./ts-services/**/tsconfig.json',
	'./ts-web/tsconfig.json',
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
			files: ['ts-services/**/tests/*.ts'],
			extends: ['@tool-belt/eslint-config', 'plugin:vitest/recommended'],
			rules,
		},
		{
			files: ['ts-web/**/*.ts', 'ts-web/**/*.tsx'],
			extends: [
				'@tool-belt/eslint-config/react',
				'plugin:@next/next/recommended',
			],
			rules: tsWebRules,
		},
		{
			files: ['ts-web/tests/*.ts', 'ts-web/tests/*.tsx'],
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
