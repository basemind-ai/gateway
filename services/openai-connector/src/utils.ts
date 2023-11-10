import {
	OpenAIMessageRole,
	OpenAIModel,
	OpenAIPromptRequest,
} from 'gen/openai/v1/openai';
import {
	ChatCompletionCreateParamsNonStreaming,
	ChatCompletionCreateParamsStreaming,
	ChatCompletionMessageParam,
} from 'openai/src/resources/chat/completions';
import { StreamFinishReason } from 'shared/constants';

const modelMap: Record<
	OpenAIModel,
	'gpt-4' | 'gpt-4-32k' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-16k'
> = {
	[OpenAIModel.OPEN_AI_MODEL_UNSPECIFIED]: 'gpt-3.5-turbo',
	[OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K]: 'gpt-3.5-turbo',
	[OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_16K]: 'gpt-3.5-turbo-16k',
	[OpenAIModel.OPEN_AI_MODEL_GPT4_8K]: 'gpt-4',
	[OpenAIModel.OPEN_AI_MODEL_GPT4_32K]: 'gpt-4-32k',
};

const messageRoleMap: Record<
	OpenAIMessageRole,
	ChatCompletionMessageParam['role']
> = {
	[OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_UNSPECIFIED]: 'system',
	[OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER]: 'user',
	[OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_SYSTEM]: 'system',
	[OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_ASSISTANT]: 'assistant',
	[OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_FUNCTION]: 'function',
};

type OpenAIFinishReason =
	| 'stop'
	| 'length'
	| 'tool_calls'
	| 'content_filter'
	| 'function_call';

export const finishReasonMap: Record<OpenAIFinishReason, StreamFinishReason> = {
	stop: StreamFinishReason.DONE,
	length: StreamFinishReason.LIMIT,
	tool_calls: StreamFinishReason.DONE,
	content_filter: StreamFinishReason.DONE,
	function_call: StreamFinishReason.DONE,
};

export function getOpenAIModel(
	requestModel: OpenAIModel,
): 'gpt-4' | 'gpt-4-32k' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-16k' {
	return modelMap[requestModel];
}

export function getOpenAIMessageRole(
	requestRole: OpenAIMessageRole,
): ChatCompletionMessageParam['role'] {
	return messageRoleMap[requestRole];
}

export function createOpenAIRequest(
	request: OpenAIPromptRequest,
	stream: true,
): ChatCompletionCreateParamsStreaming;

export function createOpenAIRequest(
	request: OpenAIPromptRequest,
	stream: false,
): ChatCompletionCreateParamsNonStreaming;

export function createOpenAIRequest(
	request: OpenAIPromptRequest,
	stream: boolean,
):
	| ChatCompletionCreateParamsStreaming
	| ChatCompletionCreateParamsNonStreaming {
	const {
		parameters: {
			topP,
			maxTokens,
			frequencyPenalty,
			presencePenalty,
			temperature,
		} = {},
		messages,
		model,
		applicationId,
	} = request;
	return {
		stream,
		temperature,
		user: applicationId,
		top_p: topP,
		max_tokens: !!maxTokens && maxTokens > 0 ? maxTokens : undefined,
		frequency_penalty: frequencyPenalty,
		presence_penalty: presencePenalty,
		model: getOpenAIModel(model),
		messages: messages.map<ChatCompletionMessageParam>((msg) => {
			const { content, role, ...rest } = msg;
			return {
				content: content ?? null,
				role: getOpenAIMessageRole(role),
				...rest,
			} as ChatCompletionMessageParam;
		}),
	};
}
