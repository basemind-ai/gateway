import { CohereClient } from 'cohere-ai';
import { loadEnv } from 'shared/env';

const ref: { instance: CohereClient | null } = { instance: null };

export function getCohereClient(): CohereClient {
	if (!ref.instance) {
		const apiKey = loadEnv('COHERE_API_KEY');

		ref.instance = new CohereClient({
			token: apiKey,
		});
	}
	return ref.instance;
}
