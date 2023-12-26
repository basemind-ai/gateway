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

type OpenAIModels =
	| 'gpt-4-0613'
	| 'gpt-4-32k'
	| 'gpt-3.5-turbo'
	| 'gpt-3.5-turbo-16k';

const modelMap: Record<OpenAIModel, OpenAIModels> = {
	[OpenAIModel.OPEN_AI_MODEL_UNSPECIFIED]: 'gpt-3.5-turbo',
	[OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K]: 'gpt-3.5-turbo',
	[OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_16K]: 'gpt-3.5-turbo-16k',
	[OpenAIModel.OPEN_AI_MODEL_GPT4_8K]: 'gpt-4-0613',
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
	content_filter: StreamFinishReason.DONE,
	function_call: StreamFinishReason.DONE,
	length: StreamFinishReason.LIMIT,
	stop: StreamFinishReason.DONE,
	tool_calls: StreamFinishReason.DONE,
};

/**
 * The getOpenAIModel function takes in a string that represents the OpenAI model
 * and returns the corresponding Hugging Face model.
 *
 * @param requestModel a member of the OpenAIModel enum
 * @return A string identifier of the OpenAI model to use
 */
export function getOpenAIModel(requestModel: OpenAIModel): OpenAIModels {
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

/**
 * The createOpenAIRequest function takes in a request object and returns an OpenAI API request body.
 * The function is used to create the body of the POST requests that are sent to OpenAI's API.

 * @param request  OpenAIPromptRequest Create the request body for the openai api
 * @param stream  boolean Determine whether or not the request should be streamed
 * @return An ChatCompletionCreateParamsStreaming or ChatCompletionCreateParamsNonStreaming request object
 */
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
		frequency_penalty: frequencyPenalty,
		max_tokens: !!maxTokens && maxTokens > 0 ? maxTokens : undefined,
		messages: messages.map<ChatCompletionMessageParam>((msg) => {
			const { content, role, name, ...rest } = msg;
			return {
				content: content?.trim() ? content.trim() : null,
				name: name?.trim() ? name.trim() : undefined,
				role: getOpenAIMessageRole(role),
				...rest,
			} as ChatCompletionMessageParam;
		}),
		model: getOpenAIModel(model),
		presence_penalty: presencePenalty,
		stream,
		temperature,
		top_p: topP,
		user: applicationId,
	};
}
