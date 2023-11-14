import {
	cohereServiceDefinition,
	ICohereService,
} from 'gen/cohere/v1/cohere.grpc-server';
import { createServer } from 'shared/grpc';

import { coherePrompt, cohereStream } from '@/handlers';

const implementation = {
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	coherePrompt,
	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	cohereStream,
} satisfies ICohereService;

createServer({
	implementation,
	port: process.env.SERVER_PORT
		? Number.parseInt(process.env.SERVER_PORT!)
		: 50_051,
	service: cohereServiceDefinition,
});
