import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleCreateSupportTicket } from '@/api';
import DashboardCard from '@/components/dashboard/dashboard-card';
import { Dropdown } from '@/components/dropdown';
import { SupportTopic } from '@/constants/forms';
import { useProjects } from '@/stores/project-store';
import { handleChange } from '@/utils/helpers';

export function Contact() {
	const t = useTranslations('support');

	const [selectedTopic, setSelectedTopic] = useState(SupportTopic.None);
	const [emailBody, setEmailBody] = useState('');
	const [emailSubject, setEmailSubject] = useState('');
	const [selectedProjectId, setSelectedProjectId] = useState('null');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const projects = useProjects();
	const topics = Object.values(SupportTopic);

	const handleSubmitTicket = async () => {
		setIsSubmitting(true);
		try {
			await handleCreateSupportTicket({
				topic: selectedTopic,
				subject: emailSubject.trim(),
				body: emailBody.trim(),
				projectId: selectedProjectId,
			});
			//TODO: implement success toast
			setSelectedTopic(SupportTopic.None);
			setEmailBody('');
			setEmailSubject('');
			setSelectedProjectId('');
		} catch {
			//TODO: implement error toast
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleButtonClick = () => {
		void handleSubmitTicket();
	};

	return (
		<DashboardCard title={t('contactUs')}>
			<div className="flex flex-col flex-end grow gap-8">
				<Dropdown
					headline={t('helpTopic')}
					selected={selectedTopic}
					setSelected={setSelectedTopic}
					options={topics}
				/>
				<select
					value={selectedProjectId}
					onChange={handleChange(setSelectedProjectId)}
					className="select select-bordered select-lg w-full bg-neutral text-neutral-content"
					data-testid="project-select"
				>
					<option value={''}>Select Project</option>
					{projects.map((project) => (
						<option key={project.id} value={project.id}>
							{project.name}
						</option>
					))}
				</select>
				<div className="form-control">
					<label className="label">
						<span className="label-text text-">
							{t('emailSubject')}
						</span>
						<span className="label-text-alt">{t('optional')}</span>
					</label>
					<input
						placeholder={t('emailBody')}
						className="input input-bordered input-lg w-full bg-neutral text-neutral-content"
						value={emailSubject}
						onChange={handleChange(setEmailSubject)}
					/>
					<label className="label">
						<span className="label-text text-">
							{t('emailBody')}
						</span>
					</label>
					<textarea
						placeholder={t('emailBody')}
						className="textarea textarea-bordered textarea-lg w-full bg-neutral text-neutral-content"
						value={emailBody}
						onChange={handleChange(setEmailBody)}
					/>
				</div>

				<button
					className="btn btn-primary self-end"
					data-testid="support-submit"
					disabled={
						selectedTopic === SupportTopic.None || !emailBody.trim()
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
