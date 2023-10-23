export enum Navigation {
	Api = '/projects/:projectId/api',
	Base = '/',
	Overview = '/projects/:projectId',
	Projects = '/projects',
	CreateProject = '/projects/create',
	Prompt = '/projects/:projectId/prompt',
	SignIn = '/sign-in',
	Settings = '/projects/:projectId/settings',
	Billing = '/projects/:projectId/billing',
	Support = '/support',
	Application = '/projects/:projectId/application/:applicationId',
}
