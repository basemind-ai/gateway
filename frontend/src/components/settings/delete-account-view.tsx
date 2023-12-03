import { UserInfo } from '@firebase/auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleDeleteUserAccount } from '@/api';
import { DashboardCard } from '@/components/dashboard-card';
import { Modal } from '@/components/modal';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { useHandleError } from '@/hooks/use-handle-error';
import { useSetUser } from '@/stores/api-store';
import { useShowSuccess } from '@/stores/toast-store';

export function DeleteAccountView({ user }: { user: UserInfo | null }) {
	const t = useTranslations('userSettings');
	const router = useRouter();
	const setUser = useSetUser();
	const handleError = useHandleError();
	const showSuccess = useShowSuccess();

	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

	async function deleteUserAccount() {
		try {
			await handleDeleteUserAccount();
			setUser(null);
			showSuccess(t('accountDeletedMessage'));
			router.replace(Navigation.Base);
		} catch (e: unknown) {
			handleError(e);
		} finally {
			setIsDeleteModalOpen(false);
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
				onClick={() => {
					setIsDeleteModalOpen(true);
				}}
				data-testid="account-delete-btn"
				disabled={!user?.email}
			>
				{t('deleteYourAccountButton')}
			</button>
			<Modal
				modalOpen={isDeleteModalOpen}
				dataTestId="delete-account-modal"
			>
				<ResourceDeletionBanner
					title={t('warning')}
					description={t('deleteYourAccountDetails')}
					placeholder={t('writeYourEmail')}
					resourceName={user?.email ?? ''}
					onCancel={() => {
						setIsDeleteModalOpen(false);
					}}
					onConfirm={() => void deleteUserAccount()}
					isDisabled={!user?.email}
				/>
			</Modal>
		</DashboardCard>
	);
}
