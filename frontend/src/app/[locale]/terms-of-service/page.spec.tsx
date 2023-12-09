import { render, waitFor } from 'tests/test-utils';
import { MockInstance } from 'vitest';

import TermsOfServicePage from '@/app/[locale]/terms-of-service/page';
import * as useTrackPagePackage from '@/hooks/use-track-page';

describe('Terms of Service Page', () => {
	let useTrackPageSpy: MockInstance;
	beforeEach(() => {
		useTrackPageSpy = vi
			.spyOn(useTrackPagePackage, 'useTrackPage')
			.mockImplementationOnce(() => vi.fn());
	});

	it('calls page tracking hook', async () => {
		render(<TermsOfServicePage />);
		await waitFor(() => {
			expect(useTrackPageSpy).toHaveBeenCalledWith('terms-of-service');
		});
	});
});
