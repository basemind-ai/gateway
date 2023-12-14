import { mockEnv } from 'tests/mocks';

import { Env, getEnv } from '@/utils/env';

describe('env utils tests', () => {
	describe('getEnv', () => {
		const originalEnv = process.env;

		afterAll(() => {
			process.env = originalEnv;
		});

		it.each(Object.keys(mockEnv))(
			'should throw an error if %s is not set',
			(key: string) => {
				Reflect.deleteProperty(process.env, key);

				expect(getEnv).toThrow(
					`Missing required environment variables: ${key}`,
				);
			},
		);
		it('should return a parsed env without throwing', () => {
			Reflect.set(process, 'env', mockEnv);

			const result = getEnv();
			for (const [key, value] of Object.entries(mockEnv)) {
				expect(result[key as keyof Env]).toEqual(value);
			}
		});
	});
});
