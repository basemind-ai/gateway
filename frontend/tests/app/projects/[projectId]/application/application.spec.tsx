import { render, routerReplaceMock, waitFor } from 'tests/test-utils';
import { describe, expect } from 'vitest';

import ApplicationPage from '@/app/projects/[projectId]/application/[applicationId]/page';
import { Navigation } from '@/constants';

describe('ApplicationPage', () => {
	it('should route to projects page when no application is present', async () => {
		render(
			<ApplicationPage params={{ projectId: '', applicationId: '' }} />,
		);

		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.Projects);
		});
	});
});
