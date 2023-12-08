import { render, waitFor } from 'tests/test-utils';
import { describe } from 'vitest';

import { TrackStaticPage } from '@/components/static-site/track-static-page';
import { usePageTracking } from '@/hooks/use-page-tracking';

describe('track static page component', () => {
	it('call page tracking hook', async () => {
		render(<TrackStaticPage pageName="test" />);
		await waitFor(() => {
			expect(usePageTracking).toHaveBeenCalledWith('test');
		});
	});
});
