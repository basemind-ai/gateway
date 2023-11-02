'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Plus } from 'react-bootstrap-icons';

import { AllConfigsTable } from '@/components/testing/all-configs-table';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';

export default function PickConfigPage({
	params: { projectId },
}: {
	params: { projectId: string };
}) {
	const t = useTranslations('testing');
	useAuthenticatedUser();

	return (
		<div data-testid="pick-config-page" className="my-6 mx-32">
			<div className="mb-10">
				<h1
					data-testid="application-page-title"
					className="text-2xl font-semibold text-base-content"
				>
					{t('headlineTesting')}
				</h1>
			</div>
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-semibold text-base-content">
					{t('pickConfigHeading')}
				</h2>
				<div className="custom-card">
					<AllConfigsTable projectId={projectId} />
					<Link
						className="flex gap-2 items-center text-primary"
						data-testid="new-config-button"
						href={Navigation.TestingNewConfig}
					>
						<Plus className=" w-4 h-4" />
						<span>{t('newConfiguration')}</span>
					</Link>
				</div>
			</div>
		</div>
	);
}
