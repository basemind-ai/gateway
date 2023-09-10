import { Project } from 'shared/types';
import { create, GetState, SetState } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

export interface ProjectStore {
	projects: Project[];
	setProjects: (projects: Project[]) => void;
	getProject: (projectId: string) => Project | undefined;
}

export const projectStoreStateCreator: StateCreator<ProjectStore> = (
	set: SetState<ProjectStore>,
	get: GetState<ProjectStore>,
) => ({
	// user
	projects: [],
	setProjects: (projects: Project[]) => {
		set({ projects });
	},
	getProject: (projectId: string) => {
		return get().projects.find((project) => project.id === projectId);
	},
});

export const useProjectStore = create(projectStoreStateCreator);

export const useSetProjects = () => useProjectStore((s) => s.setProjects);
export const useGetProject = () => useProjectStore((s) => s.getProject);
