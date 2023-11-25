import { ConfigurationError } from '../../../frontend/src/errors';

/**
 * The loadEnv function loads an environment variable from the process.env object,
 * and throws an error if it is not defined.
 *
 * @return A string
 * @param key the key of the environment variable
 * @param fallback the fallback value if the environment variable is not defined
 */
export function loadEnv(key: string, fallback?: string): string {
	const value = Reflect.get(process.env, key) ?? fallback;
	if (!value) {
		throw new ConfigurationError(`Missing environment variable: ${key}`);
	}
	return value;
}
