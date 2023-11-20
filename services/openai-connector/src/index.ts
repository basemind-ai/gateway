import {
	IOpenAIService,
	openAIServiceDefinition,
} from 'gen/openai/v1/openai.grpc-server';
import { createServer } from 'shared/grpc';

import { openAIPrompt, openAIStream } from '@/handlers';

const implementation = {
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	openAIPrompt,
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	openAIStream,
} satisfies IOpenAIService;

createServer({
	implementation,
	port: process.env.SERVER_PORT
		? Number.parseInt(process.env.SERVER_PORT!)
		: 50_051,
	service: openAIServiceDefinition,
});
