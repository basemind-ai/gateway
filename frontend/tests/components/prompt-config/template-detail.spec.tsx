import { render, screen } from 'tests/test-utils';

import { TemplateDetail } from '@/components/prompt-config/template-detail';

describe('Template Detail tests', () => {
	it('render Template Detail name', () => {
		render(
			<TemplateDetail
				name={'Album Recommendation'}
				imageSrc={'/images/openAI.svg'}
				status={'active'}
			/>,
		);

		const template_name = screen.getByText('Album Recommendation');
		expect(template_name).toBeInTheDocument();
	});

	it('render Template Detail status active', () => {
		render(
			<TemplateDetail
				name={'Album Recommendation'}
				imageSrc={'/images/openAI.svg'}
				status={'active'}
			/>,
		);

		const template_status_active = screen.getByText('active');
		expect(template_status_active).toBeInTheDocument();
	});

	it('render Template Detail status draft', () => {
		render(
			<TemplateDetail
				name={'Album Recommendation'}
				imageSrc={'/images/openAI.svg'}
				status={'draft'}
			/>,
		);

		const template_status_draft = screen.getByText('draft');
		expect(template_status_draft).toBeInTheDocument();
	});
});
