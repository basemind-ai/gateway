import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, Discord, Mailbox } from 'react-bootstrap-icons';

import DashboardCard from '@/components/dashboard/dashboard-card';
import { DISCORD_INVITE_LINK, SUPPORT_EMAIL } from '@/constants';

export function GetInTouch() {
	const t = useTranslations('support');
	const router = useRouter();

	return (
		<DashboardCard title={t('getInTouch')}>
			<div>
				<div className="text-neutral-content pl-4 text-xs">
					{t('chatWithUs')}
				</div>
				<button
					className="btn normal-case "
					onClick={() => {
						router.push(DISCORD_INVITE_LINK);
					}}
				>
					<Discord className="icon w-4 h-4 text-discord" />
					{t('joinOurDiscord')}
					<ChevronRight className="icon w-3 h-3 " />
				</button>
			</div>
			<div className="divider divider-horizontal " />
			<div>
				<div className="text-neutral-content text-xs pl-4">
					{t('emailUs')}
				</div>
				<span className="flex gap-2 items-center px-4 h-12">
					<Mailbox className="icon w-4 h-4 text-discord" />
					{SUPPORT_EMAIL}
				</span>
			</div>
		</DashboardCard>
	);
}
