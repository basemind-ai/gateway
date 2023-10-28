import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { Eraser } from 'react-bootstrap-icons';

import {
	handleRemoveUserFromProject,
	handleRetrieveProjectUsers,
	handleUpdateUserToPermission,
} from '@/api';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Dimensions } from '@/constants';
import { useUser } from '@/stores/api-store';
import {
	useProjectUsers,
	useRemoveProjectUser,
	useSetProjectUsers,
	useUpdateProjectUser,
} from '@/stores/project-store';
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

	const dialogRef = useRef<HTMLDialogElement>(null);
	const [removalUserId, setRemovalUserId] = useState<string | null>(null);

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

	useEffect(() => {
		(async () => {
			const projectUsersRes = await handleRetrieveProjectUsers({
				projectId,
			});
			setProjectUsers(projectId, projectUsersRes);
		})();
	}, []);

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
		if (!removalUserId) {
			return;
		}
		await handleRemoveUserFromProject({ projectId, userId: removalUserId });
		removeProjectUser(projectId, removalUserId);
		setRemovalUserId(null);
		closeRemovalConfirmationPopup();
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
			</div>
			<dialog ref={dialogRef} className="modal">
				<div className="modal-box p-0 border border-neutral max-w-[43rem]">
					<ResourceDeletionBanner
						title={t('warning')}
						description={t('warningMessage')}
						onCancel={closeRemovalConfirmationPopup}
						onConfirm={() => void removeUser()}
						confirmCTA={t('ok')}
					/>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button />
				</form>
			</dialog>
		</div>
	);
}
