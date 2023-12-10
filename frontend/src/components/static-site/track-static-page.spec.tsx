import { render, waitFor } from 'tests/test-utils';
import { describe, MockInstance } from 'vitest';

import { TrackStaticPage } from '@/components/static-site/track-static-page';
import * as useTrackPagePackage from '@/hooks/use-track-page';

describe('track static page component', () => {
	let useTrackPageSpy: MockInstance;
	beforeEach(() => {
		useTrackPageSpy = vi.spyOn(useTrackPagePackage, 'useTrackPage');
	});

	it('calls page tracking hook', async () => {
		render(<TrackStaticPage pageName="test" />);
		await waitFor(() => {
			expect(useTrackPageSpy).toHaveBeenCalledWith('test');
		});
	});
});
