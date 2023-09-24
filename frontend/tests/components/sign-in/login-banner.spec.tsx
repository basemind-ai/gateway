import locales from 'public/locales/en.json';
import { render, screen } from 'tests/test-utils';

import { LoginBanner } from '@/components/sign-in/login-banner';

const signinLocales = locales.signin;

describe('LoginBanner tests', () => {
	it('renders LoginBanner', () => {
		render(
			<LoginBanner
				imageSrc="/images/pinecone-transparent-bg.svg"
				iconSrc="/images/pinecone-round.svg"
			/>,
		);

		const icon = screen.getByTestId<HTMLImageElement>('login-banner-icon');
		const splashImage = screen.getByTestId<HTMLImageElement>(
			'login-banner-splash-image',
		);
		const heading = screen.getByText(signinLocales.bannerHeading);
		const title = screen.getByText(signinLocales.bannerTitle);
		const subtitle = screen.getByText(signinLocales.bannerSubtitle);

		expect(icon.src).toContain('/images/pinecone-round.svg');
		expect(splashImage.src).toContain(
			'/images/pinecone-transparent-bg.svg',
		);
		expect(heading).toBeInTheDocument();
		expect(title).toBeInTheDocument();
		expect(subtitle).toBeInTheDocument();
	});
});
