import { useEffect } from 'react';

import { useAnalytics } from '@/hooks/use-analytics';

export function useTrackEvent(
	event: string,
	properties: Record<string, any> = {},
) {
	const analytics = useAnalytics();

	useEffect(() => {
		if (analytics.initialized) {
			analytics.track(event, properties);
		}
	}, [analytics.initialized, event]);
}
