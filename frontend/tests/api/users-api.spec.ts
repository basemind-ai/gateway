import { mockFetch } from 'tests/mocks';

import { handleDeleteUserAccount } from '@/api/users-api';
import { HttpMethod } from '@/constants';

describe('users API tests', () => {
	it('deletes a user', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(),
		});
		await handleDeleteUserAccount();

		expect(mockFetch).toHaveBeenCalledWith(
			new URL('http://www.example.com/v1/users/'),
			{
				headers: {
					'Authorization': 'Bearer test_token',
					'Content-Type': 'application/json',
					'X-Request-Id': expect.any(String),
				},
				method: HttpMethod.Delete,
			},
		);
	});
});
