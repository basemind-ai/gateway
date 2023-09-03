import { openAIServiceDefinition } from 'gen/openai/service/v1/openai.grpc-server';
import { createServer } from 'shared/utils';

export const server = createServer({
	service: openAIServiceDefinition,
	implementation: {
		prompt: () => {
			return null;
		},
	},
});
