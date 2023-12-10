import { mockReady, mockTrack } from 'tests/mocks';
import { renderHook, waitFor } from 'tests/test-utils';

import { useTrackEvent } from '@/hooks/use-track-event';

describe('useTrackEvent tests', () => {
	it('should call track', async () => {
		const { rerender } = renderHook(() => {
			useTrackEvent('test');
		});
		await waitFor(() => {
			expect(mockReady).toHaveBeenCalled();
		});
		rerender();
		await waitFor(() => {
			expect(mockTrack).toBeCalledWith('test', {
				path: '',
				userId: undefined,
			});
		});
	});
});
