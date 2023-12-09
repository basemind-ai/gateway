import { mockPage, mockReady } from 'tests/mocks';
import { renderHook, waitFor } from 'tests/test-utils';

import { useTrackPage } from '@/hooks/use-track-page';

describe('useTrackPage tests', () => {
	it('should call page', async () => {
		const { rerender } = renderHook(() => {
			useTrackPage('test');
		});
		await waitFor(() => {
			expect(mockReady).toHaveBeenCalled();
		});
		rerender();
		await waitFor(() => {
			expect(mockPage).toBeCalledWith('test', {
				path: '',
				userId: undefined,
			});
		});
	});
});
