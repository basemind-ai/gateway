export class TokenError extends Error {
	constructor(msg: string) {
		super(msg);
		Object.setPrototypeOf(this, TokenError.prototype);
	}
}

export class ConfigurationError extends Error {
	constructor(msg: string) {
		super(msg);
		Object.setPrototypeOf(this, ConfigurationError.prototype);
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
