import { Server, ServiceDefinition, UntypedHandleCall } from '@grpc/grpc-js';

export function createServer<T extends ServiceDefinition>({
	service,
	implementation,
}: {
	service: T;
	implementation: { [K in keyof T]: UntypedHandleCall };
}): Server {
	const server = new Server();
	server.addService(service, implementation);
	return server;
}
