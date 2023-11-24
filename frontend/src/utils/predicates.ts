import { OpenAIContentMessage, OpenAIPromptMessage } from '@/types';

export function isOpenAIContentMessage(
	message: OpenAIPromptMessage,
): message is OpenAIContentMessage {
	return message.role !== 'function';
}
