// noinspection JSUnusedGlobalSymbols

import { Server } from '@grpc/grpc-js';
import { Metadata } from '@grpc/grpc-js/build/src/metadata';
import { createServer, extractProviderAPIKeyFromMetadata } from 'shared/grpc';
import { expect } from 'vitest';

describe('gRPC utils tests', () => {
	describe('createServer', () => {
		const bindAsyncSpy = vi.spyOn(Server.prototype, 'bindAsync');

		it('should create a new server instance and add the provided service and implementation', () => {
			const serviceDefinition = {
				test: {
					originalName: 'Test',
					path: '/test/Test',
					requestDeserialize: (bytes: any) => bytes,
					requestSerialize: (value: any) =>
						Buffer.from(new ArrayBuffer(value)),
					requestStream: false,
					responseDeserialize: (bytes: any) => bytes,
					responseSerialize: (value: any) =>
						Buffer.from(new ArrayBuffer(value)),
					responseStream: false,
				},
			};

			const implementation = { test: () => null };
			const server = createServer({
				implementation,
				port: 4000,
				service: serviceDefinition,
			});
			expect(server).toBeInstanceOf(Server);
			expect(bindAsyncSpy).toHaveBeenCalledWith(
				'0.0.0.0:4000',
				expect.anything(),
				expect.anything(),
			);
		});
	});
	describe('extractProviderAPIKeyFromMetadata', () => {
		it('should return the API key from the metadata', () => {
			const metadata = new Metadata();
			metadata.add('X-API-KEY', 'test');

			const result = extractProviderAPIKeyFromMetadata({
				metadata,
			} as any);
			expect(result).toBe('test');
		});
		it('should return undefined if the API key is not present in the metadata', () => {
			const metadata = new Metadata();

			const result = extractProviderAPIKeyFromMetadata({
				metadata,
			} as any);
			expect(result).toBeUndefined();
		});
	});
});
