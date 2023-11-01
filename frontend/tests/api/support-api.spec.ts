import { mockFetch } from 'tests/mocks';

import { handleCreateSupportTicket } from '@/api';
import { HttpMethod } from '@/constants';
import { SupportTopic } from '@/constants/forms';

describe('support API tests', () => {
	describe('handleCreateSupportTicket', () => {
		it('sends an API POST request as expected', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(),
			});
			await handleCreateSupportTicket({
				type: SupportTopic.API,
				subject: 'not working',
				body: 'help please',
			});

			expect(mockFetch).toHaveBeenCalledWith(
				new URL(`http://www.example.com/v1/support/`),
				{
					headers: {
						'Authorization': 'Bearer test_token',
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Post,
					body: JSON.stringify({
						type: SupportTopic.API,
						subject: 'not working',
						body: 'help please',
					}),
				},
			);
		});
	});
});
