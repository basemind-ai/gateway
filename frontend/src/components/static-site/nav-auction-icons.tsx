'use client';

import { Book, Discord, Github, Telephone } from 'react-bootstrap-icons';

import { Navigation } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';
import { getEnv } from '@/utils/env';

export const NavAuctionIconsList = [
	{
		icon: <Discord />,
		name: 'discord-btn',
		url: getEnv().NEXT_PUBLIC_DISCORD_INVITE_URL,
	},
	{
		icon: <Github />,
		name: 'github-btn',
		url: getEnv().NEXT_PUBLIC_URL_GITHUB,
	},
	{
		icon: <Book />,
		name: 'docs-btn',
		url: Navigation.Docs,
	},
	{
		icon: <Telephone />,
		name: 'schedule-meeting-btn',
		url: getEnv().NEXT_PUBLIC_SCHEDULE_MEETING_URL,
	},
];
export function NavAuctionIcons() {
	const { initialized, track } = useAnalytics();

	function handleIconClick(event: string, url: string) {
		if (initialized) {
			track(event);
		}
		window.open(url);
	}

	return (
		<nav className="join" data-testid="nav-auction-icons">
			{NavAuctionIconsList.map(({ icon, name, url }) => (
				<button
					key={name}
					className="hover:text-primary join-horizontal btn btn-ghost"
					data-testid={`${name}-btn`}
					onClick={() => {
						handleIconClick(`${name}_click`, url);
					}}
				>
					{icon}
				</button>
			))}
		</nav>
	);
}
