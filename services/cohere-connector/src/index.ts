import { ServerCredentials } from '@grpc/grpc-js';
import {
	cohereServiceDefinition,
	ICohereService,
} from 'gen/cohere/v1/cohere.grpc-server';
import { HealthImplementation } from 'grpc-health-check';
import { createServer } from 'shared/grpc';
import logger from 'shared/logger';

import { coherePrompt, cohereStream } from '@/handlers';

const healthImpl = new HealthImplementation({
	'': 'SERVING',
});

const port = process.env.SERVER_PORT ?? 50_051;

const implementation = {
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	coherePrompt,
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	cohereStream,
} satisfies ICohereService;

const server = createServer({
	service: cohereServiceDefinition,
	implementation,
});

healthImpl.addToServer(server);

server.bindAsync(
	`0.0.0.0:${port}`,
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
