'use client';

import { useTrackPage } from '@/hooks/use-track-page';

export function TrackStaticPage({ pageName }: { pageName: string }) {
	useTrackPage(pageName);
	return <></>;
}
