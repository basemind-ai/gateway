'use client';

import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';

export default function Projects() {
	useAuthenticatedUser();
	useProjectBootstrap();

	return (
		<div
			className="bg-base-100 flex h-full w-full }"
			data-testid="projects-view-loading"
		/>
	);
}
