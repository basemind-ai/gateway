import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { TokenFactory } from 'tests/factories';
import { render, screen } from 'tests/test-utils';
import { beforeEach, describe, expect } from 'vitest';

import * as TokenAPI from '@/api/tokens-api';
import { CreateApiKey } from '@/app/projects/[projectId]/applications/[applicationId]/page';

describe('CreateApiKey tests', () => {
	const handleCreateTokenSpy = vi.spyOn(TokenAPI, 'handleCreateToken');
	const projectId = '1';
	const applicationId = '1';
	const onSubmit = vi.fn();
	const onCancel = vi.fn();

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it('renders create api keys component', () => {
		render(
			<CreateApiKey
				projectId={projectId}
				applicationId={applicationId}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		const title = screen.getByTestId('create-token-title');
		expect(title).toBeInTheDocument();

		const nameInput = screen.getByTestId('create-token-input');
		expect(nameInput).toBeInTheDocument();
	});

	it('enabled submit only on valid token name', () => {
		render(
			<CreateApiKey
				projectId={projectId}
				applicationId={applicationId}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		const submitButton = screen.getByTestId<HTMLButtonElement>(
			'create-token-submit-btn',
		);
		expect(submitButton.disabled).toBe(true);

		const tokenNameInput = screen.getByTestId('create-token-input');
		// Invalid name
		fireEvent.change(tokenNameInput, {
			target: { value: 'i' },
		});
		expect(submitButton.disabled).toBe(true);

		// valid name
		fireEvent.change(tokenNameInput, {
			target: { value: 'New Token' },
		});
		expect(submitButton.disabled).toBe(false);
	});

	it('calls cancel callback when cancel is clicked', () => {
		render(
			<CreateApiKey
				projectId={projectId}
				applicationId={applicationId}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		const closeButton = screen.getByTestId<HTMLButtonElement>(
			'create-token-close-btn',
		);
		fireEvent.click(closeButton);
		expect(onCancel).toHaveBeenCalledOnce();
	});

	it('creates a token and calls on submit call when closed', async () => {
		render(
			<CreateApiKey
				projectId={projectId}
				applicationId={applicationId}
				onSubmit={onSubmit}
				onCancel={onCancel}
			/>,
		);

		const tokenNameInput = screen.getByTestId('create-token-input');
		fireEvent.change(tokenNameInput, {
			target: { value: 'New Token' },
		});

		const token = { ...(await TokenFactory.build()), hash: 'randomHash' };
		handleCreateTokenSpy.mockResolvedValueOnce(token);

		const submitButton = screen.getByTestId<HTMLButtonElement>(
			'create-token-submit-btn',
		);
		fireEvent.click(submitButton);

		await waitFor(() => {
			const hashInput = screen.getByTestId('create-token-hash-input');
			expect(hashInput).toBeInTheDocument();
		});

		const closeBtn = screen.getByTestId('create-token-close-btn');
		fireEvent.click(closeBtn);
		expect(onSubmit).toHaveBeenCalledOnce();
	});
});
