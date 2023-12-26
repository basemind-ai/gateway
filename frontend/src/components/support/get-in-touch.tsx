import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Discord, Mailbox } from 'react-bootstrap-icons';

import { SUPPORT_EMAIL } from '@/constants';
import { getEnv } from '@/utils/env';

export function GetInTouch() {
	const t = useTranslations('support');
	const router = useRouter();

	return (
		<div>
			<h2 className="text-xl font-normal text-base-content mb-4">
				{t('getInTouch')}
			</h2>
			<div className="bg-base-200 shadow-sm rounded-4xl py-8 px-32">
				<div className="flex justify-evenly">
					<div>
						<div className="text-neutral-content pl-4 text-sm">
							{t('chatWithUs')}
						</div>
						<button
							className="btn flex gap-2 text-lg font-medium h-16 px-6 items-center"
							onClick={() => {
								router.push(
									getEnv().NEXT_PUBLIC_DISCORD_INVITE_URL,
								);
							}}
						>
							<Discord className="icon w-6 h-6 text-discord" />
							<span className="text-base-content pl-2">
								{t('joinOurDiscord')}
							</span>
						</button>
					</div>
					<div className="divider divider-horizontal " />
					<div>
						<div className="text-neutral-content pl-4 text-sm">
							{t('emailUs')}
						</div>
						<div className="flex gap-2 text-lg h-16 px-6 items-center">
							<Mailbox className="icon w-6 h-6 text-discord" />
							<span className="text-base-content pl-2">
								{SUPPORT_EMAIL}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
