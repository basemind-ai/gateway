import { ServerCredentials } from '@grpc/grpc-js';
import { openAIServiceDefinition } from 'gen/openai/service/v1/openai.grpc-server';
import logger from 'shared/logger';
import { createServer } from 'shared/utils';

const port = process.env.PORT ?? 50_051;

const server = createServer({
	service: openAIServiceDefinition,
	implementation: {
		prompt: () => {
			return null;
		},
	},
});

server.bindAsync(
	`0.0.0.0:${port}`,
	ServerCredentials.createInsecure(),
	(error: Error | null) => {
		if (error) {
			logger.error('Server failed to start');
			throw error;
		}
		logger.info('Server starting');
		logger.info(`Listening on port ${port}`);
		server.start();
	},
);
