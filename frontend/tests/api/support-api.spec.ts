import { faker } from '@faker-js/faker';
import { mockFetch } from 'tests/mocks';

import { handleCreateSupportTicket } from '@/api';
import { HttpMethod } from '@/constants';
import { SupportTopic } from '@/constants/forms';

describe('support API tests', () => {
	describe('handleCreateSupportTicket', () => {
		it('sends an API POST request as expected', async () => {
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(),
				ok: true,
			});
			const uuid = faker.string.uuid();
			await handleCreateSupportTicket({
				body: 'help please',
				projectId: uuid,
				subject: 'not working',
				topic: SupportTopic.API,
			});

			expect(mockFetch).toHaveBeenCalledWith(
				new URL('http://www.example.com/v1/support/'),
				{
					body: JSON.stringify({
						body: 'help please',
						projectId: uuid,
						subject: 'not working',
						topic: SupportTopic.API,
					}),
					headers: {
						'Authorization': 'Bearer test_token',
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Post,
				},
			);
		});
		it('sends an API POST request without projectID', async () => {
			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(),
				ok: true,
			});
			await handleCreateSupportTicket({
				body: 'help please',
				subject: 'not working',
				topic: SupportTopic.API,
			});

			expect(mockFetch).toHaveBeenCalledWith(
				new URL('http://www.example.com/v1/support/'),
				{
					body: JSON.stringify({
						body: 'help please',
						subject: 'not working',
						topic: SupportTopic.API,
					}),
					headers: {
						'Authorization': 'Bearer test_token',
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Post,
				},
			);
		});
	});
});
