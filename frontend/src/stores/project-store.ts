import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

import { Application, Project } from '@/types';

export interface ProjectStore {
	projects: Project[];
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
}

export const projectStoreStateCreator: StateCreator<ProjectStore> = (
	set,
	get,
) => ({
	projects: [],
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
