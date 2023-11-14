import { AnalyticsBrowser, AnalyticsSnippet } from '@segment/analytics-next';
import { useCallback, useEffect, useRef, useState } from 'react';

declare global {
	interface Window {
		analytics?: AnalyticsSnippet | AnalyticsBrowser;
	}
}

export interface AnalyticsHandlers {
	initialized: boolean;
	track: (event: string, properties?: Record<string, any>) => void;
	page: (name: string, properties?: Record<string, any>) => void;
	identify: (userId: string, properties?: Record<string, any>) => void;
	group: (groupId: string, properties?: Record<string, any>) => void;
}

/*
 * useAnalytics is a react hook for using analytics.
 * */
export function useAnalytics(): AnalyticsHandlers {
	const analyticsRef = useRef<AnalyticsSnippet | AnalyticsBrowser | null>(
		null,
	);
	const [initialized, setInitialized] = useState(false);

	useEffect(() => {
		if (!analyticsRef.current) {
			if (window.analytics) {
				analyticsRef.current = window.analytics;
			} else {
				(async () => {
					const analytics = (window.analytics = AnalyticsBrowser.load(
						{
							writeKey: 'U2LLk7gJfNHDFY5tDiBFZ4MbIxM7CIdT',
						},
					));
					await analytics.ready();
					analyticsRef.current = analytics;
				})();
			}
		}
		setInitialized(true);
	}, []);

	/* the following functions are abstractions on top of the standard segment api methods
	 * we intentionally convert them from async to sync - so we can easily use them in components.
	 * see: https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/#basic-tracking-methods
	 */

	const track = useCallback(
		(event: string, properties?: Record<string, any>) => {
			void analyticsRef.current?.track(event, properties);
		},
		[analyticsRef.current],
	);

	const page = useCallback(
		(name: string, properties?: Record<string, any>) => {
			void analyticsRef.current?.page(name, properties);
		},
		[analyticsRef.current],
	);

	const identify = useCallback(
		(userId: string, properties?: Record<string, any>) => {
			void analyticsRef.current?.identify(userId, properties);
		},
		[analyticsRef.current],
	);

	const group = useCallback(
		(groupId: string, properties?: Record<string, any>) => {
			void analyticsRef.current?.group(groupId, properties);
		},
		[analyticsRef.current],
	);

	return {
		initialized,
		track,
		page,
		identify,
		group,
	};
}
