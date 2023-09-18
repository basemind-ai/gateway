import bannerTranslation from 'public/locales/en/signin-banner.json';
import { render, screen } from 'tests/test-utils';

import { LoginBanner } from '@/app/sign-in/login-banner';

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
		const heading = screen.getByText(bannerTranslation.bannerHeading);
		const title = screen.getByText(bannerTranslation.bannerTitle);
		const subtitle = screen.getByText(bannerTranslation.bannerSubtitle);

		expect(icon.src).toContain('/images/pinecone-round.svg');
		expect(splashImage.src).toContain(
			'/images/pinecone-transparent-bg.svg',
		);
		expect(heading).toBeInTheDocument();
		expect(title).toBeInTheDocument();
		expect(subtitle).toBeInTheDocument();
	});
});
