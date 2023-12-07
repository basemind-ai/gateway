import { loadEnv } from 'shared/env';
import { afterAll, beforeEach } from 'vitest';

import { createOrDefaultClient, getOpenAIClient } from '@/client';

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

	describe('createOrDefaultClient', () => {
		it('should return a new client if an API key is provided', () => {
			const client = getOpenAIClient();
			const newClient = createOrDefaultClient('abc');
			expect(client).not.toBe(newClient);
		});
		it('should return a singleton if an API key is not provided', () => {
			const client = getOpenAIClient();
			const newClient = createOrDefaultClient();
			expect(client).toBe(newClient);
		});
	});
});
