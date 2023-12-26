import { CohereModel, CoherePromptRequest } from 'gen/cohere/v1/cohere';

import { createCohereRequest } from '@/utils';

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
});
