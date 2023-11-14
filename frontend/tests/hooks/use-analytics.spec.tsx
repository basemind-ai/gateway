import { waitFor } from '@testing-library/react';
import { renderHook } from 'tests/test-utils';

import { useAnalytics } from '@/hooks/use-analytics';

const mockReady = vi.fn(async () => true);
const mockTrack = vi.fn();
const mockIdentify = vi.fn();
const mockPage = vi.fn();
const mockGroup = vi.fn();

vi.mock(
	'@segment/analytics-next',
	async (importOriginal: () => Promise<Record<string, any>>) => {
		const original = await importOriginal();

		return {
			...original,
			AnalyticsBrowser: {
				load: vi.fn(() => ({
					ready: mockReady,
					track: mockTrack,
					identify: mockIdentify,
					page: mockPage,
					group: mockGroup,
				})),
			},
		};
	},
);

describe('useAnalytics tests', () => {
	it('should return an object with the expected AnalyticsHandlers interface', () => {
		const { result } = renderHook(() => useAnalytics());

		expect(mockReady).toHaveBeenCalledTimes(1);

		expect(result.current).toHaveProperty('initialized');
		expect(result.current).toHaveProperty('track');
		expect(result.current).toHaveProperty('identify');
		expect(result.current).toHaveProperty('group');
		expect(result.current).toHaveProperty('page');
	});

	it('should persist analytics across re-renders', async () => {
		const { result, rerender } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.initialized).toBeTruthy();
		});

		rerender();
		rerender();

		expect(mockReady).toHaveBeenCalledTimes(1);
		expect(result.current.initialized).toBeTruthy();
	});

	it('should call the track function with the expected arguments', async () => {
		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.initialized).toBeTruthy();
		});

		result.current.track('test', { test: 'test' });

		expect(mockTrack).toHaveBeenCalledTimes(1);
		expect(mockTrack).toHaveBeenCalledWith('test', { test: 'test' });
	});

	it('should call the identify function with the expected arguments', async () => {
		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.initialized).toBeTruthy();
		});

		result.current.identify('test', { test: 'test' });

		expect(mockIdentify).toHaveBeenCalledTimes(1);
		expect(mockIdentify).toHaveBeenCalledWith('test', { test: 'test' });
	});

	it('should call the group function with the expected arguments', async () => {
		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.initialized).toBeTruthy();
		});

		result.current.group('test', { test: 'test' });

		expect(mockGroup).toHaveBeenCalledTimes(1);
		expect(mockGroup).toHaveBeenCalledWith('test', { test: 'test' });
	});

	it('should call the page function with the expected arguments', async () => {
		const { result } = renderHook(() => useAnalytics());

		await waitFor(() => {
			expect(result.current.initialized).toBeTruthy();
		});

		result.current.page('test', { test: 'test' });

		expect(mockPage).toHaveBeenCalledTimes(1);
		expect(mockPage).toHaveBeenCalledWith('test', { test: 'test' });
	});
});
