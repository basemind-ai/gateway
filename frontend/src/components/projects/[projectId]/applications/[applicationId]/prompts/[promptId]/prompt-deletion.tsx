import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { handleDeletePromptConfig } from '@/api';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { ApiError } from '@/errors';
import { useDeletePromptConfig, usePromptConfig } from '@/stores/project-store';
import { useShowError, useShowInfo } from '@/stores/toast-store';
import { OpenAIModelParameters, OpenAIPromptMessage } from '@/types';
import { populateLink } from '@/utils/navigation';

export function PromptDeletion({
	projectId,
	applicationId,
	promptConfigId,
}: {
	projectId: string;
	applicationId: string;
	promptConfigId: string;
}) {
	const router = useRouter();
	const t = useTranslations('promptConfig');

	const promptConfig = usePromptConfig<
		OpenAIModelParameters,
		OpenAIPromptMessage
	>(applicationId, promptConfigId);
	const deletePromptConfig = useDeletePromptConfig();

	const showError = useShowError();
	const showInfo = useShowInfo();

	const dialogRef = useRef<HTMLDialogElement>(null);
	const [loading, setLoading] = useState(false);

	function openDeleteConfirmationPopup() {
		dialogRef.current?.showModal();
	}

	function closeDeleteConfirmationPopup() {
		dialogRef.current?.close();
	}

	async function deletePrompt() {
		if (loading) {
			return;
		}

		try {
			setLoading(true);
			await handleDeletePromptConfig({
				projectId,
				applicationId,
				promptConfigId,
			});
			deletePromptConfig(applicationId, promptConfigId);
			router.replace(
				populateLink(Navigation.Applications, projectId, applicationId),
			);
			showInfo(t('promptDeleted'));
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			closeDeleteConfirmationPopup();
			setLoading(false);
		}
	}

	if (!promptConfig) {
		return null;
	}

	return (
		<div data-testid="prompt-deletion-container" className="mt-8">
			<h2 className="font-semibold text-white text-xl">
				{t('modelConfigDeletion')}
			</h2>
			<div className="custom-card flex items-center justify-between text-neutral-content">
				<div>
					<h6 className="font-medium ">
						{t('deleteModelConfigTitle')}
					</h6>
					<p className="font-light text-xs mt-2.5">
						{t('deleteModelConfigDescription')}
					</p>
				</div>
				<button
					data-testid="prompt-delete-btn"
					className="btn bg-error text-accent-content py-2.5 px-4 rounded-3xl capitalize min-h-0 h-full leading-4"
					onClick={openDeleteConfirmationPopup}
				>
					{t('delete')}
				</button>
				<dialog ref={dialogRef} className="modal">
					<div className="dialog-box">
						<ResourceDeletionBanner
							title={t('warning')}
							description={t('deleteModelConfigDescription')}
							placeholder={t('deletionPlaceholder')}
							resourceName={promptConfig.name}
							onCancel={closeDeleteConfirmationPopup}
							onConfirm={() => void deletePrompt()}
							confirmCTA={
								loading ? (
									<span className="loading loading-spinner loading-xs mx-1.5" />
								) : undefined
							}
						/>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button />
					</form>
				</dialog>
			</div>
		</div>
	);
}
