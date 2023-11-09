import { fireEvent } from '@testing-library/react';
import { APIKeyFactory, ApplicationFactory } from 'tests/factories';
import { nextRouterMock } from 'tests/mocks';
import { render, screen, waitFor } from 'tests/test-utils';
import { beforeEach, expect } from 'vitest';

import * as APIKeysAPI from '@/api/api-keys-api';
import * as ApplicationAPI from '@/api/applications-api';
import { CreateApplication } from '@/components/projects/[projectId]/applications/create-application';
import { ApiError } from '@/errors';
import { ToastType } from '@/stores/toast-store';
import { APIKey } from '@/types';

describe('CreateApplication', () => {
	const projectId = '1';
	const handleCreateApplicationSpy = vi.spyOn(
		ApplicationAPI,
		'handleCreateApplication',
	);
	const handleCreateAPIKeySpy = vi.spyOn(APIKeysAPI, 'handleCreateAPIKey');

	const onClose = vi.fn();
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders create application form', async () => {
		render(<CreateApplication projectId={projectId} onClose={onClose} />);

		const nameInput = screen.getByTestId<HTMLInputElement>(
			'create-application-name-input',
		);
		expect(nameInput).toBeInTheDocument();
		expect(nameInput.value).toBe('');

		const descInput = screen.getByTestId<HTMLInputElement>(
			'create-application-description-input',
		);
		expect(descInput).toBeInTheDocument();
		expect(descInput.value).toBe('');

		const apiKeyInput = screen.getByTestId<HTMLInputElement>(
			'create-application-api-key-input',
		);
		expect(apiKeyInput).toBeInTheDocument();
		expect(apiKeyInput.value).toBe('');
	});

	it.each([
		['Basemind', 'description', 'api key 1', true],
		['Devlingo', '', '', true],
		['Acme Corp', 'We make tools', '', true],
		['Acm', '', '', true],
		['', '', '', false],
		['Ac', '', '', false],
		['Acme', 'd', '', false],
		['Acme', '', 'ia', false],
		['Ac      ', '', '', false],
	])(
		'allows submit only when fields are valid',
		(name, description, apiKey, valid) => {
			render(
				<CreateApplication projectId={projectId} onClose={onClose} />,
			);

			const nameInput = screen.getByTestId<HTMLInputElement>(
				'create-application-name-input',
			);
			fireEvent.change(nameInput, {
				target: { value: name },
			});

			const descInput = screen.getByTestId<HTMLInputElement>(
				'create-application-description-input',
			);
			fireEvent.change(descInput, {
				target: { value: description },
			});

			const apiKeyInput = screen.getByTestId<HTMLInputElement>(
				'create-application-api-key-input',
			);
			fireEvent.change(apiKeyInput, {
				target: { value: apiKey },
			});

			const submitButton = screen.getByTestId<HTMLButtonElement>(
				'create-application-submit-btn',
			);
			if (valid) {
				expect(submitButton).not.toBeDisabled();
			} else {
				expect(submitButton).toBeDisabled();
			}
		},
	);

	it('calls onClose when cancel button is clicked', () => {
		render(<CreateApplication projectId={projectId} onClose={onClose} />);

		const cancelButton = screen.getByTestId<HTMLButtonElement>(
			'create-application-cancel-btn',
		);
		fireEvent.click(cancelButton);

		expect(onClose).toHaveBeenCalledOnce();
	});

	it('creates an application without API key', async () => {
		render(<CreateApplication projectId={projectId} onClose={onClose} />);

		const nameInput = screen.getByTestId<HTMLInputElement>(
			'create-application-name-input',
		);
		fireEvent.change(nameInput, {
			target: { value: 'Acme corp' },
		});

		const application = ApplicationFactory.buildSync();
		handleCreateApplicationSpy.mockResolvedValueOnce(application);

		const submitButton = screen.getByTestId<HTMLButtonElement>(
			'create-application-submit-btn',
		);
		fireEvent.click(submitButton);

		expect(handleCreateApplicationSpy).toHaveBeenCalledWith({
			projectId,
			data: {
				name: 'Acme corp',
				description: '',
			},
		});
		await waitFor(() => {
			expect(nextRouterMock.push).toHaveBeenCalledWith(
				`/projects/${projectId}/applications/${application.id}`,
			);
		});
		expect(onClose).toHaveBeenCalledOnce();
	});

	it('fails to create an application and shows error', async () => {
		render(<CreateApplication projectId={projectId} onClose={onClose} />);

		const nameInput = screen.getByTestId<HTMLInputElement>(
			'create-application-name-input',
		);
		fireEvent.change(nameInput, {
			target: { value: 'Failure' },
		});

		handleCreateApplicationSpy.mockImplementationOnce(() => {
			throw new ApiError('unable to fetch create application', {
				statusCode: 401,
				statusText: 'Bad Request',
			});
		});
		const submitButton = screen.getByTestId<HTMLButtonElement>(
			'create-application-submit-btn',
		);
		fireEvent.click(submitButton);

		const errorToast = screen.getByText(
			'unable to fetch create application',
		);
		expect(errorToast.className).toContain(ToastType.ERROR);
	});

	it('creates an application with an API key and shows API key banner', async () => {
		render(<CreateApplication projectId={projectId} onClose={onClose} />);

		const nameInput = screen.getByTestId<HTMLInputElement>(
			'create-application-name-input',
		);
		fireEvent.change(nameInput, {
			target: { value: 'Acme corp' },
		});

		const apiKeyInput = screen.getByTestId<HTMLInputElement>(
			'create-application-api-key-input',
		);
		fireEvent.change(apiKeyInput, {
			target: { value: 'New API key' },
		});

		const application = ApplicationFactory.buildSync();
		const apiKey = APIKeyFactory.buildSync() as Required<APIKey>;
		handleCreateApplicationSpy.mockResolvedValueOnce(application);
		handleCreateAPIKeySpy.mockResolvedValueOnce(apiKey);

		const submitButton = screen.getByTestId<HTMLButtonElement>(
			'create-application-submit-btn',
		);
		fireEvent.click(submitButton);

		expect(handleCreateApplicationSpy).toHaveBeenCalledWith({
			projectId,
			data: {
				name: 'Acme corp',
				description: '',
			},
		});

		await waitFor(() => {
			expect(handleCreateAPIKeySpy).toHaveBeenCalledWith({
				projectId,
				applicationId: application.id,
				data: {
					name: 'New API key',
				},
			});
		});

		const apiKeyHashInput = screen.getByTestId<HTMLInputElement>(
			'create-api-key-hash-input',
		);
		expect(apiKeyHashInput).toBeInTheDocument();
		expect(apiKeyHashInput.value).toBe(apiKey.hash);

		const closebutton = screen.getByTestId('create-api-key-close-btn');
		fireEvent.click(closebutton);

		expect(nextRouterMock.push).toHaveBeenCalledWith(
			`/projects/${projectId}/applications/${application.id}`,
		);
		expect(onClose).toHaveBeenCalledOnce();
	});
});