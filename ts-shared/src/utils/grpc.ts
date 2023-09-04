import {
	Server,
	ServiceDefinition,
	UntypedServiceImplementation,
} from '@grpc/grpc-js';

export function createServer<
	T extends ServiceDefinition,
	I extends UntypedServiceImplementation,
>({ service, implementation }: { service: T; implementation: I }): Server {
	const server = new Server();
	server.addService(service, implementation);
	return server;
}
