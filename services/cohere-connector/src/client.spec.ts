import { loadEnv } from 'shared/env';
import { afterAll, beforeEach } from 'vitest';

import { createOrDefaultClient, getCohereClient } from '@/client';

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
	describe('createOrDefaultClient', () => {
		it('should return a new client if an API key is provided', () => {
			const client = getCohereClient();
			const newClient = createOrDefaultClient('abc');
			expect(client).not.toBe(newClient);
		});
		it('should return a singleton if an API key is not provided', () => {
			const client = getCohereClient();
			const newClient = createOrDefaultClient();
			expect(client).toBe(newClient);
		});
	});
});
