import { AccessPermission, LoginResponseData } from 'shared/types';

export async function handleLogin(): Promise<LoginResponseData> {
	// return await fetcher<LoginResponseData>({
	// 	url: `login`,
	// 	method: HttpMethod.Get,
	// });
	//simulate 1 second delay then return dummy data
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(dummyLoginResponse);
		}, 1000);
	});
}
const dummyLoginResponse: LoginResponseData = {
	user: {
		id: '12345',
		firebaseId: 'fb_12345',
		createdAt: '2023-09-24T12:34:56Z',
	},
	projects: [
		{
			id: 'proj_1',
			name: 'Project Alpha',
			description: 'First project',
			permission: AccessPermission.ADMIN,
			isUserDefaultProject: true,
			createdAt: '2023-09-24T12:34:56Z',
		},
	],
};
