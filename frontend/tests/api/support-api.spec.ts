import { faker } from '@faker-js/faker';
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
			const uuid = faker.string.uuid();
			await handleCreateSupportTicket({
				topic: SupportTopic.API,
				subject: 'not working',
				body: 'help please',
				projectId: uuid,
			});

			expect(mockFetch).toHaveBeenCalledWith(
				new URL('http://www.example.com/v1/support/'),
				{
					headers: {
						'Authorization': 'Bearer test_token',
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Post,
					body: JSON.stringify({
						topic: SupportTopic.API,
						subject: 'not working',
						body: 'help please',
						projectId: uuid,
					}),
				},
			);
		});
		it('sends an API POST request without projectID', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(),
			});
			await handleCreateSupportTicket({
				topic: SupportTopic.API,
				subject: 'not working',
				body: 'help please',
			});

			expect(mockFetch).toHaveBeenCalledWith(
				new URL('http://www.example.com/v1/support/'),
				{
					headers: {
						'Authorization': 'Bearer test_token',
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Post,
					body: JSON.stringify({
						topic: SupportTopic.API,
						subject: 'not working',
						body: 'help please',
					}),
				},
			);
		});
	});
});
