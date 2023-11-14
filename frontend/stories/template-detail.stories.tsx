import {
	TemplateDetail,
	TemplateDetailProps,
} from '@/components/prompt-config/template-detail';

export default {
	component: TemplateDetail,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
	title: 'Template Detail Component',
};

export const Default = {
	args: {
		imageSrc: '/images/openAI.svg',
		name: 'Album Recommendation',
		status: 'active',
	} satisfies TemplateDetailProps,
};

export const Draft = {
	args: {
		imageSrc: '/images/openAI.svg',
		name: 'Album Recommendation V2',
		status: 'draft',
	} satisfies TemplateDetailProps,
};
