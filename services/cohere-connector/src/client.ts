import { CohereClient } from 'cohere-ai';
import { loadEnv } from 'shared/env';

const ref: { instance: CohereClient | null } = { instance: null };

/**
 * The getCohereClient function is a singleton that returns an instance of the Cohere client.
 * This function will only create one instance of the Cohere client, and return it every time it's called.
 *
 * @return An Cohere class instance
 */
export function getCohereClient(): CohereClient {
	if (!ref.instance) {
		const apiKey = loadEnv('COHERE_API_KEY');

		ref.instance = new CohereClient({
			token: apiKey,
		});
	}
	return ref.instance;
}
