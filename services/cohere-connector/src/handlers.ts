import {
	sendUnaryData,
	ServerUnaryCall,
	ServerWritableStream,
} from '@grpc/grpc-js';
import {
	CoherePromptRequest,
	CoherePromptResponse,
	CohereStreamResponse,
} from 'gen/cohere/v1/cohere';

export async function coherePrompt(
	call: ServerUnaryCall<CoherePromptRequest, CoherePromptResponse>,
	callback: sendUnaryData<CoherePromptResponse>,
) {}

export async function cohereStream(
	call: ServerWritableStream<CoherePromptRequest, CohereStreamResponse>,
) {}
