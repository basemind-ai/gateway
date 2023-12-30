/* c8 ignore next */
export enum StreamFinishReason {
	// Stream is done and finished without issues
	DONE = 'done',
	// Stream finished due to an error
	ERROR = 'error',
	// Stream finished because it reached the token limit of the model
	LIMIT = 'limit',
}
