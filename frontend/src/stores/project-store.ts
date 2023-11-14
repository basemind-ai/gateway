import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

import {
	APIKey,
	Application,
	Project,
	ProjectUserAccount,
	PromptConfig,
} from '@/types';

export interface ProjectStore {
	projects: Project[];
	applications: Record<string, Application[] | undefined>;
	promptConfigs: Record<string, PromptConfig[] | undefined>;
	apiKeys: Record<string, APIKey[] | undefined>;
	selectedProjectId: string | null;
	projectUsers: Record<string, ProjectUserAccount[] | undefined>;
	setProjects: (projects: Project[]) => void;
	addProject: (project: Project) => void;
	setSelectedProject: (selectedProjectId: string | null) => void;
	setProjectApplications: (
		projectId: string,
		applications: Application[],
	) => void;
	deleteApplication: (projectId: string, applicationId: string) => void;
	addApplication: (projectId: string, application: Application) => void;
	updateApplication: (
		projectId: string,
		applicationId: string,
		application: Application,
	) => void;
	setPromptConfig: (
		applicationId: string,
		promptConfigs: PromptConfig[],
	) => void;
	addPromptConfig: (
		applicationId: string,
		promptConfig: PromptConfig,
	) => void;
	setAPIKeys: (applicationId: string, apiKeys: APIKey[]) => void;
	setProjectUsers: (
		projectId: string,
		projectUsers: ProjectUserAccount[],
	) => void;
	addProjectUser: (
		projectId: string,
		projectUser: ProjectUserAccount,
	) => void;
	updateProjectUser: (
		projectId: string,
		projectUser: ProjectUserAccount,
	) => void;
	removeProjectUser: (projectId: string, projectUserId: string) => void;
	updateProject: (projectId: string, updatedProject: Project) => void;
	deleteProject: (projectId: string) => void;
}

export const projectStoreStateCreator: StateCreator<ProjectStore> = (
	set,
	get,
) => ({
	projects: [],
	applications: {},
	promptConfigs: {},
	apiKeys: {},
	selectedProjectId: null,
	projectUsers: {},
	setProjects: (projects: Project[]) => {
		set({ projects });
	},
	addProject: (project: Project) => {
		set((state) => ({ projects: [...state.projects, project] }));
	},
	setSelectedProject: (selectedProjectId: string | null) => {
		set(() => ({ selectedProjectId }));
	},
	setProjectApplications: (
		projectId: string,
		applications: Application[],
	) => {
		set((state) => ({
			applications: {
				...state.applications,
				[projectId]: applications,
			},
		}));
	},
	deleteApplication: (projectId: string, applicationId: string) => {
		const projectApplications = get().applications[projectId];
		if (!projectApplications) {
			return;
		}

		const applications = projectApplications.filter(
			(application) => application.id !== applicationId,
		);

		set((state) => ({
			applications: {
				...state.applications,
				[projectId]: applications,
			},
		}));
	},
	addApplication: (projectId: string, application: Application) => {
		const projectApplications = get().applications[projectId] ?? [];

		set((state) => ({
			applications: {
				...state.applications,
				[projectId]: [...projectApplications, application],
			},
		}));
	},
	updateApplication: (
		projectId: string,
		applicationId: string,
		updatedApplication: Application,
	) => {
		const projectApplications = get().applications[projectId];
		if (!projectApplications) {
			return;
		}

		const applications = projectApplications.map((application) =>
			application.id === applicationId ? updatedApplication : application,
		);

		set((state) => ({
			applications: {
				...state.applications,
				[projectId]: applications,
			},
		}));
	},
	setPromptConfig: (applicationId: string, promptConfigs: PromptConfig[]) => {
		set((state) => ({
			promptConfigs: {
				...state.promptConfigs,
				[applicationId]: promptConfigs,
			},
		}));
	},
	addPromptConfig: (applicationId: string, promptConfig: PromptConfig) => {
		set((state) => ({
			promptConfigs: {
				...state.promptConfigs,
				[applicationId]: [
					...(state.promptConfigs[applicationId] ?? []),
					promptConfig,
				],
			},
		}));
	},
	setAPIKeys: (applicationId: string, apiKeys: APIKey[]) => {
		set((state) => ({
			apiKeys: {
				...state.apiKeys,
				[applicationId]: apiKeys,
			},
		}));
	},
	setProjectUsers: (
		projectId: string,
		projectUsers: ProjectUserAccount[],
	) => {
		set((state) => ({
			projectUsers: {
				...state.projectUsers,
				[projectId]: projectUsers,
			},
		}));
	},
	addProjectUser: (projectId: string, projectUser: ProjectUserAccount) => {
		const existingUsers = get().projectUsers[projectId] ?? [];
		const alreadyExists = existingUsers.some(
			(existingUser) => existingUser.id === projectUser.id,
		);
		if (alreadyExists) {
			return;
		}
		set((state) => ({
			projectUsers: {
				...state.projectUsers,
				[projectId]: [projectUser, ...existingUsers],
			},
		}));
	},
	updateProjectUser: (projectId: string, projectUser: ProjectUserAccount) => {
		const existingUsers = get().projectUsers[projectId];
		if (!existingUsers) {
			return;
		}

		const updatedUsers = existingUsers.map((existingUser) =>
			existingUser.id === projectUser.id ? projectUser : existingUser,
		);
		set((state) => ({
			projectUsers: {
				...state.projectUsers,
				[projectId]: updatedUsers,
			},
		}));
	},
	removeProjectUser: (projectId: string, projectUserId: string) => {
		const existingUsers = get().projectUsers[projectId];
		if (!existingUsers) {
			return;
		}

		const updatedUsers = existingUsers.filter(
			(existingUser) => existingUser.id !== projectUserId,
		);
		set((state) => ({
			projectUsers: {
				...state.projectUsers,
				[projectId]: updatedUsers,
			},
		}));
	},
	updateProject: (projectId: string, updatedProject: Project) => {
		set((state) => ({
			projects: state.projects.map((project) =>
				project.id === projectId ? updatedProject : project,
			),
		}));
	},
	deleteProject: (projectId: string) => {
		set((state) => ({
			projects: state.projects.filter(
				(project) => project.id !== projectId,
			),
		}));
	},
});

