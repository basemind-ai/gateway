import { useTranslations } from 'next-intl';
import { KeyboardEvent, useState } from 'react';
import { XCircleFill } from 'react-bootstrap-icons';
import isEmail from 'validator/es/lib/isEmail';

import { handleAddUsersToProject, handleRetrieveProjectUsers } from '@/api';
import { useHandleError } from '@/hooks/use-handle-error';
import { useSetProjectUsers } from '@/stores/api-store';
import { useShowInfo } from '@/stores/toast-store';
import { AccessPermission, Project } from '@/types';
import { handleChange } from '@/utils/events';

export function InviteProjectMembers({ project }: { project: Project }) {
	const t = useTranslations('members');

	const [emails, setEmails] = useState<string[]>([]);
	const [currentEmail, setCurrentEmail] = useState('');
	const [permission, setPermission] = useState(AccessPermission.MEMBER);
	const [loading, setLoading] = useState(false);

	const setProjectUsers = useSetProjectUsers();

	const handleError = useHandleError();
	const showInfo = useShowInfo();

	async function sendInvite() {
		if (loading) {
			return;
		}

		try {
			setLoading(true);
			await handleAddUsersToProject({
				data: emails.map((email) => ({ email, permission })),
				projectId: project.id,
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
			setLoading(false);
		}
	}

	function addEmailToList() {
		if (!currentEmail) {
			return;
		}

		const alreadyExists = emails.includes(currentEmail);
		if (!alreadyExists) {
			setEmails([...emails, currentEmail]);
		}
		setCurrentEmail('');
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			addEmailToList();
		}
	}

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
	function removeEmail(emailToRemove: string) {
		setEmails(emails.filter((email) => email !== emailToRemove));
	}

	const emailsValid =
		!!emails.length && emails.every((email) => isEmail(email));

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
							{/*<Envelope className="absolute left-4 top-1/2 -translate-y-1/2" />*/}
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
						disabled={!emailsValid}
						className="card-action-button invalid:disabled btn-primary"
						onClick={() => void sendInvite()}
					>
						{loading ? (
							<span className="loading loading-spinner loading-xs mx-4" />
						) : (
							t('sendInvite')
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
