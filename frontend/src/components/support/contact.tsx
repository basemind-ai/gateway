import { UserInfo } from '@firebase/auth';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleSupportTicket } from '@/api';
import DashboardCard from '@/components/dashboard/dashboard-card';
import { Dropdown } from '@/components/dropdown';
import { SupportTopics } from '@/constants/forms';
import { handleChange } from '@/utils/helpers';

export function Contact({ user }: { user: UserInfo | null }) {
	const t = useTranslations('support');
	const [selectedTopic, setSelectedTopic] = useState<SupportTopics>(
		SupportTopics.None,
	);
	const [tellUsMore, setTellUsMore] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	const topics = Object.values(SupportTopics);

	const handleSubmitTicket = async () => {
		setIsSubmitting(true);
		try {
			await handleSupportTicket(selectedTopic, tellUsMore, user!);
			//TODO: implement success toast
			setSelectedTopic(SupportTopics.None);
			setTellUsMore('');
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
						onChange={handleChange(setTellUsMore)}
					/>
				</div>

				<button
					className="btn btn-primary self-end"
					data-testid="support-submit"
					disabled={selectedTopic === SupportTopics.None || !user}
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
