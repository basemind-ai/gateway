// noinspection JSUnusedGlobalSymbols

import { Server } from '@grpc/grpc-js';
import { createServer } from 'shared/grpc';

describe('gRPC utils tests', () => {
	describe('createServer', () => {
		it('should create a new server instance and add the provided service and implementation', () => {
			const serviceDefinition = {
				test: {
					path: '/test/Test',
					originalName: 'Test',
					requestStream: false,
					responseStream: false,
					responseDeserialize: (bytes: any) => bytes,
					requestDeserialize: (bytes: any) => bytes,
					responseSerialize: (value: any) =>
						Buffer.from(new ArrayBuffer(value)),
					requestSerialize: (value: any) =>
						Buffer.from(new ArrayBuffer(value)),
				},
			};

			const implementation = { test: () => null };
			const server = createServer({
				service: serviceDefinition,
				implementation,
			});
			expect(server).toBeInstanceOf(Server);
		});
	});
});
