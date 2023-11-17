import {
	ApplicationFactory,
	OpenAIPromptConfigFactory,
	ProjectFactory,
	PromptTestRecordFactory,
} from 'tests/factories';
import { mockFetch } from 'tests/mocks';

import {
	handleDeletePromptTestRecord,
	handleRetrievePromptTestRecordById,
	handleRetrievePromptTestRecords,
} from '@/api/prompt-test-record-api';
import { HttpMethod } from '@/constants';

describe('PromptTestRecord API tests', () => {
	const bearerToken = 'Bearer test_token';

	describe('handleRetrievePromptTestRecords', () => {
		it('should return an array of PromptTestRecords', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const promptConfig = await OpenAIPromptConfigFactory.build();
			const promptTestRecords = await PromptTestRecordFactory.batch(2, {
				promptConfigId: promptConfig.id,
			});

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(promptTestRecords),
				ok: true,
			});

			const data = await handleRetrievePromptTestRecords({
				applicationId: application.id,
				projectId: project.id,
			});

			expect(data).toEqual(promptTestRecords);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/test-records/`,
				),
				{
					headers: {
						'Authorization': bearerToken,
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Get,
				},
			);
		});
	});
	describe('handleRetrievePromptTestRecordById', () => {
		it('should return a PromptTestRecord', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const promptConfig = await OpenAIPromptConfigFactory.build();
			const promptTestRecord = await PromptTestRecordFactory.build({
				promptConfigId: promptConfig.id,
			});

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(promptTestRecord),
				ok: true,
			});

			const data = await handleRetrievePromptTestRecordById({
				applicationId: application.id,
				projectId: project.id,
				promptTestRecordId: promptTestRecord.id,
			});

			expect(data).toEqual(promptTestRecord);
			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/test-records/${promptTestRecord.id}/`,
				),
				{
					headers: {
						'Authorization': bearerToken,
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Get,
				},
			);
		});
	});
	describe('handleDeletePromptTestRecord', () => {
		it('should delete a PromptTestRecord', async () => {
			const project = await ProjectFactory.build();
			const application = await ApplicationFactory.build();
			const promptConfig = await OpenAIPromptConfigFactory.build();
			const promptTestRecord = await PromptTestRecordFactory.build({
				promptConfigId: promptConfig.id,
			});

			mockFetch.mockResolvedValueOnce({
				json: () => Promise.resolve(),
				ok: true,
			});

			await handleDeletePromptTestRecord({
				applicationId: application.id,
				projectId: project.id,
				promptTestRecordId: promptTestRecord.id,
			});

			expect(mockFetch).toHaveBeenCalledWith(
				new URL(
					`http://www.example.com/v1/projects/${project.id}/applications/${application.id}/test-records/${promptTestRecord.id}/`,
				),
				{
					headers: {
						'Authorization': bearerToken,
						'Content-Type': 'application/json',
						'X-Request-Id': expect.any(String),
					},
					method: HttpMethod.Delete,
				},
			);
		});
	});
});
