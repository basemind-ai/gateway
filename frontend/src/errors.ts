export class TokenError extends Error {
	constructor(msg: string) {
		super(msg);
		Object.setPrototypeOf(this, TokenError.prototype);
	}
}

export class PermissionError extends Error {
	constructor(msg: string) {
		super(msg);
		Object.setPrototypeOf(this, PermissionError.prototype);
	}
}

export class ConfigurationError extends Error {
	constructor(msg: string) {
		super(msg);
		Object.setPrototypeOf(this, ConfigurationError.prototype);
	}
}

export class UnhandledError extends Error {
	readonly error: unknown;
	constructor(msg: string, error: unknown) {
		super(msg);
		Object.setPrototypeOf(this, UnhandledError.prototype);
		this.error = error;
	}
}

export class ApiError extends Error {
	readonly statusCode: number;
	readonly statusText: string;
	readonly context?: Record<string, any>;

	constructor(
		msg: string,
		{
			statusCode,
			statusText,
			context,
		}: {
			context?: Record<string, any>;
			statusCode: number;
			statusText: string;
		},
	) {
		super(msg);
		Object.setPrototypeOf(this, ApiError.prototype);

		this.statusCode = statusCode;
		this.statusText = statusText;
		this.context = context;
	}
}

export class WebsocketError extends ApiError {
	constructor(msg: string, context?: Record<string, any>) {
		super(msg, {
			context,
			statusCode: 0,
			statusText: 'Websocket error',
		});
		Object.setPrototypeOf(this, WebsocketError.prototype);
	}
}
