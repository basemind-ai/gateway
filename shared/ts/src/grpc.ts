import {
	Server,
	ServerCredentials,
	ServerErrorResponse,
	ServerUnaryCall,
	ServerWritableStream,
	ServiceDefinition,
	UntypedServiceImplementation,
} from '@grpc/grpc-js';
import { Status } from '@grpc/grpc-js/build/src/constants';
import { Metadata } from '@grpc/grpc-js/build/src/metadata';
import { HealthImplementation } from 'grpc-health-check';
import logger from 'shared/logger';

/* c8 ignore start */
/**
 * The createServer function creates a gRPC server that implements the given service.
 *
 * @param service the service definition
 * @param implementation the concrete implementation of the service
 * @param port the port to listen on
 *
 * @return A server, which has a bind method that returns
 *
 */
export function createServer<
	T extends ServiceDefinition,
	I extends UntypedServiceImplementation,
>({
	service,
	implementation,
	port,
}: {
	implementation: I;
	port: number;
	service: T;
}): Server {
	const server = new Server();
	server.addService(service, implementation);

	// we add the official health check implementation
	const healthImpl = new HealthImplementation({
		// we set the status to SERVING for all services
		'': 'SERVING',
	});

	healthImpl.addToServer(server);

	// we bind the server to the given port
	// once bound, it will start the gRPC server.
	server.bindAsync(
		`0.0.0.0:${port}`,
		// we can use createInsecure even when deployed to cloud run, since cloud run wraps the service inside a layer
		// of TLS.
		ServerCredentials.createInsecure(),
		(error: Error | null) => {
			if (error) {
				logger.error('Server failed to start');
				process.exit(1);
			}
			logger.info('Server starting');
			logger.info(`Listening on port ${port}`);
			server.start();
		},
	);

	// we handle SIGTERM to gracefully shutdown the server
	process.on('SIGTERM', () => {
		server.tryShutdown((error?: Error) => {
			if (error) {
				logger.error('Server failed to shutdown');
				process.exit(1);
			}
			logger.info('Server shutdown complete');
			process.exit(0);
		});
	});

	return server;
}
/* c8 ignore end */

/*
 * @class GrpcError is used to send a grpc error response back to the client.
 * */
export class GrpcError extends Error implements ServerErrorResponse {
	code: number;
	details: string;
	metadata?: Metadata;

	constructor({
		message,
		code = Status.INTERNAL,
		metadata,
		details,
	}: {
		code?: Status;
		details?: string;
		message: string;
		metadata?: Metadata;
	}) {
		super(message);
		this.code = code;
		this.metadata = metadata;
		this.details = details ?? message;
	}
}

/**
 * Extracts the provider API key from the metadata of the gRPC call if present.
 *
 * @param call the gRPC call
 *
 * @returns the provider API key if present, undefined otherwise
 */
export function extractProviderAPIKeyFromMetadata(
	call: ServerUnaryCall<any, any> | ServerWritableStream<any, any>,
): string | undefined {
	const md = call.metadata.get('X-API-Key');
	return md.length ? (md[0] as string) : undefined;
}
