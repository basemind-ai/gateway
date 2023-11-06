import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';

import { handleCreateSupportTicket, handleRetrieveProjects } from '@/api';
import DashboardCard from '@/components/dashboard/dashboard-card';
import { Dropdown } from '@/components/dropdown';
import { SupportTopic } from '@/constants/forms';
import { ApiError } from '@/errors';
import { useProjects, useSetProjects } from '@/stores/project-store';
import { useShowError, useShowSuccess } from '@/stores/toast-store';
import { Project } from '@/types';
import { handleChange } from '@/utils/helpers';

export function Contact({ isAuthenticated }: { isAuthenticated: boolean }) {
	const t = useTranslations('support');

	const [selectedTopic, setSelectedTopic] = useState<SupportTopic>();
	const [emailBody, setEmailBody] = useState('');
	const [emailSubject, setEmailSubject] = useState('');
	const [selectedProjectId, setSelectedProjectId] = useState('null');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const projects = useProjects();
	const topics = Object.values(SupportTopic).map((topic) => ({
		value: topic,
		text: topic,
	}));
	const setProjects = useSetProjects();
	const showError = useShowError();
	const showSuccess = useShowSuccess();

	const { isLoading } = useSWR<Project[]>(
		() => isAuthenticated,
		handleRetrieveProjects,
		{
			onSuccess(data) {
				setProjects(data);
			},
			onError({ message }: ApiError) {
				showError(message);
			},
		},
	);

	const handleSubmitTicket = async () => {
		setIsSubmitting(true);
		try {
			await handleCreateSupportTicket({
				topic: selectedTopic ?? SupportTopic.Other,
				subject: emailSubject.trim(),
				body: emailBody.trim(),
				projectId: selectedProjectId,
			});
			showSuccess(t('successComment'));
			setEmailBody('');
			setEmailSubject('');
			setSelectedProjectId('');
		} catch {
			showError(t('errorComment'));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleButtonClick = () => {
		void handleSubmitTicket();
	};

	return (
		<DashboardCard title={t('contactUs')}>
			<div className="flex flex-col flex-end grow gap-2">
				<div className="flex justify-between">
					<Dropdown
						headline={t('helpTopic')}
						selected={selectedTopic}
						setSelected={setSelectedTopic}
						options={topics}
					/>
					<Dropdown
						headline={t('selectProject')}
						selected={selectedProjectId}
						setSelected={setSelectedProjectId}
						options={projects.map((project) => {
							return { value: project.id, text: project.name };
						})}
						isLoading={isLoading}
						optional={true}
					/>
				</div>
				<div className="form-control">
					<label className="label">
						<span className="label-text text-">
							{t('emailSubject')}
						</span>
					</label>
					<input
						placeholder={t('emailSubjectPlaceholder')}
						className="input w-full bg-neutral text-neutral-content"
						data-testid="support-subject"
						value={emailSubject}
						onChange={handleChange(setEmailSubject)}
					/>
				</div>
				<div className="form-control">
					<label className="label">
						<span className="label-text text-">
							{t('emailBody')}
						</span>
					</label>
					<textarea
						placeholder={t('emailBodyPlaceholder')}
						data-testid="support-body"
						className="textarea w-full bg-neutral text-neutral-content"
						value={emailBody}
						onChange={handleChange(setEmailBody)}
					/>
				</div>

				<button
					className="btn btn-primary self-end mt-2"
					data-testid="support-submit"
					disabled={
						!selectedTopic?.trim() ||
						!emailSubject.trim() ||
						!emailBody.trim()
					}
					onClick={handleButtonClick}
				>
					{isSubmitting ? (
						<span className="loading loading-spinner"></span>
					) : (
						t('submit')
					)}
				</button>
			</div>
		</DashboardCard>
	);
}
