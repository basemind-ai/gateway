import { loadEnv } from 'shared/env';

describe('env utils', () => {
	describe('loadEnv tests', () => {
		it('should throw an error if the environment variable is not set', () => {
			expect(() => {
				loadEnv('TEST_ENV_VAR');
			}).toThrowError('Missing environment variable: TEST_ENV_VAR');
		});
		it('should return the environment variable if it is set', () => {
			process.env.TEST_ENV_VAR = 'test';
			expect(loadEnv('TEST_ENV_VAR')).toEqual('test');
			delete process.env.TEST_ENV_VAR;
		});
		it('should return the fallback if the environment variable is not set', () => {
			expect(loadEnv('TEST_ENV_VAR', 'fallback')).toEqual('fallback');
		});
	});
});
