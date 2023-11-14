import { waitFor } from '@testing-library/react';
import * as process from 'process';
import { renderHook } from 'tests/test-utils';
import { beforeEach } from 'vitest';

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
					group: mockGroup,
					identify: mockIdentify,
					page: mockPage,
					ready: mockReady,
					track: mockTrack,
				})),
			},
		};
	},
);

describe('useAnalytics tests', () => {
	const originalWriteKey = process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY;

	beforeEach(() => {
		process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY = 'test';
	});

	afterAll(() => {
		process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY = originalWriteKey;
	});

	it("should throw an error if the NEXT_PUBLIC_SEGMENT_WRITE_KEY isn't set", () => {
		delete process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY;
		expect(() => {
			renderHook(useAnalytics);
		}).toThrow();
	});

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
		expect(mockTrack).toHaveBeenCalledWith('test', {
			path: '',
			test: 'test',
			userId: undefined,
		});
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
		expect(mockPage).toHaveBeenCalledWith('test', {
			path: '',
			test: 'test',
			userId: undefined,
		});
	});
});
