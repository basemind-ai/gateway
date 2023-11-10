import { loadEnv } from 'shared/env';
import { afterAll, beforeEach } from 'vitest';

import { getCohereClient } from '@/client';

describe('client tests', () => {
	describe('getCohereClient', () => {
		const openAPIKey = process.env.COHERE_API_KEY ?? 'abc';
		beforeEach(() => {
			process.env.COHERE_API_KEY = openAPIKey;
		});
		afterAll(() => {
			process.env.COHERE_API_KEY = openAPIKey;
		});

		it('should return a singleton', () => {
			const client1 = getCohereClient();
			const client2 = getCohereClient();
			expect(client1).toBe(client2);
			delete process.env.COHERE_API_KEY;
		});

		it('should throw an error when COHERE_API_KEY is missing', () => {
			delete process.env.COHERE_API_KEY;
			expect(() => loadEnv('COHERE_API_KEY')).toThrow();
		});
	});
});
