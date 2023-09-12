import {
	OpenAIMessageRole,
	OpenAIModel,
	OpenAIPromptRequest,
} from 'gen/openai/v1/openai';
import { expect } from 'vitest';

import {
	createOpenAIRequest,
	getOpenAIMessageRole,
	getOpenAIModel,
} from '@/utils';

describe('utils tests', () => {
	describe('getOpenAIModel', () => {
		it('should return the correct model', () => {
			expect(getOpenAIModel(OpenAIModel.OPEN_AI_MODEL_UNSPECIFIED)).toBe(
				'gpt-3.5-turbo',
			);
			expect(
				getOpenAIModel(OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K),
			).toBe('gpt-3.5-turbo');
			expect(
				getOpenAIModel(OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_16K),
			).toBe('gpt-3.5-turbo-16k');
			expect(getOpenAIModel(OpenAIModel.OPEN_AI_MODEL_GPT4_8K)).toBe(
				'gpt-4',
			);
			expect(getOpenAIModel(OpenAIModel.OPEN_AI_MODEL_GPT4_32K)).toBe(
				'gpt-4-32k',
			);
		});
	});
	describe('getOpenAIMessageRole', () => {
		it('should return the correct message role', () => {
			expect(
				getOpenAIMessageRole(
					OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_UNSPECIFIED,
				),
			).toBe('system');
			expect(
				getOpenAIMessageRole(
					OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
				),
			).toBe('user');
			expect(
				getOpenAIMessageRole(
					OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_SYSTEM,
				),
			).toBe('system');
			expect(
				getOpenAIMessageRole(
					OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_ASSISTANT,
				),
			).toBe('assistant');
			expect(
				getOpenAIMessageRole(
					OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_FUNCTION,
				),
			).toBe('function');
		});
	});
	describe('createOpenAIRequest', () => {
		it('should return a stream request object when stream is true', () => {
			const request: OpenAIPromptRequest = {
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
			};
			const result = createOpenAIRequest(request, true);
			expect(result.stream).toBeTruthy();
		});

		it('should include all required fields in the OpenAIPromptRequest object', () => {
			const request: OpenAIPromptRequest = {
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
			};
			const result = createOpenAIRequest(request, true);
			expect(result.model).toBe('gpt-3.5-turbo');
			expect(result.messages).toHaveLength(1);
		});

		it('should include optional fields in the OpenAIPromptRequest object', () => {
			const request: OpenAIPromptRequest = {
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
				temperature: 0.8,
				topP: 0.9,
				maxTokens: 100,
				userId: '123',
				presencePenalty: 0.5,
				frequencyPenalty: 0.3,
			};
			const result = createOpenAIRequest(request, true);
			expect(result.temperature).toBe(request.temperature);
			expect(result.top_p).toBe(request.topP);
			expect(result.max_tokens).toBe(request.maxTokens);
			expect(result.user).toBe(request.userId);
			expect(result.presence_penalty).toBe(request.presencePenalty);
			expect(result.frequency_penalty).toBe(request.frequencyPenalty);
		});

		it('should handle default values for optional fields in the OpenAIPromptRequest object', () => {
			const request: OpenAIPromptRequest = {
				model: OpenAIModel.OPEN_AI_MODEL_GPT3_5_TURBO_4K,
				messages: [
					{
						content: 'test',
						role: OpenAIMessageRole.OPEN_AI_MESSAGE_ROLE_USER,
					},
				],
			};
			const result = createOpenAIRequest(request, true);
			expect(result.temperature).toBeUndefined();
			expect(result.top_p).toBeUndefined();
			expect(result.max_tokens).toBeUndefined();
			expect(result.user).toBeUndefined();
			expect(result.presence_penalty).toBeUndefined();
			expect(result.frequency_penalty).toBeUndefined();
		});
	});
});
