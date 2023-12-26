import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Eraser } from 'react-bootstrap-icons';
import useSWR from 'swr';

import {
	handleRemoveUserFromProject,
	handleRetrieveProjectUsers,
	handleUpdateUserToPermission,
} from '@/api';
import { Modal } from '@/components/modal';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { Dimensions } from '@/constants';
import { useHandleError } from '@/hooks/use-handle-error';
import {
	useProjectUsers,
	useRemoveProjectUser,
	useSetProjectUsers,
	useUpdateProjectUser,
	useUser,
} from '@/stores/api-store';
import { useShowInfo } from '@/stores/toast-store';
import { AccessPermission, Project } from '@/types';
import { handleChange } from '@/utils/events';

const DEFAULT_AVATAR = '/images/avatar.svg';

function UserCard({
	photoUrl,
	displayName,
	email,
}: {
	displayName: string;
	email: string;
	photoUrl: string;
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
				<p className="text-neutral-content font-medium">{email}</p>
			</div>
		</div>
	);
}

function PermissionSelect({
	permission,
	onChange,
}: {
	onChange: (value: AccessPermission) => void;
	permission: AccessPermission;
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

export function ProjectMembers({ project }: { project: Project }) {
	const t = useTranslations('members');

	const projectUsers = useProjectUsers(project.id);
	const removeProjectUser = useRemoveProjectUser();
	const setProjectUsers = useSetProjectUsers();
	const updateProjectUser = useUpdateProjectUser();
	const user = useUser();

	const handleError = useHandleError();
	const showInfo = useShowInfo();

	const { isLoading } = useSWR(
		{
			projectId: project.id,
		},
		handleRetrieveProjectUsers,
		{
			onError: handleError,
			onSuccess(users) {
				setProjectUsers(project.id, users);
			},
		},
	);

	const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] =
		useState(false);
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
			data: {
				permission,
				userId,
			},
			projectId: project.id,
		});
		updateProjectUser(project.id, updatedProjectUser);
		showInfo(t('roleUpdated'));
	}

	function markUserForRemoval(userId: string) {
		setRemovalUserId(userId);
		setIsRemoveMemberModalOpen(true);
	}

	async function removeUser() {
		if (!removalUserId || removeUserLoading) {
			return;
		}

		try {
			setRemoveUserLoading(true);
			await handleRemoveUserFromProject({
				projectId: project.id,
				userId: removalUserId,
			});
			removeProjectUser(project.id, removalUserId);
			showInfo(t('userRemoved'));
		} catch (e) {
			handleError(e);
		} finally {
			setRemovalUserId(null);
			setIsRemoveMemberModalOpen(false);
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
			<h2 className="card-header">{t('members')}</h2>
			<div className="rounded-data-card flex flex-col">
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
			<Modal modalOpen={isRemoveMemberModalOpen}>
				<ResourceDeletionBanner
					title={t('warning')}
					description={t('warningMessage')}
					onCancel={() => {
						setIsRemoveMemberModalOpen(false);
					}}
					onConfirm={() => void removeUser()}
					confirmCTA={
						removeUserLoading ? (
							<span className="loading loading-spinner text-base-content loading-xs mx-1.5" />
						) : (
							t('ok')
						)
					}
				/>
			</Modal>
		</div>
	);
}
