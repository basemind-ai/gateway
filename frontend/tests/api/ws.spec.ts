import { WebSocket } from 'mock-socket';
import { mockFetch } from 'tests/mocks';
import { beforeEach } from 'vitest';

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
	describe('createWebsocket', () => {
		beforeEach(() => {
			global.WebSocket = WebSocket;
		});

		it('returns a websocket', async () => {
			const projectId = '123';
			const otp = 'abc';
			const ws = { ws: 'ws' };
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(ws),
			});
			const data = await handleCreateOTP({ projectId, otp });

			expect(data).toEqual(ws);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL('http://www.example.com/v1/projects/123/otp/abc'),
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
