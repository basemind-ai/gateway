import { fireEvent, screen } from '@testing-library/react';
import { routerPushMock } from 'tests/mocks';
import { render } from 'tests/test-utils';
import { describe } from 'vitest';

import DiscordBtn from '@/components/static-site/discord-btn';
import { DISCORD_INVITE_LINK } from '@/constants';

describe('discord-btn tests', () => {
	it('should render the discord button', () => {
		render(<DiscordBtn />);

		expect(screen.getByTestId('discord-btn')).toBeInTheDocument();
	});

	it('clicking on the discord button should open the discord invite link', () => {
		render(<DiscordBtn />);
		const discordBtn = screen.getByTestId('discord-btn');
		fireEvent.click(discordBtn);

		expect(routerPushMock).toHaveBeenCalledWith(DISCORD_INVITE_LINK);
	});
});
