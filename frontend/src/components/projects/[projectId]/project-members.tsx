import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { Eraser } from 'react-bootstrap-icons';
import useSWR from 'swr';

import {
	handleRemoveUserFromProject,
	handleRetrieveProjectUsers,
	handleUpdateUserToPermission,
} from '@/api';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Dimensions } from '@/constants';
import { ApiError } from '@/errors';
import { useUser } from '@/stores/api-store';
import {
	useProjectUsers,
	useRemoveProjectUser,
	useSetProjectUsers,
	useUpdateProjectUser,
} from '@/stores/project-store';
import { useShowError, useShowInfo } from '@/stores/toast-store';
import { AccessPermission } from '@/types';
import { handleChange } from '@/utils/helpers';

const DEFAULT_AVATAR = '/images/avatar.png';

function UserCard({
	photoUrl,
	displayName,
	email,
}: {
	photoUrl: string;
	displayName: string;
	email: string;
}) {
	return (
		<div className="flex flex-row gap-3.5 items-center">
			<Image
				src={photoUrl || DEFAULT_AVATAR}
				alt={displayName}
				height={Dimensions.Twelve}
				width={Dimensions.Twelve}
				className="rounded-full"
			/>
			<div>
				<p className="font-semibold text-base-content">{displayName}</p>
				<p className="text-neutral font-medium">{email}</p>
			</div>
		</div>
	);
}

function PermissionSelect({
	permission,
	onChange,
}: {
	permission: AccessPermission;
	onChange: (value: AccessPermission) => void;
}) {
	const t = useTranslations('members');

	return (
		<select
			data-testid="permission-select"
			className="text-sm font-medium bg-transparent select pl-1 pt-1 pb-1 min-h-0 h-full"
			value={permission}
			onChange={handleChange(onChange)}
		>
			{Object.values(AccessPermission).map((permission) => (
				<option
					key={permission}
					className="text-base-content text-sm font-medium capitalize bg-base-100"
					value={permission}
				>
					{t(permission.toLowerCase())}
				</option>
			))}
		</select>
	);
}

export function ProjectMembers({ projectId }: { projectId: string }) {
	const t = useTranslations('members');

	const projectUsers = useProjectUsers(projectId);
	const removeProjectUser = useRemoveProjectUser();
	const setProjectUsers = useSetProjectUsers();
	const updateProjectUser = useUpdateProjectUser();
	const user = useUser();

	const showError = useShowError();
	const showInfo = useShowInfo();

	const { isLoading } = useSWR(
		{
			projectId,
		},
		handleRetrieveProjectUsers,
		{
			onSuccess(users) {
				setProjectUsers(projectId, users);
			},
			onError(apiError: ApiError) {
				showError(apiError.message);
			},
		},
	);

	const dialogRef = useRef<HTMLDialogElement>(null);
	const [removalUserId, setRemovalUserId] = useState<string | null>(null);
	const [removeUserLoading, setRemoveUserLoading] = useState(false);

	const currentUser = projectUsers?.find(
		(projectUser) => projectUser.email === user?.email,
	);
	const isAdmin = currentUser?.permission === AccessPermission.ADMIN;

	const showRemoveMemberColumn =
		isAdmin && projectUsers && projectUsers.length > 1;
	const canChangePermission = (memberId: string) =>
		isAdmin && currentUser.id !== memberId;
	const canRemoveMember = (memberId: string) =>
		isAdmin && currentUser.id !== memberId;

	async function updatePermission(
		userId: string,
		permission: AccessPermission,
	) {
		const updatedProjectUser = await handleUpdateUserToPermission({
			projectId,
			data: {
				userId,
				permission,
			},
		});
		updateProjectUser(projectId, updatedProjectUser);
		showInfo(t('roleUpdated'));
	}

	function openRemovalConfirmationPopup() {
		dialogRef.current?.showModal();
	}

	function closeRemovalConfirmationPopup() {
		dialogRef.current?.close();
	}

	function markUserForRemoval(userId: string) {
		setRemovalUserId(userId);
		openRemovalConfirmationPopup();
	}

	async function removeUser() {
		if (!removalUserId || removeUserLoading) {
			return;
		}

		try {
			setRemoveUserLoading(true);
			await handleRemoveUserFromProject({
				projectId,
				userId: removalUserId,
			});
			removeProjectUser(projectId, removalUserId);
			showInfo(t('userRemoved'));
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			setRemovalUserId(null);
			closeRemovalConfirmationPopup();
			setRemoveUserLoading(false);
		}
	}

	function renderProjectUsers() {
		return projectUsers?.map(
			({ displayName, id: memberId, permission, photoUrl, email }) => {
				return (
					<tr key={memberId}>
						<td>
							<UserCard
								photoUrl={photoUrl}
								email={email}
								displayName={displayName}
							/>
						</td>
						<td>
							{canChangePermission(memberId) && (
								<PermissionSelect
									permission={permission}
									onChange={(value) =>
										void updatePermission(
											memberId,
											value as AccessPermission,
										)
									}
								/>
							)}
							{!canChangePermission(memberId) && (
								<p className="font-semibold text-base-content">
									{t(permission.toLowerCase())}
								</p>
							)}
						</td>
						{canRemoveMember(memberId) && (
							<td className="text-center">
								<button
									data-testid="remove-member-btn"
									onClick={() => {
										markUserForRemoval(memberId);
									}}
								>
									<Eraser className="w-3.5 h-3.5 text-accent" />
								</button>
							</td>
						)}
					</tr>
				);
			},
		);
	}

	return (
		<div data-testid="project-members-container">
			<h2 className="font-semibold text-white text-xl">{t('members')}</h2>
			<div className="custom-card flex flex-col">
				{isLoading && (
					<div className="w-full flex">
						<span className="loading loading-bars mx-auto" />
					</div>
				)}
				{!isLoading && (
					<table className="custom-table">
						<thead>
							<tr>
								<th>{t('name')}</th>
								<th>{t('roles')}</th>
								{showRemoveMemberColumn && (
									<th>{t('removeMember')}</th>
								)}
							</tr>
						</thead>
						<tbody>{renderProjectUsers()}</tbody>
					</table>
				)}
			</div>
			<dialog ref={dialogRef} className="modal">
				<div className="dialog-box">
					<ResourceDeletionBanner
						title={t('warning')}
						description={t('warningMessage')}
						onCancel={closeRemovalConfirmationPopup}
						onConfirm={() => void removeUser()}
						confirmCTA={
							removeUserLoading ? (
								<span className="loading loading-spinner loading-xs mx-1.5" />
							) : (
								t('ok')
							)
						}
					/>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button />
				</form>
			</dialog>
		</div>
	);
}
