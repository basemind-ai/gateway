import locales from 'public/locales/en.json';
import { render, screen } from 'tests/test-utils';

import PromptConfigurations from '@/app/projects/[projectId]/prompt/page';

const promptTranslation = locales.prompt;

describe('Prompt page tests', () => {
	it('render Prompt testing', () => {
		render(<PromptConfigurations />);

		const dashboardContainer = screen.getByTestId('prompt-page');
		expect(dashboardContainer).toBeInTheDocument();
	});

	it('render Prompt testing heading', () => {
		render(<PromptConfigurations />);

		const promptHeader = screen.getByText(promptTranslation.promptHeader);
		expect(promptHeader).toBeInTheDocument();
	});

	it('render Prompt testing saved template', () => {
		render(<PromptConfigurations />);

		const savedPromptConfig = screen.getByText(
			promptTranslation.savedPromptConfig,
		);
		expect(savedPromptConfig).toBeInTheDocument();
	});
});
