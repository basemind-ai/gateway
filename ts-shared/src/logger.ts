import { LoggerOptions, pino } from 'pino';

export const createLogger = (options?: LoggerOptions) =>
	process.env.NODE_ENV === 'production'
		? pino(options)
		: pino({
				...options,
				transport: {
					target: 'pino-pretty',
				},
		  });

export default createLogger();
