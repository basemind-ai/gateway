import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { PencilFill, XCircle } from 'react-bootstrap-icons';
import useSWR from 'swr';

import {
	handleRemoveUserFromProject,
	handleRetrieveProjectUsers,
	handleUpdateUserPermission,
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
import { AccessPermission, Project, ProjectUserAccount } from '@/types';
import { handleChange } from '@/utils/events';

const DEFAULT_AVATAR = '/images/avatar.svg';

export function ProjectMembers({ project }: { project: Project }) {
	const t = useTranslations('members');

	const projectUsers = useProjectUsers(project.id);
	const removeProjectUser = useRemoveProjectUser();
	const setProjectUsers = useSetProjectUsers();
	const updateProjectUser = useUpdateProjectUser();
	const user = useUser();

	const handleError = useHandleError();
	const showInfo = useShowInfo();

	const { isLoading: isSwrLoading } = useSWR(
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

	const [userToUpdate, setUserToUpdate] = useState<ProjectUserAccount | null>(
		null,
	);
	const [userToRemove, setUserToRemove] = useState<ProjectUserAccount | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [newMemberPermission, setNewMemberPermission] =
		useState<AccessPermission | null>(null);

	const currentUser = projectUsers?.find(
		(projectUser) => projectUser.email === user?.email,
	);

	const showActionColumns =
		currentUser?.permission === AccessPermission.ADMIN &&
		projectUsers &&
		projectUsers.length > 1;

	async function handleUpdatePermission() {
		setIsLoading(true);

		try {
			const updatedProjectUser = await handleUpdateUserPermission({
				data: {
					permission: newMemberPermission!,
					userId: userToUpdate!.id,
				},
				projectId: project.id,
			});
			updateProjectUser(project.id, updatedProjectUser);
			showInfo(t('roleUpdated'));
		} catch (e) {
			handleError(e);
		} finally {
			setUserToUpdate(null);
			setNewMemberPermission(null);
			setIsLoading(false);
		}
	}

	const handleRemoveUser = async () => {
		setIsLoading(true);

		try {
			await handleRemoveUserFromProject({
				projectId: project.id,
				userId: userToRemove!.id,
			});
			removeProjectUser(project.id, userToRemove!.id);
			showInfo(t('userRemoved'));
		} catch (e) {
			handleError(e);
		} finally {
			setUserToRemove(null);
			setIsLoading(false);
		}
	};

	return (
		<div data-testid="project-members-container">
			<h2 className="card-header">{t('members')}</h2>
			<div className="rounded-data-card">
				{isSwrLoading ? (
					<div className="w-full flex">
						<span className="loading loading-bars mx-auto" />
					</div>
				) : (
					<table className="table">
						<thead>
							<tr>
								<th></th>
								<th>{t('name')}</th>
								<th>{t('emailAddress')}</th>
								<th>{t('role')}</th>
								{showActionColumns && (
									<>
										<th>{t('edit')}</th>
										<th>{t('remove')}</th>
									</>
								)}
							</tr>
						</thead>
						<tbody>
							{projectUsers?.map((projectUser) => (
								<tr key={projectUser.id}>
									<th data-testid="project-user-image">
										<Image
											src={
												projectUser.photoUrl ||
												DEFAULT_AVATAR
											}
											alt={projectUser.displayName}
											height={Dimensions.Nine}
											width={Dimensions.Nine}
											className="rounded-full"
										/>
									</th>
									<td
										className="text-base-content"
										data-testid="project-user-name"
									>
										{projectUser.displayName}
									</td>
									<td data-testid="project-user-email">
										{projectUser.email}
									</td>
									<td
										data-testid="project-user-permission"
										className="font-semibold text-base-content"
									>
										{t(
											projectUser.permission.toLowerCase(),
										)}
									</td>
									{showActionColumns && (
										<>
											<td>
												{projectUser.id !==
													currentUser.id && (
													<button
														data-testid="edit-project-user-button"
														className="btn btn-ghost btn-sm"
														onClick={() => {
															setUserToUpdate(
																projectUser,
															);
														}}
													>
														<PencilFill className="w-4 h-4 text-base-content hover:text-accent" />
													</button>
												)}
											</td>
											<td>
												{projectUser.id !==
													currentUser.id && (
													<button
														data-testid="remove-project-user-button"
														className="btn btn-ghost btn-sm"
														onClick={() => {
															setUserToRemove(
																projectUser,
															);
														}}
													>
														<XCircle className="w-4 h-4 text-warning" />
													</button>
												)}
											</td>
										</>
									)}
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
			<Modal modalOpen={!!userToRemove}>
				<ResourceDeletionBanner
					description={t('removeUserWarningMessage', {
						projectName: project.name,
						username: userToRemove?.displayName ?? '',
					})}
					onCancel={() => {
						setUserToRemove(null);
					}}
					onConfirm={() => void handleRemoveUser()}
					confirmCTA={
						isLoading ? (
							<span className="loading loading-spinner text-base-content loading-xs mx-1.5" />
						) : (
							t('continue')
						)
					}
				/>
			</Modal>
			<Modal
				modalOpen={!!userToUpdate}
				onClose={() => {
					setUserToUpdate(null);
				}}
			>
				<div
					className="flex flex-col min-h-24"
					data-testid="edit-project-user-modal"
				>
					<div className="form-control">
						<select
							data-testid="edit-project-user-modal-permission-select"
							className="select active:border-none focus:border-none focus:outline-none w-full"
							value={userToUpdate?.permission}
							onChange={handleChange(setNewMemberPermission)}
						>
							{Object.values(AccessPermission).map(
								(permission) => (
									<option
										key={permission}
										className="text-base-content text-sm font-medium capitalize bg-base-100"
										value={permission}
									>
										{t(permission.toLowerCase())}
									</option>
								),
							)}
						</select>
					</div>
					<div className="border-t-2 border-neutral flex justify-end gap-2 p-2">
						<button
							data-testid="edit-project-user-modal-cancel-button"
							className="btn btn-outline btn-sm mt-4"
							onClick={() => {
								setUserToUpdate(null);
								setNewMemberPermission(null);
							}}
						>
							{t('cancel')}
						</button>
						<button
							data-testid="edit-project-user-modal-continue-button"
							className="btn btn-secondary btn-sm mt-4"
							disabled={isLoading || !newMemberPermission}
							onClick={() => {
								void handleUpdatePermission();
							}}
						>
							{t('continue')}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
