import { ProjectFactory } from 'tests/factories';
import { render, screen } from 'tests/test-utils';

import Dashboard from '@/app/projects/[projectId]/dashboard/page';

const mockDisplayName = 'testUser';

vi.mock('@/stores/api-store', () => ({
	useUser: () => ({ displayName: mockDisplayName }),
	useSetProjects: vi.fn(),
	useProject: () => [ProjectFactory.buildSync({ id: '123' })],
}));

describe('Dashboard page tests', () => {
	it('handles logout', async () => {
		render(<Dashboard params={{ projectId: '123' }} />);

		const dashboardContainer = screen.getByTestId('dashboard');
		expect(dashboardContainer).toBeInTheDocument();
	});
});
