import { OpenAI } from 'openai';
import { loadEnv } from 'shared/env';

const ref: { instance: OpenAI | null } = { instance: null };

export const OPEN_AI_ORGANIZATION_NAMESPACE = 'BaseMind.AI';

/**
 * The getOpenAIClient function is a singleton that returns an instance of the OpenAI client.
 * This function will only create one instance of the OpenAI client, and return it every time it's called.
 *
 * @return An OpenAI class instance
 */
export function getOpenAIClient(): OpenAI {
	if (!ref.instance) {
		const apiKey = loadEnv('OPEN_AI_API_KEY');
		// FIXME: we cannot set organization until we have an official user
		//const organization = OPEN_AI_ORGANIZATION_NAMESPACE;
		ref.instance = new OpenAI({
			apiKey,
			organization: null,
		});
	}
	return ref.instance;
}

/*
 * Creates an OpenAI client instance if an API key is provided, otherwise returns the singleton instance.
 *
 * @return An OpenAI class instance
 * */
export function createOrDefaultClient(apiKey?: string): OpenAI {
	if (apiKey) {
		return new OpenAI({
			apiKey,
			organization: null,
		});
	}
	return getOpenAIClient();
}
