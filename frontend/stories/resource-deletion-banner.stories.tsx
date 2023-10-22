import {
	ResourceDeletionBanner,
	ResourceDeletionBannerProps,
} from '@/components/resource-deletion-banner';

export default {
	title: 'ResourceDeletionBanner Component',
	component: ResourceDeletionBanner,
	parameters: {
		layout: 'centered',
		locale: 'en',
	},
	tags: ['autodocs'],
};

// TODO: figure out how to fix intl
export const Default = {
	parameters: {
		locale: 'en',
	},
	args: {
		title: 'Warning',
		description:
			'This act is irreversible, it will delete your application. All server requests sent to this application will not work',
		resourceName: 'Development',
		placeholder: 'Write applications name',
		onConfirm: () => {
			return;
		},
		onCancel: () => {
			return;
		},
	} satisfies ResourceDeletionBannerProps,
};
