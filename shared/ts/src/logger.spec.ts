import { pino } from 'pino';
import { createLogger } from 'shared/logger';
import { MockInstance } from 'vitest';

vi.mock('pino');

describe('logger utils tests', () => {
	const mock = pino as unknown as MockInstance;

	it('should create an info level logger in production', () => {
		Reflect.set(process.env, 'NODE_ENV', 'production');
		createLogger();

		expect(mock).toHaveBeenCalledWith({ level: 'info' });

		Reflect.set(process.env, 'NODE_ENV', 'test');
	});

	it('should create a debug level logger in development', () => {
		Reflect.set(process.env, 'NODE_ENV', 'development');
		createLogger();

		expect(mock).toHaveBeenCalledWith({
			level: 'debug',
			transport: {
				target: 'pino-pretty',
			},
		});

		Reflect.set(process.env, 'NODE_ENV', 'test');
	});
});
