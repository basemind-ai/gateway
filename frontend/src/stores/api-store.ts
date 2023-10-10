import { UserInfo } from '@firebase/auth';
import { create } from 'zustand';
import { StateCreator } from 'zustand/vanilla';

import { Project } from '@/types';

export interface ApiStore {
	user: UserInfo | null;
	projects: Project[];
	setUser: (user: UserInfo) => void;
	setProjects: (projects: Project[]) => void;
	addProject: (project: Project) => void;
}

export const apiStoreStateCreator: StateCreator<ApiStore> = (set, _) => ({
	user: null,
	projects: [],
	setUser: (user: UserInfo) => {
		set({ user });
	},
	setProjects: (projects: Project[]) => {
		set({ projects });
	},
	addProject: (project: Project) => {
		set((state) => ({ projects: [...state.projects, project] }));
	},
});

export const useAPIStore = create(apiStoreStateCreator);
export const useUser = () => useAPIStore((s) => s.user);
export const useSetUser = () => useAPIStore((s) => s.setUser);
export const useSetProjects = () => useAPIStore((s) => s.setProjects);
export const useAddProject = () => useAPIStore((s) => s.addProject);
export const useProject = (projectId: string) =>
	useAPIStore((s) => s.projects.find((project) => project.id === projectId));
export const useProjects = () => useAPIStore((s) => s.projects);
