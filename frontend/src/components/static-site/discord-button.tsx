'use client';
import { useRouter } from 'next/navigation';
import { Discord } from 'react-bootstrap-icons';

import { useAnalytics } from '@/hooks/use-analytics';
import { getEnv } from '@/utils/env';

export function DiscordButton() {
	const router = useRouter();
	const analytics = useAnalytics();

	return (
		<button
			className="hover:brightness-125"
			onClick={() => {
				analytics.track('discord_click', {});
				router.push(getEnv().NEXT_PUBLIC_DISCORD_INVITE_URL);
			}}
			data-testid="discord-btn"
		>
			<Discord className="icon w-6 h-6 text-discord" />
		</button>
	);
}
