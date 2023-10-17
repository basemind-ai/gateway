'use client';

import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';

export default function Application() {
	useAuthenticatedUser();

	return (
		<div
			className="bg-base-100 flex h-full w-full animate-pulse"
			data-testid="projects-view-loading"
		/>
	);
}
