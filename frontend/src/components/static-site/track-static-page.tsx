'use client';
import { useEffect } from 'react';

import { useAnalytics } from '@/hooks/use-analytics';

export function TrackStaticPage({ pageName }: { pageName: string }) {
	const { initialized, page } = useAnalytics();

	useEffect(() => {
		if (initialized) {
			page(pageName);
		}
	}, [page, initialized, pageName]);

	return null;
}
