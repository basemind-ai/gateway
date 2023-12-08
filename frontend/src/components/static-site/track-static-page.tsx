'use client';

import { usePageTracking } from '@/hooks/use-page-tracking';

export function TrackStaticPage({ pageName }: { pageName: string }) {
	usePageTracking(pageName);
	return <></>;
}
