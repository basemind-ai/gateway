import { OpenAI } from 'openai';

const singleton: OpenAI | null = null;

function getClient(): OpenAI {
	if (!singleton) {
		throw new Error('OpenAI client not initialized');
	}
	return singleton;
}
