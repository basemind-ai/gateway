/* c8 ignore next */
export enum StreamFinishReason {
	// Stream is done and finished without issues
	DONE = 'DONE',
	// Stream finished due to an error
	ERROR = 'ERROR',
	// Stream finished because it reached the token limit of the model
	LIMIT = 'LIMIT',
}
