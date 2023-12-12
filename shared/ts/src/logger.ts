import { LoggerOptions, pino } from 'pino';

export /**
 * The createLogger function creates a logger instance.
 *
 * @param options pino logger options
 *
 * @return A logger instance
 */
const createLogger = (options?: LoggerOptions) =>
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
