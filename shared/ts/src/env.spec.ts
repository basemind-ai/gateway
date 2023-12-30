import { loadEnv } from 'shared/env';

describe('env utils test', () => {
	describe('loadEnv tests', () => {
		it('should load an env variable when set', () => {
			process.env.XYZ = '123';

			expect(loadEnv('XYZ')).toBe('123');
		});

		it('should throw an error when env variable is not set', () => {
			expect(() => loadEnv('XXX')).toThrow();
		});

		it('should return the fallback value when env variable is not set', () => {
			expect(loadEnv('XXX', 'ABC')).toBe('ABC');
		});
	});
});
