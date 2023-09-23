import { createLogger } from 'shared/logger';

describe('logger utils tests', () => {
	describe('createLogger', () => {
		it('should create a logger with default options when no options are passed', () => {
			const logger = createLogger();
			expect(logger.level).toEqual('debug');
		});

		it('should create a logger with custom options when options are passed', () => {
			const options = {
				level: 'warn',
				transport: { target: 'pino-pretty' },
			};
			const logger = createLogger(options);
			expect(logger.level).toEqual('warn');
		});

		it('should create a logger with "info" level when in production environment', () => {
			process.env.NODE_ENV = 'production';
			const logger = createLogger();
			expect(logger.level).toEqual('info');
		});

		it('should create a logger with "debug" level and "pino-pretty" transport when not in production environment', () => {
			process.env.NODE_ENV = 'development';
			const logger = createLogger();
			expect(logger.level).toEqual('debug');
		});
	});
});
