import {
	TemplateDetail,
	TemplateDetailProps,
} from '@/components/prompt-config/template-detail';

export default {
	title: 'Template Detail Component',
	component: TemplateDetail,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
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
