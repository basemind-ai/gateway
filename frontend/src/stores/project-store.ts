import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

import { Application, Project, PromptConfig, Token } from '@/types';

export interface ProjectStore {
	projects: Project[];
	applications: Record<string, Application[] | undefined>;
	promptConfigs: Record<string, PromptConfig[] | undefined>;
	tokens: Record<string, Token[] | undefined>;
	currentProjectId: string | null;
	setProjects: (projects: Project[]) => void;
	addProject: (project: Project) => void;
	setCurrentProject: (currentProjectId: string) => void;
	getCurrentProject: () => Project | undefined;
	setProjectApplications: (
		projectId: string,
		applications: Application[],
	) => void;
	deleteApplication: (projectId: string, applicationId: string) => void;
	updateApplication: (
		projectId: string,
		applicationId: string,
		application: Application,
	) => void;
	setPromptConfig: (
		applicationId: string,
		promptConfig: PromptConfig[],
	) => void;
	setTokens: (applicationId: string, tokens: Token[]) => void;
}

export const projectStoreStateCreator: StateCreator<ProjectStore> = (
	set,
	get,
) => ({
	projects: [],
	applications: {},
	promptConfigs: {},
	tokens: {},
	currentProjectId: null,
	setProjects: (projects: Project[]) => {
		set({ projects });
	},
	addProject: (project: Project) => {
		set((state) => ({ projects: [...state.projects, project] }));
	},
	setCurrentProject: (currentProjectId: string) => {
		set(() => ({ currentProjectId }));
	},
	getCurrentProject: () => {
		const { projects, currentProjectId } = get();
		if (!currentProjectId) {
			return;
		}
		return projects.find((project) => project.id === currentProjectId);
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
	setPromptConfig: (applicationId: string, promptConfig: PromptConfig[]) => {
		set((state) => ({
			promptConfigs: {
				...state.promptConfigs,
				[applicationId]: promptConfig,
			},
		}));
	},
	setTokens: (applicationId: string, tokens: Token[]) => {
		set((state) => ({
			tokens: {
				...state.tokens,
				[applicationId]: tokens,
			},
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
export const useCurrentProject = () =>
	useProjectStore((s) => s.getCurrentProject);
export const useSetCurrentProject = () =>
	useProjectStore((s) => s.setCurrentProject);
export const useSetProjectApplications = () =>
	useProjectStore((s) => s.setProjectApplications);
export const useGetApplications = () => useProjectStore((s) => s.applications);
export const useGetApplication = (projectId: string, applicationId: string) =>
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
export const useUpdateApplication = () =>
	useProjectStore((s) => s.updateApplication);
export const useGetPromptConfig = () => useProjectStore((s) => s.promptConfigs);
export const useSetPromptConfig = () =>
	useProjectStore((s) => s.setPromptConfig);
export const useGetTokens = (applicationId: string) =>
	useProjectStore((s) => s.tokens[applicationId]);
export const useSetTokens = () => useProjectStore((s) => s.setTokens);
