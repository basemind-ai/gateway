import { UserInfo } from '@firebase/auth';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleSupportTicket } from '@/api';
import DashboardCard from '@/components/dashboard/dashboard-card';
import { SupportTopics } from '@/constants/forms';

export function Contact({ user }: { user: UserInfo | null }) {
	const t = useTranslations('support');

	const topics = Object.values(SupportTopics);
	const [selectedTopic, setSelectedTopic] = useState<SupportTopics>(
		SupportTopics.None,
	);
	const [tellUsMore, setTellUsMore] = useState('');
	const handleButtonClick = () => {
		void handleSubmitTicket();
	};
	const handleSubmitTicket = async () => {
		try {
			if (!user) {
				//TODO: implement error toast
				return;
			}
			await handleSupportTicket(selectedTopic, tellUsMore, user);
			setSelectedTopic(SupportTopics.None);
			setTellUsMore('');
		} catch {
			//TODO: implement error toast
		}
		//TODO: implement success toast
	};

	return (
		<DashboardCard title={t('contactUs')}>
			<div className="flex flex-col flex-end grow gap-8">
				<div className="form-control w-full max-w-xs">
					<label className="label">
						<span className="label-text">{t('whatTopic')}</span>
					</label>
					<select
						className="select w-full max-w-xs bg-neutral text-neutral-content"
						value={selectedTopic}
						onChange={(e) => {
							setSelectedTopic(e.target.value as SupportTopics);
						}}
						data-testid="support-input-topic"
					>
						{topics.map((topic) => (
							<option
								key={topic}
								value={topic}
								data-testid={topic}
								disabled={topic === SupportTopics.None}
							>
								{t(topic)}
							</option>
						))}
					</select>
				</div>
				<div className="form-control">
					<label className="label">
						<span className="label-text text-">
							{t('tellUsMore')}
						</span>
						<span className="label-text-alt">{t('optional')}</span>
					</label>
					<textarea
						placeholder={t('tellUsMore')}
						className="textarea textarea-bordered textarea-lg w-full bg-neutral text-neutral-content"
						value={tellUsMore}
						onChange={(e) => {
							setTellUsMore(e.target.value);
						}}
					></textarea>
				</div>
				<button
					className="btn btn-primary self-end"
					data-testid="support-submit"
					disabled={selectedTopic === SupportTopics.None || !user}
					onClick={handleButtonClick}
				>
					{t('submit')}
				</button>
			</div>
		</DashboardCard>
	);
}
