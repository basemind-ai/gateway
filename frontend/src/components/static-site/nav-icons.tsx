'use client';

import { Book, Discord, Github, Telephone } from 'react-bootstrap-icons';

import { ExternalNavigation } from '@/constants';
import { TrackEvents } from '@/constants/analytics';
import { useAnalytics } from '@/hooks/use-analytics';
import { getEnv } from '@/utils/env';

export const NavigationTabs = [
	{
		icon: <Discord />,
		name: 'discord-button',
		url: getEnv().NEXT_PUBLIC_DISCORD_INVITE_URL,
	},
	{
		icon: <Github />,
		name: 'github-button',
		url: ExternalNavigation.Github,
	},
	{
		icon: <Book />,
		name: 'docs-button',
		url: ExternalNavigation.Docs,
	},
	{
		icon: <Telephone />,
		name: 'schedule-meeting-button',
		url: getEnv().NEXT_PUBLIC_SCHEDULE_MEETING_URL,
	},
];
export function NavIcons() {
	const { initialized, track } = useAnalytics();

	function handleIconClick(event: string, url: string) {
		if (initialized) {
			track(event, { url });
		}
		window.open(url);
	}

	return (
		<nav className="join" data-testid="nav-auction-icons">
			{NavigationTabs.map(({ icon, name, url }) => (
				<button
					key={name}
					className="hover:text-accent join-horizontal btn btn-ghost"
					data-testid={`${name}-btn`}
					onClick={() => {
						handleIconClick(
							`${name.charAt(0).toUpperCase() + name.split('-')[0].slice(1)}${TrackEvents.GenericClicked}`,
							url,
						);
					}}
				>
					{icon}
				</button>
			))}
		</nav>
	);
}
