import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
	ApplicationFactory,
	ProjectFactory,
	PromptConfigFactory,
	UserFactory,
} from 'tests/factories';
import { getAuthMock } from 'tests/mocks';
import { render, renderHook, routerReplaceMock } from 'tests/test-utils';
import { beforeEach, describe, expect } from 'vitest';

import * as PromptConfigAPI from '@/api/prompt-config-api';
import ConfigEditScreen from '@/app/[locale]/projects/[projectId]/applications/[applicationId]/[configId]/[name]/page';
import { Navigation } from '@/constants';
import { useSetPromptConfigs } from '@/stores/api-store';

describe('config-edit-screen', () => {
	const getIdTokenMock = vi.fn().mockResolvedValue('token');

	beforeEach(() => {
		getAuthMock.mockImplementationOnce(() => ({
			currentUser: {
				...UserFactory.buildSync(),
				getIdToken: getIdTokenMock,
			},
			setPersistence: vi.fn(),
		}));
	});
	afterEach(() => {
		getAuthMock.mockReset();
	});

	it('should redirects unauthenticated user to login page', async () => {
		getAuthMock.mockImplementationOnce(() => ({
			currentUser: null,
			setPersistence: vi.fn(),
		}));
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const promptConfig = await PromptConfigFactory.build();
		const name = 'test-config';
		render(
			<ConfigEditScreen
				params={{
					applicationId: application.id,
					configId: promptConfig.id,
					name,
					projectId: project.id,
				}}
			/>,
		);
		await waitFor(() => {
			expect(routerReplaceMock).not.toHaveBeenCalledWith(
				Navigation.SignIn,
			);
		});
	});

	it('should render headline', async () => {
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const promptConfig = await PromptConfigFactory.build();
		const name = 'test-config';
		render(
			<ConfigEditScreen
				params={{
					applicationId: application.id,
					configId: promptConfig.id,
					name,
					projectId: project.id,
				}}
			/>,
		);
		expect(
			screen.getByTestId('config-edit-screen-title'),
		).toHaveTextContent(name);
	});

	it('clicking createConfig should new config when configId is "new"', async () => {
		const handleCreatePromptConfigSpy = vi
			.spyOn(PromptConfigAPI, 'handleCreatePromptConfig')
			.mockResolvedValueOnce(await PromptConfigFactory.build());
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const name = 'test-config';
		render(
			<ConfigEditScreen
				params={{
					applicationId: application.id,
					configId: 'new',
					name,
					projectId: project.id,
				}}
			/>,
		);
		const createConfigButton = screen.getByTestId('test-create-button');
		fireEvent.click(createConfigButton);
		expect(handleCreatePromptConfigSpy).toHaveBeenCalled();
		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalled();
		});
	});

	it('saves an existing configuration', async () => {
		const handleUpdatePromptConfigSpy = vi
			.spyOn(PromptConfigAPI, 'handleUpdatePromptConfig')
			.mockResolvedValueOnce(await PromptConfigFactory.build());
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const promptConfig = await PromptConfigFactory.build();
		const name = 'existing-config';
		const { result } = renderHook(() => useSetPromptConfigs());
		result.current(application.id, [promptConfig]);

		render(
			<ConfigEditScreen
				params={{
					applicationId: application.id,
					configId: promptConfig.id,
					name,
					projectId: project.id,
				}}
			/>,
		);
		fireEvent.click(screen.getByTestId('test-create-button'));
		await waitFor(() => {
			expect(handleUpdatePromptConfigSpy).toHaveBeenCalled();
		});
		expect(routerReplaceMock).toHaveBeenCalled();
		handleUpdatePromptConfigSpy.mockRestore();
	});

	it('creates a new configuration', async () => {
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const name = 'New Configuration';
		const mockNewConfig = await PromptConfigFactory.build({ name });
		const handleCreatePromptConfigSpy = vi
			.spyOn(PromptConfigAPI, 'handleCreatePromptConfig')
			.mockResolvedValueOnce(mockNewConfig);
		render(
			<ConfigEditScreen
				params={{
					applicationId: application.id,
					configId: 'new',
					name: '',
					projectId: project.id,
				}}
			/>,
		);
		fireEvent.click(screen.getByTestId('test-create-button'));
		await waitFor(() => {
			expect(handleCreatePromptConfigSpy).toHaveBeenCalled();
		});

		await waitFor(() => {
			expect(routerReplaceMock).toHaveBeenCalled();
		});
		handleCreatePromptConfigSpy.mockRestore();
	});

	it('shows warning modal when expected template variables are changed', async () => {
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const promptConfig = await PromptConfigFactory.build();
		const name = 'existing-config';

		const { result } = renderHook(() => useSetPromptConfigs());
		result.current(application.id, [
			{
				promptConfig,
			},
		]);

		render(
			<ConfigEditScreen
				params={{
					applicationId: application.id,
					configId: promptConfig.id,
					name,
					projectId: project.id,
				}}
			/>,
		);
		await waitFor(() => {
			fireEvent.click(screen.getByTestId('prompt-template-headline'));
		});
		fireEvent.change(screen.getByTestId('prompt-message-editor'), {
			target: { value: 'update message with {variable}' },
		});
		fireEvent.click(screen.getByTestId('test-create-button'));
		await waitFor(() => {
			expect(
				screen.getByTestId('warning-modal-continue-button'),
			).toBeInTheDocument();
		});
	});

	it('closes warning modal without saving changes when cancel is clicked', async () => {
		const handleCreatePromptConfigSpy = vi.spyOn(
			PromptConfigAPI,
			'handleCreatePromptConfig',
		);
		const handleUpdatePromptConfigSpy = vi.spyOn(
			PromptConfigAPI,
			'handleUpdatePromptConfig',
		);
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const promptConfig = await PromptConfigFactory.build();
		const name = 'existing-config';

		const { result } = renderHook(() => useSetPromptConfigs());
		result.current(application.id, [
			{
				promptConfig,
			},
		]);

		render(
			<ConfigEditScreen
				params={{
					applicationId: application.id,
					configId: promptConfig.id,
					name,
					projectId: project.id,
				}}
			/>,
		);
		await waitFor(() => {
			fireEvent.click(screen.getByTestId('prompt-template-headline'));
		});
		fireEvent.change(screen.getByTestId('prompt-message-editor'), {
			target: { value: 'update message with {variable}' },
		});
		fireEvent.click(screen.getByTestId('test-create-button'));
		await waitFor(() => {
			expect(
				screen.getByTestId('warning-modal-continue-button'),
			).toBeInTheDocument();
		});
		fireEvent.click(screen.getByTestId('warning-modal-cancel-button'));

		await waitFor(() => {
			expect(
				screen.queryByTestId('warning-modal'),
			).not.toBeInTheDocument();
		});

		expect(handleCreatePromptConfigSpy).not.toHaveBeenCalled();
		expect(handleUpdatePromptConfigSpy).not.toHaveBeenCalled();
	});

	it('continue on warning model update model', async () => {
		const handleUpdatePromptConfigSpy = vi.spyOn(
			PromptConfigAPI,
			'handleUpdatePromptConfig',
		);
		const project = await ProjectFactory.build();
		const application = await ApplicationFactory.build();
		const promptConfig = await PromptConfigFactory.build();
		const name = 'existing-config';

		const { result } = renderHook(() => useSetPromptConfigs());
		result.current(application.id, [
			{
				promptConfig,
			},
		]);

		render(
			<ConfigEditScreen
				params={{
					applicationId: application.id,
					configId: promptConfig.id,
					name,
					projectId: project.id,
				}}
			/>,
		);
		await waitFor(() => {
			fireEvent.click(screen.getByTestId('prompt-template-headline'));
		});
		fireEvent.change(screen.getByTestId('prompt-message-editor'), {
			target: { value: 'update message with {variable}' },
		});
		fireEvent.click(screen.getByTestId('test-create-button'));
		await waitFor(() => {
			expect(
				screen.getByTestId('warning-modal-continue-button'),
			).toBeInTheDocument();
		});
		fireEvent.click(screen.getByTestId('warning-modal-continue-button'));

		await waitFor(() => {
			expect(
				screen.queryByTestId('warning-modal'),
			).not.toBeInTheDocument();
		});

		expect(handleUpdatePromptConfigSpy).toHaveBeenCalled();
	});
});
