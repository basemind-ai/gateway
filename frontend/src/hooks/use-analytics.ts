import { AnalyticsBrowser, AnalyticsSnippet } from '@segment/analytics-next';
import { deepmerge } from 'deepmerge-ts';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useUser } from '@/stores/api-store';
import { getEnv } from '@/utils/env';

declare global {
	interface Window {
		analytics?: AnalyticsSnippet | AnalyticsBrowser;
	}
}

export interface AnalyticsHandlers {
	group: (groupId: string, properties?: Record<string, any>) => void;
	identify: (userId: string, properties?: Record<string, any>) => void;
	initialized: boolean;
	page: (name: string, properties?: Record<string, any>) => void;
	track: (event: string, properties?: Record<string, any>) => void;
}

/*
 * useAnalytics is a react hook for using analytics.
 * */
export function useAnalytics(): AnalyticsHandlers {
	const analyticsRef = useRef<AnalyticsSnippet | AnalyticsBrowser | null>(
		null,
	);

	const user = useUser();
	const pathname = usePathname();

	const [initialized, setInitialized] = useState(false);

	useEffect(() => {
		if (!analyticsRef.current) {
			(async () => {
				if (window.analytics) {
					analyticsRef.current = window.analytics;
					return;
				}
				const writeKey = getEnv().NEXT_PUBLIC_SEGMENT_WRITE_KEY;

				window.analytics = analyticsRef.current = AnalyticsBrowser.load(
					{
						writeKey,
					},
				);
				await analyticsRef.current.ready();
			})();
		}
		setInitialized(true);
	}, []);

	/* the following functions are abstractions on top of the standard segment api methods
	 * we intentionally convert them from async to sync - so we can easily use them in components.
	 * see: https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#basic-tracking-methods
	 */

	const track = useCallback(
		(event: string, properties: Record<string, any> = {}) => {
			properties.userId ??= user?.uid;
			properties.path = pathname;

			void analyticsRef.current?.track(event, properties);
		},
		[analyticsRef.current],
	);

	const page = useCallback(
		(name: string, properties: Record<string, any> = {}) => {
			properties.userId ??= user?.uid;
			properties.path = pathname;

			void analyticsRef.current?.page(name, properties);
		},
		[analyticsRef.current],
	);

	const identify = useCallback(
		(userId: string, properties: Record<string, any> = {}) => {
			void analyticsRef.current?.identify(
				userId,
				deepmerge(properties, user ?? {}),
			);
		},
		[analyticsRef.current],
	);

	const group = useCallback(
		(groupId: string, properties: Record<string, any> = {}) => {
			properties.userId ??= user?.uid;
			void analyticsRef.current?.group(groupId, properties);
		},
		[analyticsRef.current],
	);

	return {
		group,
		identify,
		initialized,
		page,
		track,
	};
}
