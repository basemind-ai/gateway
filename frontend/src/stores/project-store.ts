import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

import { Application, Project, PromptConfig } from '@/types';

export interface ProjectStore {
	projects: Project[];
	promptConfigs: Record<string, PromptConfig[] | undefined>;
	currentProjectId: string | null;
	setProjects: (projects: Project[]) => void;
	addProject: (project: Project) => void;
	setCurrentProject: (currentProjectId: string) => void;
	getCurrentProject: () => Project | undefined;
	setProjectApplications: (
		projectId: string,
		applications: Application[],
	) => void;
	getApplication: (
		projectId: string,
		applicationId: string,
	) => Application | undefined;
	setPromptConfig: (
		applicationId: string,
		promptConfig: PromptConfig[],
	) => void;
}

export const projectStoreStateCreator: StateCreator<ProjectStore> = (
	set,
	get,
) => ({
	projects: [],
	promptConfigs: {},
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
		const project = get().projects.find(
			(project) => project.id === projectId,
		);
		if (!project) {
			return;
		}
		const updatedProject = {
			...project,
			applications,
		};
		set(() => ({
			projects: get().projects.map((project) =>
				project.id === projectId ? updatedProject : project,
			),
		}));
	},
	getApplication: (projectId: string, applicationId: string) => {
		return get()
			.projects.find((project) => project.id === projectId)
			?.applications?.find(
				(application) => application.id === applicationId,
			);
	},
	setPromptConfig: (applicationId: string, promptConfig: PromptConfig[]) => {
		set((state) => ({
			promptConfigs: {
				...state.promptConfigs,
				[applicationId]: promptConfig,
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
export const useGetApplication = () => useProjectStore((s) => s.getApplication);
export const useGetPromptConfig = () => useProjectStore((s) => s.promptConfigs);
export const useSetPromptConfig = () =>
	useProjectStore((s) => s.setPromptConfig);
