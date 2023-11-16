import { useTranslations } from 'next-intl';
import { useState } from 'react';
import useSWR from 'swr';

import { handleCreateSupportTicket, handleRetrieveProjects } from '@/api';
import DashboardCard from '@/components/dashboard/dashboard-card';
import { Dropdown } from '@/components/support/dropdown';
import { SupportTopic } from '@/constants/forms';
import { ApiError } from '@/errors';
import { useProjects, useSetProjects } from '@/stores/api-store';
import { useShowError, useShowSuccess } from '@/stores/toast-store';
import { Project } from '@/types';
import { handleChange } from '@/utils/helpers';

export function ContactForm({ isAuthenticated }: { isAuthenticated: boolean }) {
	const t = useTranslations('support');

	const [selectedTopic, setSelectedTopic] = useState<SupportTopic>();
	const [emailBody, setEmailBody] = useState('');
	const [emailSubject, setEmailSubject] = useState('');
	const [selectedProjectId, setSelectedProjectId] = useState('null');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const projects = useProjects();
	const topics = Object.values(SupportTopic).map((topic) => ({
		text: topic,
		value: topic,
	}));
	const setProjects = useSetProjects();
	const showError = useShowError();
	const showSuccess = useShowSuccess();

	const { isLoading } = useSWR<Project[]>(
		() => isAuthenticated,
		handleRetrieveProjects,
		{
			/* c8 ignore start */
			onError({ message }: ApiError) {
				showError(message);
			},

			onSuccess(data) {
				setProjects(data);
			},
			/* c8 ignore end */
		},
	);

	const handleSubmitTicket = async () => {
		setIsSubmitting(true);
		try {
			await handleCreateSupportTicket({
				body: emailBody.trim(),
				projectId: selectedProjectId,
				subject: emailSubject.trim(),
				topic: selectedTopic ?? SupportTopic.Other,
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
				<div className="flex flex-col justify-between">
					{projects.length > 1 && (
						<>
							<Dropdown
								placeholderText={t('selectProjectPlaceholder')}
								labelText={t('selectProjectLabel')}
								value={selectedProjectId}
								setSelected={setSelectedProjectId}
								options={projects.map((project) => {
									return {
										text: project.name,
										value: project.id,
									};
								})}
								isLoading={isLoading || isSubmitting}
								isOptional={true}
								testId="project-select"
							/>
							<div className="divider divider-neutral" />
						</>
					)}
					<Dropdown
						labelText={t('helpTopic')}
						placeholderText={t('helpTopicPlaceholder')}
						value={selectedTopic}
						setSelected={setSelectedTopic}
						options={topics}
						isLoading={isSubmitting}
						testId="topic-select"
					/>
				</div>
				<div className="form-control">
					<label className="label">
						<span className="label-text">{t('emailSubject')}</span>
					</label>
					<input
						placeholder={t('emailSubjectPlaceholder')}
						className="input w-full bg-neutral text-neutral-content"
						data-testid="support-subject"
						value={emailSubject}
						disabled={isSubmitting}
						onChange={handleChange(setEmailSubject)}
					/>
				</div>
				<div className="form-control">
					<label className="label">
						<span className="label-text">{t('emailBody')}</span>
					</label>
					<textarea
						placeholder={t('emailBodyPlaceholder')}
						data-testid="support-body"
						className="textarea w-full bg-neutral text-neutral-content"
						value={emailBody}
						disabled={isSubmitting}
						onChange={handleChange(setEmailBody)}
					/>
				</div>

				<button
					className="btn btn-primary self-end mt-2"
					data-testid="support-submit"
					disabled={
						isSubmitting ||
						!selectedTopic?.trim() ||
						!emailSubject.trim() ||
						!emailBody.trim()
					}
					onClick={handleButtonClick}
				>
					{isSubmitting ? (
						<span className="loading loading-spinner" />
					) : (
						t('submit')
					)}
				</button>
			</div>
		</DashboardCard>
	);
}
