import { createLogger } from 'shared/logger';

const mock = vi.fn();

vi.mock('pino', async (importOriginal: () => Promise<Record<string, any>>) => {
	const original = await importOriginal();
	return {
		...original,
		pino: mock,
	};
});

describe('logger utils tests', () => {
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
			debug: 'info',
			transport: {
				target: 'pino-pretty',
			},
		});

		Reflect.set(process.env, 'NODE_ENV', 'test');
	});
});
