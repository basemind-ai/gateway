import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ProjectFactory } from 'tests/factories';
import { render, renderHook, screen } from 'tests/test-utils';

import * as ProjectAPI from '@/api/projects-api';
import { ProjectDeletion } from '@/components/projects/[projectId]/project-deletion';
import { useSetProjects } from '@/stores/project-store';

describe('ProjectDeletion', () => {
	const handleDeleteProjectSpy = vi.spyOn(ProjectAPI, 'handleDeleteProject');
	const project = ProjectFactory.buildSync();
	const projectId = project.id;

	beforeAll(() => {
		HTMLDialogElement.prototype.showModal = vi.fn();
		HTMLDialogElement.prototype.close = vi.fn();
	});

	it('renders project deletion', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		setProjects([project]);

		render(<ProjectDeletion projectId={projectId} />);

		const deleteButton = screen.getByTestId('project-delete-btn');
		expect(deleteButton).toBeInTheDocument();
	});

	it('renders confirmation banner and deletes project after entering input', async () => {
		const {
			result: { current: setProjects },
		} = renderHook(useSetProjects);
		setProjects([project]);

		render(<ProjectDeletion projectId={projectId} />);

		const deleteButton = screen.getByTestId('project-delete-btn');
		fireEvent.click(deleteButton);

		const deletionBannerTitle = screen.getByTestId(
			'resource-deletion-title',
		);
		expect(deletionBannerTitle).toBeInTheDocument();

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: project.name },
		});
		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);

		await waitFor(() => {
			expect(handleDeleteProjectSpy).toHaveBeenCalledOnce();
		});
	});
});
