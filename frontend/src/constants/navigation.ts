export enum Navigation {
	ApplicationDetail = '/en/projects/:projectId/applications/:applicationId',
	Base = '/en',
	Billing = '/en/projects/:projectId/billing',
	ConfigCreateWizard = '/en/projects/:projectId/applications/:applicationId/config-create-wizard',
	CreateProject = '/en/projects/create',
	PrivacyPolicy = '/en/privacy-policy',
	ProjectDetail = '/en/projects/:projectId',
	Projects = '/en/projects',
	PromptConfigDetail = '/en/projects/:projectId/applications/:applicationId/configs/:promptConfigId',
	Settings = '/en/settings',
	SignIn = '/en/sign-in',
	Support = '/en/support',
	TOS = '/en/terms-of-service',
	Testing = '/en/projects/:projectId/testing',
}
export const DISCORD_INVITE_LINK = 'https://discord.gg/Urxchkcq';
export const SUPPORT_EMAIL = 'support@basemind.ai';

export enum PromptConfigPageTab {
	OVERVIEW,
	TESTING,
	SETTINGS,
}

export enum ApplicationPageTabNames {
	OVERVIEW,
	API_KEYS,
	SETTINGS,
}

export enum ProjectPageTabNames {
	OVERVIEW,
	MEMBERS,
	PROVIDER_KEYS,
	SETTINGS,
}
