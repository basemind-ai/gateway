import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { handleDeletePromptConfig } from '@/api';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { useHandleError } from '@/hooks/use-handle-error';
import { useDeletePromptConfig, usePromptConfig } from '@/stores/api-store';
import { useShowInfo } from '@/stores/toast-store';
import { ModelVendor } from '@/types';
import { setRouteParams } from '@/utils/navigation';

export function PromptConfigDeletion<T extends ModelVendor>({
	projectId,
	applicationId,
	promptConfigId,
}: {
	applicationId: string;
	projectId: string;
	promptConfigId: string;
}) {
	const router = useRouter();
	const t = useTranslations('promptConfig');

	const promptConfig = usePromptConfig<T>(applicationId, promptConfigId);
	const deletePromptConfig = useDeletePromptConfig();

	const handleError = useHandleError();
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
				applicationId,
				projectId,
				promptConfigId,
			});
			deletePromptConfig(applicationId, promptConfigId);
			router.replace(
				setRouteParams(Navigation.ApplicationDetail, {
					applicationId,
					projectId,
				}),
			);
			showInfo(t('promptDeleted'));
		} catch (e) {
			handleError(e);
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
			<h2 className="card-header">{t('modelConfigDeletion')}</h2>
			<div className="rounded-data-card flex items-center justify-between text-neutral-content">
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
