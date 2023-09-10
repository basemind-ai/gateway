export interface Project {
	id: string;
	name: string;
	description: string;
	permission: AccessPermission;
	is_user_default_project: boolean;
	created_at: string;
}

export enum AccessPermission {
	ADMIN = 'ADMIN',
	MEMBER = 'MEMBER',
}
