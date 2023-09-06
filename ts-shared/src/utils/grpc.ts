import {
	Server,
	ServerErrorResponse,
	ServiceDefinition,
	UntypedServiceImplementation,
} from '@grpc/grpc-js';
import { Status } from '@grpc/grpc-js/build/src/constants';
import { Metadata } from '@grpc/grpc-js/build/src/metadata';

export function createServer<
	T extends ServiceDefinition,
	I extends UntypedServiceImplementation,
>({ service, implementation }: { service: T; implementation: I }): Server {
	const server = new Server();
	server.addService(service, implementation);
	return server;
}

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
		message: string;
		code?: Status;
		metadata?: Metadata;
		details?: string;
	}) {
		super(message);
		this.code = code;
		this.metadata = metadata;
		this.details = details ?? message;
	}
}
