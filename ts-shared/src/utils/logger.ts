import { LoggerOptions, pino } from 'pino';

export const createLogger = (options?: LoggerOptions) =>
	process.env.NODE_ENV === 'production'
		? pino({ level: 'info', ...options })
		: pino({
				level: 'debug',
				transport: {
					target: 'pino-pretty',
				},
				...options,
		  });

export default createLogger();
