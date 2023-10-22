import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { TokenFactory } from 'tests/factories';
import { render, screen } from 'tests/test-utils';
import { describe, expect } from 'vitest';

import * as TokenAPI from '@/api/tokens-api';
import { ApiKeys } from '@/app/projects/[projectId]/application/[applicationId]/page';

describe('ApiKeys tests', () => {
	const handleRetrieveTokensSpy = vi.spyOn(TokenAPI, 'handleRetrieveTokens');
	const handleCreateTokenSpy = vi.spyOn(TokenAPI, 'handleCreateToken');
	const projectId = '1';
	const applicationId = '1';

	it('renders api keys component', async () => {
		const tokens = await TokenFactory.batch(2);
		handleRetrieveTokensSpy.mockResolvedValueOnce(tokens);
		render(<ApiKeys projectId={projectId} applicationId={applicationId} />);

		await waitFor(() => {
			const tokenRows = screen.getAllByTestId('api-token-row');
			expect(tokenRows).toHaveLength(2);
		});

		const tokenNameRows = screen.getAllByTestId('api-token-name');
		expect(tokenNameRows[0].innerHTML).toBe(tokens[0].name);
	});

	it('deletes a token', async () => {
		const tokens = await TokenFactory.batch(2);
		handleRetrieveTokensSpy.mockResolvedValueOnce(tokens);
		render(<ApiKeys projectId={projectId} applicationId={applicationId} />);

		await waitFor(() => {
			const tokenRows = screen.getAllByTestId('api-token-row');
			expect(tokenRows).toHaveLength(2);
		});

		const [tokenDeleteBtn] = screen.getAllByTestId('api-token-delete-btn');
		fireEvent.click(tokenDeleteBtn);

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: tokens[0].name },
		});
		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		handleRetrieveTokensSpy.mockResolvedValueOnce([tokens[1]]);
		fireEvent.click(deletionBannerDeleteBtn);

		await waitFor(() => {
			const tokenRows = screen.getAllByTestId('api-token-row');
			expect(tokenRows).toHaveLength(1);
		});
	});

	it('creates a token', async () => {
		const tokens = await TokenFactory.batch(2);
		handleRetrieveTokensSpy.mockResolvedValueOnce(tokens);
		render(<ApiKeys projectId={projectId} applicationId={applicationId} />);

		await waitFor(() => {
			const tokenRows = screen.getAllByTestId('api-token-row');
			expect(tokenRows).toHaveLength(2);
		});

		const tokenCreateBtn = screen.getByTestId('api-token-create-btn');
		fireEvent.click(tokenCreateBtn);

		const tokenNameInput = screen.getByTestId('create-token-input');
		fireEvent.change(tokenNameInput, {
			target: { value: 'New token' },
		});

		const submitBtn = screen.getByTestId('create-token-submit-btn');
		const token = { ...(await TokenFactory.build()), hash: 'randomHash' };
		tokens.push(token);
		handleCreateTokenSpy.mockResolvedValueOnce(token);
		fireEvent.click(submitBtn);

		await waitFor(() => {
			const hashInput = screen.getByTestId('create-token-hash-input');
			expect(hashInput).toBeInTheDocument();
		});

		handleRetrieveTokensSpy.mockResolvedValueOnce([...tokens]);
		const closeBtn = screen.getByTestId('create-token-close-btn');
		fireEvent.click(closeBtn);

		await waitFor(() => {
			const newToken = screen.getByText(token.name);
			expect(newToken).toBeInTheDocument();
		});
	});
});
