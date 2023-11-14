import {
	ResourceDeletionBanner,
	ResourceDeletionBannerProps,
} from '@/components/resource-deletion-banner';

export default {
	component: ResourceDeletionBanner,
	parameters: {
		layout: 'centered',
		locale: 'en',
	},
	tags: ['autodocs'],
	title: 'ResourceDeletionBanner Component',
};

// TODO: figure out how to fix intl
export const Default = {
	args: {
		description:
			'This act is irreversible, it will delete your application. All server requests sent to this application will not work',
		onCancel: () => {
			return;
		},
		onConfirm: () => {
			return;
		},
		placeholder: 'Write applications name',
		resourceName: 'Development',
		title: 'Warning',
	} satisfies ResourceDeletionBannerProps,
	parameters: {
		locale: 'en',
	},
};
