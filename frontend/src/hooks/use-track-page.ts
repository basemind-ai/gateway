import { useEffect } from 'react';

import { useAnalytics } from '@/hooks/use-analytics';

export function useTrackPage(pageName: string) {
	const analytics = useAnalytics();

	useEffect(() => {
		if (analytics.initialized) {
			analytics.page(pageName);
		}
	}, [analytics.initialized, pageName]);
}
