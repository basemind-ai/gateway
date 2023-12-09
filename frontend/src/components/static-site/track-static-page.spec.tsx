import { render, waitFor } from 'tests/test-utils';
import { describe } from 'vitest';

import { TrackStaticPage } from '@/components/static-site/track-static-page';
import { useTrackPage } from '@/hooks/use-track-page';

describe('track static page component', () => {
	it('call page tracking hook', async () => {
		render(<TrackStaticPage pageName="test" />);
		await waitFor(() => {
			expect(useTrackPage).toHaveBeenCalledWith('test');
		});
	});
});
