import { UserInfo } from '@firebase/auth';
import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

import {
	APIKey,
	Application,
	Project,
	ProjectUserAccount,
	PromptConfig,
} from '@/types';

export interface ApiStore {
	addApplication: (projectId: string, application: Application) => void;
	addProject: (project: Project) => void;
	addProjectUser: (
		projectId: string,
		projectUser: ProjectUserAccount,
	) => void;
	addPromptConfig: (
		applicationId: string,
		promptConfig: PromptConfig,
	) => void;
	apiKeys: Record<string, APIKey[] | undefined>;
	applications: Record<string, Application[] | undefined>;
	deleteApplication: (projectId: string, applicationId: string) => void;
	deleteProject: (projectId: string) => void;
	deletePromptConfig: (applicationId: string, promptConfigId: string) => void;
	projectUsers: Record<string, ProjectUserAccount[] | undefined>;
	projects: Project[];
	promptConfigs: Record<string, PromptConfig[] | undefined>;
	removeProjectUser: (projectId: string, projectUserId: string) => void;
	selectedProjectId: string | null;
	setAPIKeys: (applicationId: string, apiKeys: APIKey[]) => void;
	setProjectApplications: (
		projectId: string,
		applications: Application[],
	) => void;
	setProjectUsers: (
		projectId: string,
		projectUsers: ProjectUserAccount[],
	) => void;
	setProjects: (projects: Project[]) => void;
	setPromptConfigs: (
		applicationId: string,
		promptConfigs: PromptConfig[],
	) => void;
	setSelectedProject: (selectedProjectId: string | null) => void;
	setUser: (user: UserInfo | null) => void;
	updateApplication: (
		projectId: string,
		applicationId: string,
		application: Application,
	) => void;
	updateProject: (projectId: string, updatedProject: Project) => void;
	updateProjectUser: (
		projectId: string,
		projectUser: ProjectUserAccount,
	) => void;
	updatePromptConfig: (
		applicationId: string,
		promptConfig: PromptConfig,
	) => void;
	user: UserInfo | null;
}

export const apiStoreCreator: StateCreator<ApiStore> = (set, get) => ({
	addApplication: (projectId: string, application: Application) => {
		const projectApplications = get().applications[projectId] ?? [];

		set((state) => ({
			applications: {
				...state.applications,
				[projectId]: [...projectApplications, application],
			},
		}));
	},
	addProject: (project: Project) => {
		set((state) => ({ projects: [...state.projects, project] }));
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
	apiKeys: {},
	applications: {},
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
	deleteProject: (projectId: string) => {
		set((state) => ({
			projects: state.projects.filter(
				(project) => project.id !== projectId,
			),
		}));
	},
	deletePromptConfig: (applicationId: string, promptConfigId: string) => {
		set((state) => ({
			promptConfigs: {
				...state.promptConfigs,
				[applicationId]: state.promptConfigs[applicationId]?.filter(
					(promptConfig) => promptConfig.id !== promptConfigId,
				),
			},
		}));
	},
	projectUsers: {},
	projects: [],
	promptConfigs: {},
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
	selectedProjectId: null,
	setAPIKeys: (applicationId: string, apiKeys: APIKey[]) => {
		set((state) => ({
			apiKeys: {
				...state.apiKeys,
				[applicationId]: apiKeys,
			},
		}));
	},
	setProjectApplications: (
		projectId: string,
		applications: Application[],
	) => {
		set((state) => ({
			applications: { ...state.applications, [projectId]: applications },
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
	setProjects: (projects: Project[]) => {
		set({ projects });
	},
	setPromptConfigs: (
		applicationId: string,
		promptConfigs: PromptConfig[],
	) => {
		set((state) => ({
			promptConfigs: {
				...state.promptConfigs,
				[applicationId]: promptConfigs,
			},
		}));
	},
	setSelectedProject: (selectedProjectId: string | null) => {
		set(() => ({ selectedProjectId }));
	},
	setUser: (user: UserInfo | null) => {
		set({ user });
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
	updateProject: (projectId: string, updatedProject: Project) => {
		set((state) => ({
			projects: state.projects.map((project) =>
				project.id === projectId ? updatedProject : project,
			),
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
	updatePromptConfig: (
		applicationId: string,
		updatedPromptConfig: PromptConfig,
	) => {
		set((state) => ({
			promptConfigs: {
				...state.promptConfigs,
				[applicationId]: state.promptConfigs[applicationId]?.map(
					(promptConfig) =>
						promptConfig.id === updatedPromptConfig.id
							? updatedPromptConfig
							: promptConfig,
				),
			},
		}));
	},
	user: null,
});

export const useApiStore = create(apiStoreCreator);
export const useAddApplication = () => useApiStore((s) => s.addApplication);
export const useAddProject = () => useApiStore((s) => s.addProject);
export const useAddProjectUser = () => useApiStore((s) => s.addProjectUser);
export const useAddPromptConfig = () => useApiStore((s) => s.addPromptConfig);
export const useApiKeys = (applicationId: string) =>
	useApiStore((s) => s.apiKeys[applicationId]);
export const useApplication = (projectId: string, applicationId: string) =>
	useApiStore(
		(s) =>
			s.applications[projectId]?.find(
				(application) => application.id === applicationId,
			),
	);
export const useApplications = (projectId?: string) =>
	useApiStore((s) => (projectId ? s.applications[projectId] : undefined));
export const useDeleteApplication = () =>
	useApiStore((s) => s.deleteApplication);
export const useDeleteProject = () => useApiStore((s) => s.deleteProject);
export const useDeletePromptConfig = () =>
	useApiStore((s) => s.deletePromptConfig);
export const useProject = (projectId: string) =>
	useApiStore((s) => s.projects.find((project) => project.id === projectId));
export const useProjectUsers = (projectId: string) =>
	useApiStore((s) => s.projectUsers[projectId]);
export const useProjects = () => useApiStore((s) => s.projects);
export const usePromptConfig = <
	P extends Record<string, any>,
	M extends Record<string, any>,
>(
	applicationId: string,
	promptConfigId: string,
) =>
	useApiStore(
		(s) =>
			s.promptConfigs[applicationId]?.find(
				(promptConfig) => promptConfig.id === promptConfigId,
			) as PromptConfig<P, M> | undefined,
	);
export const usePromptConfigs = () => useApiStore((s) => s.promptConfigs);
export const useRemoveProjectUser = () =>
	useApiStore((s) => s.removeProjectUser);
export const useSelectedProject = () =>
	useApiStore((s) =>
		s.projects.find((project) => project.id === s.selectedProjectId),
	);
export const useSetAPIKeys = () => useApiStore((s) => s.setAPIKeys);
export const useSetProjectApplications = () =>
	useApiStore((s) => s.setProjectApplications);
export const useSetProjectUsers = () => useApiStore((s) => s.setProjectUsers);
export const useSetProjects = () => useApiStore((s) => s.setProjects);
export const useSetPromptConfigs = () => useApiStore((s) => s.setPromptConfigs);
export const useSetSelectedProject = () =>
	useApiStore((s) => s.setSelectedProject);
export const useSetUser = () => useApiStore((s) => s.setUser);
export const useUpdateApplication = () =>
	useApiStore((s) => s.updateApplication);
export const useUpdateProject = () => useApiStore((s) => s.updateProject);
export const useUpdateProjectUser = () =>
	useApiStore((s) => s.updateProjectUser);
export const useUpdatePromptConfig = () =>
	useApiStore((s) => s.updatePromptConfig);
export const useUser = () => useApiStore((s) => s.user);
