export interface User {
	id: string;
	firebaseId: string;
	createdAt: string;
}

export interface Project {
	id: string;
	name: string;
	description: string;
	permission: AccessPermission;
	isUserDefaultProject: boolean;
	createdAt: string;
}

export enum AccessPermission {
	ADMIN = 'ADMIN',
	MEMBER = 'MEMBER',
}
