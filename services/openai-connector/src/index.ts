import { ServerCredentials } from '@grpc/grpc-js';
import {
	IOpenAIService,
	openAIServiceDefinition,
} from 'gen/openai/v1/openai.grpc-server';
import { HealthImplementation } from 'grpc-health-check';
import { createServer } from 'shared/grpc';
import logger from 'shared/logger';

import { openAIPrompt, openAIStream } from '@/handlers';

const healthImpl = new HealthImplementation({
	'': 'SERVING',
});

const port = process.env.SERVER_PORT ?? 50_051;

const implementation = {
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	openAIPrompt,
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	openAIStream,
} satisfies IOpenAIService;

const server = createServer({
	service: openAIServiceDefinition,
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
