import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Envelope } from 'react-bootstrap-icons';

import { handleAddUserToProject } from '@/api';
import { ApiError } from '@/errors';
import { useAddProjectUser } from '@/stores/project-store';
import { useShowError, useShowInfo } from '@/stores/toast-store';
import { AccessPermission } from '@/types';
import { isValidEmail } from '@/utils/form';
import { handleChange } from '@/utils/helpers';

export function InviteMember({ projectId }: { projectId: string }) {
	const t = useTranslations('members');
	const [email, setEmail] = useState('');
	const [permission, setPermission] = useState(AccessPermission.MEMBER);
	const [loading, setLoading] = useState(false);

	const addProjectUser = useAddProjectUser();
	const showError = useShowError();
	const showInfo = useShowInfo();

	async function sendInvite() {
		if (loading) {
			return;
		}
		setLoading(true);

		try {
			const projectUser = await handleAddUserToProject({
				projectId,
				data: {
					email,
					permission,
				},
			});
			setEmail('');
			setPermission(AccessPermission.MEMBER);
			addProjectUser(projectId, projectUser);
			showInfo(t('userAdded'));
		} catch (e) {
			showError((e as ApiError).message);
		}

		setLoading(false);
	}

	const validEmail = isValidEmail(email);

	return (
		<div data-testid="project-invite-member">
			<h2 className="font-semibold text-white text-xl">{t('invite')}</h2>
			<div className="custom-card flex flex-col">
				<div className="flex gap-4 lg:gap-16">
					<div className="w-full">
						<label
							htmlFor="email-address-input"
							className="text-sm font-semibold text-neutral-content"
						>
							{t('name')}
						</label>
						<div className="relative mt-2.5">
							<Envelope className="absolute left-4 top-1/2 -translate-y-1/2" />
							<input
								type="email"
								id="email-address-input"
								data-testid="invite-email-input"
								className="input bg-neutral w-full text-neutral-content font-medium pl-11"
								placeholder={t('emailPlaceholder')}
								value={email}
								onChange={handleChange(setEmail)}
							/>
						</div>
					</div>
					<div>
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
					disabled={!validEmail}
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
