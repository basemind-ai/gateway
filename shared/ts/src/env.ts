export function loadEnv(key: string, fallback?: string): string {
	const value = Reflect.get(process.env, key) ?? fallback;
	if (!value) {
		throw new Error(`Missing environment variable: ${key}`);
	}
	return value;
}
