import { PassThrough } from 'node:stream';

import { CohereClient } from 'cohere-ai';
import { GenerateRequest } from 'cohere-ai/api/client/requests/GenerateRequest';
import { loadEnv } from 'shared/env';
import logger from 'shared/logger';

const ref: { instance: BasemindCohereClient | null } = { instance: null };

/*
 * The client class wraps the Cohere client because the Cohere client doesn't support streaming for the time being.
 * */
export class BasemindCohereClient {
	private readonly token: string;
	private readonly client: CohereClient;
	constructor({ token, ...rest }: { token: string } & CohereClient.Options) {
		this.token = token;
		this.client = new CohereClient({ token, ...rest });
	}

	async tokenize(text: string, model: string): Promise<number> {
		const result = await this.client.tokenize({ model, text });
		return result.tokens.length;
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

		if (!response.ok || response.status !== 200 || !response.body) {
			const message = await response.text();
			logger.error(`received non-200 response: ${message}`);
			throw new Error(`received error response from cohere: ${message}`);
		}

		return response.body as unknown as PassThrough;
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