export const useProjectStore = create(projectStoreStateCreator);
export const useSetProjects = () => useProjectStore((s) => s.setProjects);
export const useAddProject = () => useProjectStore((s) => s.addProject);
export const useProject = (projectId: string) =>
	useProjectStore((s) =>
		s.projects.find((project) => project.id === projectId),
	);
export const useProjects = () => useProjectStore((s) => s.projects);
export const useSelectedProject = () =>
	useProjectStore((s) => {
		const { projects, selectedProjectId } = s;
		if (!selectedProjectId) {
			return;
		}
		return projects.find((project) => project.id === selectedProjectId);
	});
export const useSetSelectedProject = () =>
	useProjectStore((s) => s.setSelectedProject);
export const useSetProjectApplications = () =>
	useProjectStore((s) => s.setProjectApplications);
export const useApplications = (projectId?: string) =>
	useProjectStore((s) => (projectId ? s.applications[projectId] : undefined));
export const useApplication = (projectId: string, applicationId: string) =>
	useProjectStore((s) => {
		const projectApplications = s.applications[projectId];
		if (!projectApplications) {
			return;
		}
		return projectApplications.find(
			(application) => application.id === applicationId,
		);
	});
export const useDeleteApplication = () =>
	useProjectStore((s) => s.deleteApplication);
export const useAddApplication = () => useProjectStore((s) => s.addApplication);
export const useUpdateApplication = () =>
	useProjectStore((s) => s.updateApplication);
export const usePromptConfigs = () => useProjectStore((s) => s.promptConfigs);
export const usePromptConfig = <P, M>(
	applicationId: string,
	promptConfigId: string,
) =>
	useProjectStore(
		(s) =>
			s.promptConfigs[applicationId]?.find(
				(promptConfig) => promptConfig.id === promptConfigId,
			) as PromptConfig<P, M> | undefined,
	);
export const useSetPromptConfigs = () =>
	useProjectStore((s) => s.setPromptConfig);
export const useAddPromptConfig = () =>
	useProjectStore((s) => s.addPromptConfig);
export const useAPIKeys = (applicationId: string) =>
	useProjectStore((s) => s.apiKeys[applicationId]);
export const useSetAPIKeys = () => useProjectStore((s) => s.setAPIKeys);
export const useProjectUsers = (projectId: string) =>
	useProjectStore((s) => s.projectUsers[projectId]);
export const useSetProjectUsers = () =>
	useProjectStore((s) => s.setProjectUsers);
export const useAddProjectUser = () => useProjectStore((s) => s.addProjectUser);
export const useUpdateProjectUser = () =>
	useProjectStore((s) => s.updateProjectUser);
export const useRemoveProjectUser = () =>
	useProjectStore((s) => s.removeProjectUser);
export const useUpdateProject = () => useProjectStore((s) => s.updateProject);
export const useDeleteProject = () => useProjectStore((s) => s.deleteProject);
