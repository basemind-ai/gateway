import { mockPage, mockReady } from 'tests/mocks';
import { render, waitFor } from 'tests/test-utils';

import { TrackStaticPage } from '@/components/static-site/track-static-page';

describe('track static page component Tests', () => {
	it('calls page tracking hook', async () => {
		render(<TrackStaticPage pageName="test" />);
		await waitFor(() => {
			expect(mockReady).toHaveBeenCalled();
		});
		await waitFor(() => {
			expect(mockPage).toBeCalledWith('test', {
				path: '',
				userId: undefined,
			});
		});
	});
});
