import { UserInfo } from '@firebase/auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { handleDeleteUserAccount } from '@/api';
import DashboardCard from '@/components/dashboard/dashboard-card';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { useSetUser } from '@/stores/api-store';

export function AccountDeletion({ user }: { user: UserInfo | null }) {
	const t = useTranslations('userSettings');
	const router = useRouter();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const setUser = useSetUser();

	function openDeleteConfirmationPopup() {
		if (dialogRef.current?.showModal) {
			dialogRef.current.showModal();
		}
	}

	function closeDeleteConfirmationPopup() {
		if (dialogRef.current?.close) {
			dialogRef.current.close();
		}
	}

	async function deleteUserAccount() {
		if (user) {
			await handleDeleteUserAccount(user);
			closeDeleteConfirmationPopup();
			setUser(null);
			router.replace(Navigation.Base);
			// 	TODO: Toast to show successful deletion
		}
	}
	return (
		<DashboardCard title={t('headlineDeleteCard')}>
			<div className="my-auto">
				<div className="text-neutral-content text-lg font-semibold mb-1">
					{t('deleteYourAccount')}
				</div>

				<div className="text-neutral-content text-xs font-light">
					{t('deleteYourAccountDetails')}
				</div>
			</div>
			<button
				className="btn btn-error btn-sm my-auto rounded-4xl"
				onClick={openDeleteConfirmationPopup}
				data-testid="account-delete-btn"
				disabled={!user?.email}
			>
				{t('deleteYourAccountButton')}
			</button>
			<dialog ref={dialogRef} className="modal">
				<div
					className="modal-box p-0 border border-neutral max-w-[43rem]"
					data-testid="delete-account-modal"
				>
					<ResourceDeletionBanner
						title={t('warning')}
						description={t('deleteYourAccountDetails')}
						placeholder={t('writeYourEmail')}
						resourceName={user?.email ?? ''}
						onCancel={closeDeleteConfirmationPopup}
						onConfirm={() => void deleteUserAccount()}
					/>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
		</DashboardCard>
	);
}
