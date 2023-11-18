import { render, screen } from 'tests/test-utils';

import { IntroSection } from '@/components/static-site/intro-section';

describe('IntroSection', () => {
	it('should render a section with name "intro"', () => {
		render(<IntroSection />);
		const section = screen.getByTestId('landing-page-intro-section');
		expect(section).toBeInTheDocument();
	});

	it('should render a title and description from translations', () => {
		render(<IntroSection />);
		const title = screen.getByTestId('intro-section-title');
		const description = screen.getByTestId('intro-section-description');
		expect(title).toBeInTheDocument();
		expect(description).toBeInTheDocument();
	});

	it('should render an image with alt text "Hero Image"', () => {
		render(<IntroSection />);
		const image = screen.getByAltText('Hero Image');
		expect(image).toBeInTheDocument();
	});

	it('should render default title and description when translations are not provided', () => {
		render(<IntroSection />);
		const title = screen.getByTestId('intro-section-title');
		const description = screen.getByTestId('intro-section-description');
		expect(title).toBeInTheDocument();
		expect(description).toBeInTheDocument();
	});

	it('should render default image when source is not provided', () => {
		render(<IntroSection />);
		const image = screen.getByTestId('intro-section-image-container');
		expect(image).toBeInTheDocument();
	});
});
