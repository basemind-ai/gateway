import { Status } from '@grpc/grpc-js/build/src/constants';
import { Metadata } from '@grpc/grpc-js/build/src/metadata';
import {
	createInternalGrpcError,
	extractProviderAPIKeyFromMetadata,
} from 'shared/grpc';

describe('GRPC utils tests', () => {
	describe('createInternalGrpcError tests', () => {
		it('should create an internal grpc error', () => {
			const error = new Error('test error');
			const grpcError = createInternalGrpcError(error);

			expect(grpcError.code).toBe(Status.INTERNAL);
			expect(grpcError.details).toBe(error.message);
		});
	});
	describe('extractProviderAPIKeyFromMetadata tests', () => {
		it('should extract the provider API key from the metadata', () => {
			const md = new Metadata();
			md.set('X-API-Key', 'test');
			const call = {
				metadata: md,
			};
			const apiKey = extractProviderAPIKeyFromMetadata(call as any);
			expect(apiKey).toBe('test');
		});

		it('should return undefined if the provider API key is not present in the metadata', () => {
			const md = new Metadata();
			const call = {
				metadata: md,
			};
			const apiKey = extractProviderAPIKeyFromMetadata(call as any);
			expect(apiKey).toBeUndefined();
		});
	});
});
