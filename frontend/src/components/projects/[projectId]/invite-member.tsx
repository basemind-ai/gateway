import { useTranslations } from 'next-intl';
import { KeyboardEvent, useState } from 'react';
import { XCircleFill } from 'react-bootstrap-icons';

import { handleAddUsersToProject, handleRetrieveProjectUsers } from '@/api';
import { ApiError } from '@/errors';
import { useSetProjectUsers } from '@/stores/api-store';
import { useShowError, useShowInfo } from '@/stores/toast-store';
import { AccessPermission } from '@/types';
import { handleChange } from '@/utils/events';
import { isValidEmail } from '@/utils/validation';

export function InviteMember({ projectId }: { projectId: string }) {
	const t = useTranslations('members');

	const [emails, setEmails] = useState<string[]>([]);
	const [currentEmail, setCurrentEmail] = useState('');
	const [permission, setPermission] = useState(AccessPermission.MEMBER);
	const [loading, setLoading] = useState(false);

	const setProjectUsers = useSetProjectUsers();

	const showError = useShowError();
	const showInfo = useShowInfo();

	async function sendInvite() {
		if (loading) {
			return;
		}

		try {
			setLoading(true);
			await handleAddUsersToProject({
				data: emails.map((email) => ({ email, permission })),
				projectId,
			});

			const projectUsers = await handleRetrieveProjectUsers({
				projectId,
			});
			setProjectUsers(projectId, projectUsers);

			setEmails([]);
			setCurrentEmail('');
			setPermission(AccessPermission.MEMBER);
			showInfo(t('usersInvited'));
		} catch (e) {
			showError((e as ApiError).message);
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
		const emailValid = isValidEmail(email);

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
		!!emails.length && emails.every((email) => isValidEmail(email));

	return (
		<div data-testid="project-invite-member">
			<h2 className="font-semibold text-white text-xl">{t('invite')}</h2>
			<div className="custom-card flex flex-col">
				<div className="flex flex-col lg:flex-row gap-4 lg:gap-16">
					<div className="flex-2">
						<label
							htmlFor="email-address-input"
							className="text-sm font-semibold text-neutral-content"
						>
							{t('emailAddresses')}
						</label>
						<div className="mt-2.5 flex flex-wrap bg-neutral rounded-lg">
							{emails.length !== 0 && (
								<div className="flex pl-4 py-4 flex-wrap items-center gap-2  text-neutral-content font-medium">
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
								className="flex flex-1 input bg-neutral w-full text-neutral-content font-medium min-w-[9rem]"
								placeholder={t('emailPlaceholder')}
								value={currentEmail}
								onKeyDown={handleKeyDown}
								onBlur={addEmailToList}
								onChange={handleChange(setCurrentEmail)}
							/>
						</div>
					</div>
					<div className="flex-1">
						<label
							htmlFor="role-select"
							className="text-sm font-semibold text-neutral-content"
						>
							{t('role')}
						</label>
						<select
							data-testid="permission-select"
							className="mt-2.5 select select-bordered w-full bg-neutral text-base-content font-medium capitalize min-w-[14rem]"
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
				<button
					data-testid="send-invite-btn"
					disabled={!emailsValid}
					className="btn btn-primary ml-auto mt-4 capitalize font-semibold py-2.5 px-4 min-h-0 h-full "
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
	);
}
