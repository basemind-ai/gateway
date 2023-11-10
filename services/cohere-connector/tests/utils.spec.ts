import {
	CohereConnector,
	CohereConnectorType,
	CohereModel,
	CoherePromptRequest,
} from 'gen/cohere/v1/cohere';

import { createCohereRequest, getCohereConnectors } from '@/utils';

describe('utils tests', () => {
	describe('getCohereConnectors', () => {
		it('returns an empty array if the input is empty', () => {
			expect(getCohereConnectors([])).toEqual([]);
		});

		it('returns id type connectors correctly', () => {
			const connectors = [
				{ id: CohereConnectorType.ID, options: {} },
			] as CohereConnector[];
			expect(getCohereConnectors(connectors)).toEqual([
				{ id: 'id', options: {} },
			]);
		});

		it('returns web-search type connectors correctly', () => {
			const connectors = [
				{ id: CohereConnectorType.WEB_SEARCH, options: {} },
			] as CohereConnector[];
			expect(getCohereConnectors(connectors)).toEqual([
				{ id: 'web-search', options: {} },
			]);
		});

		it('filters our unspecified connectors', () => {
			const connectors = [
				{ id: CohereConnectorType.WEB_SEARCH, options: {} },
				{ id: CohereConnectorType.ID, options: {} },
				{ id: CohereConnectorType.UNSPECIFIED, options: {} },
			] as CohereConnector[];
			expect(getCohereConnectors(connectors)).toEqual([
				{ id: 'web-search', options: {} },
				{ id: 'id', options: {} },
			]);
		});
	});

	describe('createCohereRequest', () => {
		it('returns a ChatRequest with the correct model', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				message: 'hello world',
				model: 'command',
			});
		});

		it('returns a ChatRequest with the correct conversationId', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
				conversationId: '123',
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				message: 'hello world',
				model: 'command',
				conversationId: '123',
			});
		});

		it('returns a ChatRequest with the correct temperature', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.5,
					connectors: [],
				},
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				message: 'hello world',
				model: 'command',
				temperature: 0.5,
			});
		});

		it('handles temperature being 0 without removing it', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0,
					connectors: [],
				},
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				message: 'hello world',
				model: 'command',
				temperature: 0,
			});
		});

		it('returns a ChatRequest with the correct connectors', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.5,
					connectors: [
						{
							id: CohereConnectorType.WEB_SEARCH,
							options: {},
						},
					],
				},
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				message: 'hello world',
				model: 'command',
				temperature: 0.5,
				connectors: [
					{
						id: 'web-search',
						options: {},
					},
				],
			});
		});

		it('does not add connectors when the grpcRequest connectors is an empty array', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.5,
					connectors: [],
				},
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				message: 'hello world',
				model: 'command',
				temperature: 0.5,
			});
		});

		it('does not add connectors when the grpcRequest connectors is undefined', () => {
			const grpcRequest = {
				message: 'hello world',
				model: CohereModel.COMMAND,
				parameters: {
					temperature: 0.5,
					connectors: [],
				},
			} satisfies CoherePromptRequest;
			const result = createCohereRequest(grpcRequest);
			expect(result).toEqual({
				message: 'hello world',
				model: 'command',
				temperature: 0.5,
			});
		});
	});
});
