import { OpenAI } from 'openai';
import { loadEnv } from 'shared/utils';

const ref: { instance: OpenAI | null } = { instance: null };

export const OPEN_AI_ORGANIZATION_NAMESPACE = 'BaseMind.AI';

export function getOpenAIClient(): OpenAI {
	if (!ref.instance) {
		const apiKey = loadEnv('OPEN_AI_API_KEY');
		const organization = OPEN_AI_ORGANIZATION_NAMESPACE;
		ref.instance = new OpenAI({
			apiKey,
			organization,
		});
	}
	return ref.instance;
}
