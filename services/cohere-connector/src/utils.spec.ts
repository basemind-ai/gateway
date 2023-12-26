import { CohereModel, CoherePromptRequest } from 'gen/cohere/v1/cohere';
import { StreamFinishReason } from 'shared/constants';

import { createCohereRequest, getFinishReason } from '@/utils';

describe('utils tests', () => {
	describe('createCohereRequest', () => {
		it('returns a GenerateRequest with the correct model', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);

			expect(result).toEqual({
				model: 'command',
				prompt: 'hello world',
			});
		});

		it('returns a GenerateRequest with the correct conversationId', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				model: 'command',
				prompt: 'hello world',
			});
		});

		it('returns a GenerateRequest with the correct temperature', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.5,
				},
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				model: 'command',
				prompt: 'hello world',
				temperature: 0.5,
			});
		});

		it('handles temperature being 0 without removing it', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0,
				},
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				model: 'command',
				prompt: 'hello world',
				temperature: 0,
			});
		});

		it('does not add connectors when the grpcRequest connectors is an empty array', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.5,
				},
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				model: 'command',
				prompt: 'hello world',
				temperature: 0.5,
			});
		});

		it('does not add connectors when the grpcRequest connectors is undefined', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.5,
				},
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				model: 'command',
				prompt: 'hello world',
				temperature: 0.5,
			});
		});
	});

	describe('getFinishReason', () => {
		it('returns the correct finish reason for a complete event', () => {
			expect(getFinishReason('COMPLETE')).toEqual(
				StreamFinishReason.DONE,
			);
		});
		it('returns the correct finish reason for an error limit event', () => {
			expect(getFinishReason('MAX_TOKENS')).toEqual(
				StreamFinishReason.LIMIT,
			);
		});
		it('returns the correct finish reason for an error event', () => {
			expect(getFinishReason('ERROR')).toEqual(StreamFinishReason.ERROR);
		});
		it('returns the correct finish reason for an error toxic event', () => {
			expect(getFinishReason('ERROR_TOXIC')).toEqual(
				StreamFinishReason.ERROR,
			);
		});
	});
});
