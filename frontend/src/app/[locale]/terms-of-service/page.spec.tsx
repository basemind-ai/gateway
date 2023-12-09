import { render, waitFor } from 'tests/test-utils';

import TermsOfServicePage from '@/app/[locale]/terms-of-service/page';
import { useTrackPage } from '@/hooks/use-track-page';

describe('Terms of Service Page', () => {
	it('calls page tracking hook', async () => {
		render(<TermsOfServicePage />);
		await waitFor(() => {
			expect(useTrackPage).toHaveBeenCalledWith('terms-of-service');
		});
	});
});
