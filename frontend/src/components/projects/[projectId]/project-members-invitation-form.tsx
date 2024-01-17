import { useClickAway } from '@uidotdev/usehooks';
import { useTranslations } from 'next-intl';
import { KeyboardEvent, LegacyRef, useState } from 'react';
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
	return (
		<div className="flex gap-1 items-center text-lg badge badge-lg badge-info">
			<span>{email}</span>
			<button data-testid="remove-email-btn" onClick={onRemove}>
				<XCircleFill className={`w-4 h-4 text-neutral`} />
			</button>
		</div>
	);
}

export function ProjectMembersInvitationForm({
	project,
}: {
	project: Project;
}) {
	const t = useTranslations('members');
	const setProjectUsers = useSetProjectUsers();
	const handleError = useHandleError();
	const showInfo = useShowInfo();

	const { initialized, track } = useAnalytics();

	const [emails, setEmails] = useState<string[]>([]);
	const [currentEmail, setCurrentEmail] = useState('');
	const [permission, setPermission] = useState(AccessPermission.MEMBER);
	const [isLoading, setIsLoading] = useState(false);

	const ref = useClickAway(() => {
		handleDeselect();
	});

	async function sendEmailInvites() {
		setIsLoading(true);
		try {
			await handleAddUsersToProject({
				data: emails.map((email) => ({ email, permission })),
				projectId: project.id,
			});
			for (const email of emails) {
				if (initialized) {
					track('inviteUser', {
						newMemberEmail: email,
						...project,
						permission,
					});
				}
			}

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

	const handleDeselect = () => {
		if (
			currentEmail &&
			isEmail(currentEmail) &&
			!emails.includes(currentEmail)
		) {
			setEmails([...emails, currentEmail]);
			setCurrentEmail('');
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
						<div className="flex bg-neutral rounded-lg items-center gap-2 pl-2 pr-2">
							{emails.length !== 0 && (
								<div className="flex gap-2">
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
								ref={ref as LegacyRef<HTMLInputElement>}
								type="email"
								id="email-address-input"
								data-testid="invite-email-input"
								className="input p-0 w-full bg-neutral text-neutral-content min-w-[9rem] border-none outline-none active:border-none"
								placeholder={
									emails.length ? '' : t('emailPlaceholder')
								}
								value={currentEmail}
								onKeyDown={(event: KeyboardEvent) => {
									if (event.key === 'Enter') {
										handleDeselect();
									}
								}}
								onBlur={handleDeselect}
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
