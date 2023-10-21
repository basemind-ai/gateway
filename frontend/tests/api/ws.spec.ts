import { mockFetch } from 'tests/mocks';

import { handleCreateOTP } from '@/api/ws';
import { HttpMethod } from '@/constants';

describe('prompt testing websocket', () => {
	describe('handleCreateOTP', () => {
		it('returns an OTP', async () => {
			const otp = { otp: 'abc' };
			const projectId = '123';
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(otp),
			});
			const data = await handleCreateOTP({ projectId });

			expect(data).toEqual(otp);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL('http://www.example.com/v1/projects/123/otp/'),
				{
					headers: {
						'Authorization': 'Bearer test_token',
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Get,
				},
			);
		});
	});
});
