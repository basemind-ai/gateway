'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { TrackEvents } from '@/constants/analytics';
import { useAnalytics } from '@/hooks/use-analytics';

export function MobileNotSupported() {
	const t = useTranslations('common');
	const { initialized, track } = useAnalytics();
	useEffect(() => {
		if (initialized) {
			track(TrackEvents.MobileNotSupported);
		}
	}, [initialized, track]);

	return (
		<>
			<div className="text-2xl font-bold text-center">
				{t('mobileNotSupported')}
			</div>
			<div className="text-center mt-4">
				{t('mobileNotSupportedDescription')}
			</div>
		</>
	);
}
