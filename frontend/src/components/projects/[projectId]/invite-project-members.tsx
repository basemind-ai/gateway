import { useTranslations } from 'next-intl';
import { KeyboardEvent, useState } from 'react';
import { XCircleFill } from 'react-bootstrap-icons';
import isEmail from 'validator/es/lib/isEmail';

import { handleAddUsersToProject, handleRetrieveProjectUsers } from '@/api';
import { useAnalytics } from '@/hooks/use-analytics';
import { useHandleError } from '@/hooks/use-handle-error';
import { useSetProjectUsers } from '@/stores/api-store';
import { useShowInfo } from '@/stores/toast-store';
import { AccessPermission, Project } from '@/types';
import { handleChange } from '@/utils/events';

function EmailChip({
	email,
	onRemove,
}: {
	email: string;
	onRemove: () => void;
}) {
	const emailValid = isEmail(email);

	return (
		<div
			className={`flex gap-1 items-center badge ${
				emailValid ? 'badge-info' : 'badge-error'
			} `}
		>
			{email}
			<button data-testid="remove-email-btn" onClick={onRemove}>
				<XCircleFill className={`w-3.5 h-3.5 text-neutral`} />
			</button>
		</div>
	);
}

export function InviteProjectMembers({ project }: { project: Project }) {
	const t = useTranslations('members');
	const setProjectUsers = useSetProjectUsers();
	const handleError = useHandleError();
	const showInfo = useShowInfo();
	const { initialized, track } = useAnalytics();

	const [emails, setEmails] = useState<string[]>([]);
	const [currentEmail, setCurrentEmail] = useState('');
	const [permission, setPermission] = useState(AccessPermission.MEMBER);
	const [isLoading, setIsLoading] = useState(false);

	async function sendEmailInvites() {
		setIsLoading(true);
		try {
			await handleAddUsersToProject({
				data: emails.map((email) => ({ email, permission })),
				projectId: project.id,
			});
			emails.forEach((email) => {
				if (initialized) {
					track('invite_user', {
						newMemberEmail: email,
						...project,
						permission,
					});
				}
			});

			const projectUsers = await handleRetrieveProjectUsers({
				projectId: project.id,
			});
			setProjectUsers(project.id, projectUsers);

			setEmails([]);
			setCurrentEmail('');
			setPermission(AccessPermission.MEMBER);
			showInfo(t('usersInvited'));
		} catch (e) {
			handleError(e);
		} finally {
			setIsLoading(false);
		}
	}

	function addEmailToList() {
		if (currentEmail && isEmail(currentEmail)) {
			if (!emails.includes(currentEmail)) {
				setEmails([...emails, currentEmail]);
			}

			setCurrentEmail('');
		}
	}

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter') {
			addEmailToList();
		}
	};

	const removeEmail = (emailToRemove: string) => {
		setEmails(emails.filter((email) => email !== emailToRemove));
	};

	const emailsValid =
		emails.length > 0 && emails.every((email) => isEmail(email));

	return (
		<div data-testid="project-invite-member">
			<h2 className="card-header">{t('invite')}</h2>
			<div className="rounded-data-card flex flex-col">
				<div className="flex flex-col lg:flex-row gap-4 lg:gap-16">
					<div className="form-control flex-2">
						<label className="label">
							<span className="label-text">
								{t('emailAddresses')}
							</span>
						</label>
						<div className="flex flex-wrap bg-neutral rounded-lg">
							{emails.length !== 0 && (
								<div className="flex pl-4 py-4 pr-2 flex-wrap items-center gap-2 text-neutral-content font-medium">
									{emails.map((email) => (
										<EmailChip
											key={email}
											email={email}
											onRemove={() => {
												removeEmail(email);
											}}
										/>
									))}
								</div>
							)}
							<input
								type="email"
								id="email-address-input"
								data-testid="invite-email-input"
								className="flex flex-1 input w-full bg-neutral text-neutral-content min-w-[9rem]"
								placeholder={t('emailPlaceholder')}
								value={currentEmail}
								onKeyDown={handleKeyDown}
								onBlur={addEmailToList}
								onChange={handleChange(setCurrentEmail)}
							/>
						</div>
					</div>
					<div className="form-control flex-1">
						<label className="label">
							<span className="label-text">{t('role')}</span>
						</label>
						<select
							data-testid="permission-select"
							className="card-select w-full min-w-[14rem]"
							value={permission}
							onChange={handleChange(setPermission)}
						>
							{Object.values(AccessPermission).map(
								(permission) => (
									<option
										key={permission}
										className="text-base-content font-medium capitalize"
										value={permission}
									>
										{t(permission.toLowerCase())}
									</option>
								),
							)}
						</select>
					</div>
				</div>
				<div className="flex justify-end pt-6">
					<button
						data-testid="send-invite-btn"
						disabled={!emailsValid || isLoading}
						className="card-action-button btn-primary text-primary-content disabled:text-neutral"
						onClick={() => void sendEmailInvites()}
					>
						{isLoading ? (
							<span className="loading loading-spinner loading-xs mx-4 text-base-content" />
						) : (
							t('sendInvite')
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
