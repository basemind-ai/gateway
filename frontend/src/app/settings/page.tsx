'use client';
import { UserInfo } from '@firebase/auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { handleDeleteUserAccount } from '@/api';
import DashboardCard from '@/components/dashboard/dashboard-card';
import { LogoutButton } from '@/components/logout-button';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useSetUser } from '@/stores/api-store';

export default function UserSettings() {
	const user = useAuthenticatedUser();
	const t = useTranslations('userSettings');

	return (
		<div data-testid="user-settings-page" className="mt-6 mx-32">
			<div className="flex flex-row justify-between">
				<h1 className="text-2xl font-semibold text-base-content mb-10">
					{t('headline')}
				</h1>
				<LogoutButton />
			</div>
			<div className="mb-10">
				<UserDetails user={user} />
			</div>
			<AccountDeletion user={user} />
		</div>
	);
}

export function UserDetails({ user }: { user: UserInfo | null }) {
	const t = useTranslations('userSettings');
	return (
		<DashboardCard title={t('headlineDetailsCard')}>
			{user?.photoURL ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={user.photoURL}
					alt={t('profilePicture')}
					className="rounded-full w-14 h-14"
				/>
			) : (
				<div className="rounded-full w-14 h-14 bg-neutral animate-pulse" />
			)}
			<div className="my-auto">
				<div className="text-neutral-content text-xs font-medium mb-1">
					{t('fullName')}
				</div>

				<div
					className={`text-neutral-content text-lg font-medium ${
						!user?.displayName && 'animate-pulse w-24 bg-neutral'
					}`}
					data-testid="user-name"
				>
					{user?.displayName ?? '\u00A0'}
				</div>
			</div>
			<div className="my-auto">
				<div className="text-neutral-content text-xs font-medium mb-1">
					{t('email')}
				</div>

				<div
					className={`text-neutral-content text-lg font-medium ${
						!user?.email && 'animate-pulse w-48 bg-neutral'
					}`}
					data-testid="user-email"
				>
					{user?.email ?? '\u00A0'}
				</div>
			</div>
		</DashboardCard>
	);
}

export function AccountDeletion({ user }: { user: UserInfo | null }) {
	const t = useTranslations('userSettings');
	const router = useRouter();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const setUser = useSetUser();

	function openDeleteConfirmationPopup() {
		dialogRef.current?.showModal();
	}

	function closeDeleteConfirmationPopup() {
		dialogRef.current?.close();
	}

	async function deleteUserAccount() {
		if (user) {
			await handleDeleteUserAccount();
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
				<div className="dialog-box" data-testid="delete-account-modal">
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
					<button />
				</form>
			</dialog>
		</DashboardCard>
	);
}
