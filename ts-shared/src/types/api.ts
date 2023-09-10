import { Project, User } from 'shared/types';

export interface LoginResponseData {
	user: User;
	projects: Project[];
}
