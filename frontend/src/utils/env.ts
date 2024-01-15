export interface Env {
	NEXT_PUBLIC_BACKEND_URL: string;
	NEXT_PUBLIC_DISCORD_INVITE_URL: string;
	NEXT_PUBLIC_FIREBASE_API_KEY: string;
	NEXT_PUBLIC_FIREBASE_APP_ID: string;
	NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
	NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: string;
	NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID: string;
	NEXT_PUBLIC_FIREBASE_MICROSOFT_TENANT_ID: string;
	NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
	NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
	NEXT_PUBLIC_FRONTEND_HOST: string;
	NEXT_PUBLIC_SCHEDULE_MEETING_URL: string;
	NEXT_PUBLIC_SEGMENT_WRITE_KEY: string;
}

/*
  Build time validation - getEnv ensures that all required env variables are passed during build time by
  throwing a descriptive error.

  Its executed when next builds the project - and it replaces all "process.env.X" calls with inlined values. This
  is a major pain point with next.

  TODO: add any new env variable to this function and the interface above
*/

// eslint-disable-next-line sonarjs/cognitive-complexity
export function getEnv(): Env {
	const env = {
		NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? '',
		NEXT_PUBLIC_DISCORD_INVITE_URL:
			process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? '',
		NEXT_PUBLIC_FIREBASE_API_KEY:
			process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
		NEXT_PUBLIC_FIREBASE_APP_ID:
			process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
		NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
			process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
		NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:
			process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
		NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID:
			process.env.NEXT_PUBLIC_FIREBASE_MESSAGE_SENDER_ID ?? '',
		NEXT_PUBLIC_FIREBASE_MICROSOFT_TENANT_ID:
			process.env.NEXT_PUBLIC_FIREBASE_MICROSOFT_TENANT_ID ?? '',
		NEXT_PUBLIC_FIREBASE_PROJECT_ID:
			process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
		NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
			process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
		NEXT_PUBLIC_FRONTEND_HOST: process.env.NEXT_PUBLIC_FRONTEND_HOST ?? '',
		NEXT_PUBLIC_SCHEDULE_MEETING_URL:
			process.env.NEXT_PUBLIC_SCHEDULE_MEETING_URL ?? '',
		NEXT_PUBLIC_SEGMENT_WRITE_KEY:
			process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY ?? '',
	} satisfies Env;

	if (process.env.NODE_ENV !== 'test') {
		const missingVariables = Object.entries(env).reduce<string[]>(
			(acc, [key, value]) => {
				if (value === '') {
					acc.push(key);
				}
				return acc;
			},
			[],
		);

		if (missingVariables.length > 0) {
			throw new Error(
				`Missing required environment variables: ${missingVariables.join(
					', ',
				)}`,
			);
		}
	}

	return env;
}
