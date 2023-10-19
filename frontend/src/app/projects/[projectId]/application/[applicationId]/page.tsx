'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useGetApplication } from '@/stores/project-store';

export default function Application({
	params: { projectId, applicationId },
}: {
	params: { projectId: string; applicationId: string };
}) {
	useAuthenticatedUser();
	const t = useTranslations('navrail');
	const router = useRouter();
	const application = useGetApplication()(projectId, applicationId);

	useEffect(() => {
		if (!application) {
			router.replace(Navigation.Projects);
		}
	}, []);

	if (!application) {
		return null;
	}

	return (
		<div data-testid="application-page" className="my-8 mx-32">
			<h1 className="text-2xl font-semibold text-base-content">
				{t('application')} / {application.name}
			</h1>
		</div>
	);
}
