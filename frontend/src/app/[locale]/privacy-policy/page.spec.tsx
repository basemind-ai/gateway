import { render, waitFor } from 'tests/test-utils';
import { MockInstance } from 'vitest';

import PrivacyPolicyPage from '@/app/[locale]/privacy-policy/page';
import * as useTrackPagePackage from '@/hooks/use-track-page';

describe('Privacy Policy Page', () => {
	let useTrackPageSpy: MockInstance;
	beforeEach(() => {
		useTrackPageSpy = vi
			.spyOn(useTrackPagePackage, 'useTrackPage')
			.mockImplementationOnce(() => vi.fn());
	});

	it('calls page tracking hook', async () => {
		render(<PrivacyPolicyPage />);
		await waitFor(() => {
			expect(useTrackPageSpy).toHaveBeenCalledWith('privacy-policy');
		});
	});
});
