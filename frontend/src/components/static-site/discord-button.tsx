'use client';
import { useRouter } from 'next/navigation';
import { Discord } from 'react-bootstrap-icons';

import { DISCORD_INVITE_LINK } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';

export default function DiscordButton() {
	const router = useRouter();
	const analytics = useAnalytics();

	return (
		<button
			className="hover:brightness-125"
			onClick={() => {
				analytics.track('discord_click', {});
				router.push(DISCORD_INVITE_LINK);
			}}
			data-testid="discord-btn"
		>
			<Discord className="icon w-6 h-6 text-discord" />
		</button>
	);
}