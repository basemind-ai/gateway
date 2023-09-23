import { loadEnv } from 'shared/env';
import { afterAll, beforeEach } from 'vitest';

import { getOpenAIClient } from '@/client';

describe('client tests', () => {
	describe('getOpenAIClient', () => {
		const openAPIKey = process.env.OPEN_AI_API_KEY ?? 'abc';
		beforeEach(() => {
			process.env.OPEN_AI_API_KEY = openAPIKey;
		});
		afterAll(() => {
			process.env.OPEN_AI_API_KEY = openAPIKey;
		});

		it('should return a singleton', () => {
			const client1 = getOpenAIClient();
			const client2 = getOpenAIClient();
			expect(client1).toBe(client2);
			delete process.env.OPEN_AI_API_KEY;
		});

		it('should throw an error when OPEN_AI_API_KEY is missing', () => {
			delete process.env.OPEN_AI_API_KEY;
			expect(() => loadEnv('OPEN_AI_API_KEY')).toThrow();
		});
	});
});
