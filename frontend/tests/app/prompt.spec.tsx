import locales from 'public/locales/en.json';
import { render, screen } from 'tests/test-utils';

import Prompt from '@/app/project/[projectId]/prompt/page';

const promptTranslation = locales.prompt;
describe('Prompt page tests', () => {
	it('render Prompt testing', async () => {
		render(<Prompt />);

		const dashboardContainer = screen.getByTestId('prompt');
		expect(dashboardContainer).toBeInTheDocument();
	});

	it('render Prompt testing heading', async () => {
		render(<Prompt />);

		const promptHeader = screen.getByText(promptTranslation.promptHeader);
		expect(promptHeader).toBeInTheDocument();
	});

	it('render Prompt testing saved template', async () => {
		render(<Prompt />);

		const promptSavedTemplates = screen.getByText(
			promptTranslation.promptSavedTemplates,
		);
		expect(promptSavedTemplates).toBeInTheDocument();
	});
});
