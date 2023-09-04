import { ServerCredentials } from '@grpc/grpc-js';
import {
	IOpenAIService,
	openAIServiceDefinition,
} from 'gen/openai/service/v1/openai.grpc-server';
import { createServer } from 'shared/utils';
import logger from 'shared/utils/logger';

const port = process.env.PORT ?? 50_051;

const implementation = {
	prompt: () => {
		return null;
	},
} satisfies IOpenAIService;

const server = createServer({
	service: openAIServiceDefinition,
	implementation,
});

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
