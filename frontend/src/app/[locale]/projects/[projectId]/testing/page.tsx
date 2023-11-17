'use client';

import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { Plus } from 'react-bootstrap-icons';
import useSWR from 'swr';

import { handleRetrieveApplications } from '@/api';
import { NewConfigDialog } from '@/components/prompt-config/new-config-dialog';
import { AllConfigsTable } from '@/components/testing/all-configs-table';
import { ApiError } from '@/errors';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useApplications, useSetProjectApplications } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
import { Application } from '@/types';

export default function PickConfigPage({
	params: { projectId },
}: {
	params: { projectId: string };
}) {
	const t = useTranslations('promptTesting');
	const applications = useApplications(projectId);
	const setProjectApplications = useSetProjectApplications();
	const showError = useShowError();
	useAuthenticatedUser();

	const createDialogRef = useRef<HTMLDialogElement>(null);

	function openDialog() {
		createDialogRef.current?.showModal();
	}
	function closeDialog() {
		createDialogRef.current?.close();
	}

	const { isValidating: isApplicationLoading, error: isAppsError } = useSWR<
		Application[],
		ApiError
	>(projectId, handleRetrieveApplications, {
		onError({ message }: ApiError) {
			showError(message);
		},
		onSuccess(data) {
			if (data.length === 0) {
				openDialog();
			}
			setProjectApplications(projectId, data);
		},
	});

	return (
		<div data-testid="pick-config-page" className="my-6 mx-32">
			<div className="mb-10">
				<h1
					data-testid="testing-page-title"
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
					<AllConfigsTable
						projectId={projectId}
						applications={applications}
						handleNoConfigs={openDialog}
					/>
					<button
						data-testid="new-config-button"
						onClick={openDialog}
						className="flex gap-2 items-center text-secondary hover:brightness-90"
						disabled={isApplicationLoading || !!isAppsError}
					>
						<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
						<span>{t('newConfiguration')}</span>
					</button>
				</div>
			</div>
			<dialog ref={createDialogRef} className="modal">
				{applications && (
					<NewConfigDialog
						applications={applications}
						projectId={projectId}
						handleClose={closeDialog}
					/>
				)}
			</dialog>
		</div>
	);
}
