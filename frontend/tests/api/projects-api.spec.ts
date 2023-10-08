// import { ProjectFactory } from 'tests/factories';
// import { mockFetch } from 'tests/mocks';
//
// import { HttpMethod } from '@/constants';
//
// describe('handleRetrieveUserProjects tests', () => {
// 	it('returns a list of projects', async () => {
// 		const projects = await ProjectFactory.batch(2);
// 		mockFetch.mockResolvedValueOnce({
// 			ok: true,
// 			json: () => Promise.resolve(projects),
// 		});
// 		const data = await handleRetrieveUserAccountData();
//
// 		expect(data).toEqual(projects);
// 		expect(mockFetch).toHaveBeenCalledWith(
// 			new URL(`http://www.example.com/v1/projects`),
// 			{
// 				headers: {
// 					'Authorization': 'Bearer test_token',
// 					'Content-Type': 'application/json',
// 					'X-Request-Id': expect.any(String),
// 				},
// 				method: HttpMethod.Get,
// 			},
// 		);
// 	});
// });
