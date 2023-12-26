import { CohereClient } from 'cohere-ai';
import { Generation } from 'cohere-ai/api';
import { GenerateRequest } from 'cohere-ai/api/client/requests/GenerateRequest';
import { loadEnv } from 'shared/env';

import { readChunks } from '@/utils';

const ref: { instance: BasemindCohereClient | null } = { instance: null };

/*
 * The client class wraps the Cohere client because the Cohere client doesn't support streaming for the time being.
 * */
class BasemindCohereClient {
	private readonly token: string;
	private readonly client: CohereClient;
	constructor({ token, ...rest }: { token: string } & CohereClient.Options) {
		this.token = token;
		this.client = new CohereClient({ token, ...rest });
	}

	/**
	 * The generate function takes a GenerateRequest and returns a Generation
	 *
	 * @param request GenerateRequest
	 *
	 * @return A Generation
	 */
	async generate(request: GenerateRequest) {
		return this.client.generate(request);
	}

	async generateStream(request: GenerateRequest) {
		const url = 'https://api.cohere.ai/v1/generate';
		const options = {
			body: JSON.stringify({
				...request,
				stream: true,
			}),
			headers: {
				'accept': 'application/json',
				'authorization': `Bearer ${this.token}`,
				'content-type': 'application/json',
			},
			method: 'POST',
		};

		const response = await fetch(url, options);
		const reader = response.body!.getReader();

		return readChunks<{
			finish_reason?: 'COMPLETE' | 'MAX_TOKENS' | 'ERROR' | 'ERROR_TOXIC';
			is_finished: boolean;
			response?: Generation;
			text: string;
		}>(reader);
	}
}

/**
 * The getCohereClient function is a singleton that returns an instance of the Cohere client.
 * This function will only create one instance of the Cohere client, and return it every time it's called.
 *
 * @return An Cohere class instance
 */
export function getCohereClient(): BasemindCohereClient {
	if (!ref.instance) {
		const apiKey = loadEnv('COHERE_API_KEY');

		ref.instance = new BasemindCohereClient({
			token: apiKey,
		});
	}
	return ref.instance;
}

/*
 * Creates a Cohere client instance if an API key is provided, otherwise returns the singleton instance.
 *
 * @return An Cohere class instance
 * */
export function createOrDefaultClient(apiKey?: string): BasemindCohereClient {
	if (apiKey) {
		return new BasemindCohereClient({
			token: apiKey,
		});
	}
	return getCohereClient();
}
