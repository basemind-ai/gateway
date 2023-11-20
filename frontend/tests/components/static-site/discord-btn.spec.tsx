import { fireEvent, screen } from '@testing-library/react';
import { routerPushMock } from 'tests/mocks';
import { render } from 'tests/test-utils';
import { describe } from 'vitest';

import DiscordButton from '@/components/static-site/discord-button';
import { DISCORD_INVITE_LINK } from '@/constants';

describe('discord-btn tests', () => {
	it('should render the discord button', () => {
		render(<DiscordButton />);

		expect(screen.getByTestId('discord-btn')).toBeInTheDocument();
	});

	it('clicking on the discord button should open the discord invite link', () => {
		render(<DiscordButton />);
		const discordBtn = screen.getByTestId('discord-btn');
		fireEvent.click(discordBtn);

		expect(routerPushMock).toHaveBeenCalledWith(DISCORD_INVITE_LINK);
	});
});
