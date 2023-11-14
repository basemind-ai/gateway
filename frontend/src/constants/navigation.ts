export enum Navigation {
	Applications = '/projects/:projectId/applications/:applicationId',
	Base = '/',
	Billing = '/projects/:projectId/billing',
	CreateProject = '/projects/create',
	Overview = '/projects/:projectId',
	PrivacyPolicy = '/privacy-policy',
	Projects = '/projects',
	Prompts = '/projects/:projectId/applications/:applicationId/prompts/:configId',
	Settings = '/settings',
	SignIn = '/sign-in',
	Support = '/support',
	TOS = '/terms-of-service',
	Testing = '/projects/:projectId/testing',
	TestingConfig = '/projects/:projectId/applications/:applicationId/:configId/testing',
	TestingNewConfig = '/projects/:projectId/testing/new-config',
}
export const DISCORD_INVITE_LINK = 'https://discord.gg/Urxchkcq';
export const SUPPORT_EMAIL = 'support@basemind.ai';
