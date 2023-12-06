import { ConfigurationError } from '@/errors';

export const expectedEnvVariables = [
	'NEXT_PUBLIC_BACKEND_BASE_URL',
	'NEXT_PUBLIC_DISCORD_INVITE_URL',
	'NEXT_PUBLIC_FIREBASE_API_KEY',
	'NEXT_PUBLIC_FIREBASE_APP_ID',
	'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
	'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
	'NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID',
	'NEXT_PUBLIC_FIREBASE_MICROSOFT_TENANT_ID',
	'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
	'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
	'NEXT_PUBLIC_FRONTEND_HOST',
	'NEXT_PUBLIC_SEGMENT_WRITE_KEY',
];

export const validateEnv = () => {
	const missingVariables = expectedEnvVariables.filter(
		(key) => !process.env[key]?.trim(),
	);

	if (missingVariables.length > 0) {
		throw new ConfigurationError(
			`Missing environment variables: ${missingVariables.join(', ')}`,
		);
	}
};

export function register() {
	validateEnv();
}
