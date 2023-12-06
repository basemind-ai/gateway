import { mockEnv } from 'tests/mocks';

import { expectedEnvVariables, register } from '@/instrumentation';

describe('register tests', () => {
	const originalEnv = process.env;

	afterAll(() => {
		process.env = originalEnv;
	});

	describe('validates env', () => {
		beforeEach(() => {
			Object.assign(process.env, mockEnv);
		});

		it('does not throw when all env variables are present', () => {
			expect(register).not.toThrow();
		});

		it.each(expectedEnvVariables)(
			'throws if %s is not set or empty',
			(key: string) => {
				Reflect.deleteProperty(process.env, key);
				expect(register).toThrow();

				Reflect.set(process.env, key, '');
				expect(register).toThrow();
			},
		);
	});
});
