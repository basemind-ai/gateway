import { fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { render, renderHook, screen } from 'tests/test-utils';
import { describe, expect } from 'vitest';

import * as ApplicationAPI from '@/api/applications-api';
import { ApplicationDeletion } from '@/app/projects/[projectId]/applications/[applicationId]/page';
import {
	useSetProjectApplications,
	useSetProjects,
} from '@/stores/project-store';

// eslint-disable-next-line vitest/valid-describe-callback
describe('ApplicationDeletion tests', async () => {
	const handleDeleteApplicationSpy = vi.spyOn(
		ApplicationAPI,
		'handleDeleteApplication',
	);

	const {
		result: { current: setProjects },
	} = renderHook(useSetProjects);
	const projects = await ProjectFactory.batch(1);
	setProjects(projects);

	const applications = await ApplicationFactory.batch(1);
	const {
		result: { current: setProjectApplications },
	} = renderHook(useSetProjectApplications);
	setProjectApplications(projects[0].id, applications);

	it('renders application deletion component', () => {
		render(
			<ApplicationDeletion
				projectId={projects[0].id}
				applicationId={applications[0].id}
			/>,
		);

		const rootContainer = screen.getByTestId(
			'application-deletion-container',
		);
		expect(rootContainer).toBeInTheDocument();
	});

	it('renders confirmation banner and deletes application after entering input', async () => {
		render(
			<ApplicationDeletion
				projectId={projects[0].id}
				applicationId={applications[0].id}
			/>,
		);

		const deleteBtn = screen.getByTestId('application-delete-btn');
		fireEvent.click(deleteBtn);

		const deletionBannerTitle = screen.getByTestId(
			'resource-deletion-title',
		);
		expect(deletionBannerTitle).toBeInTheDocument();

		const deletionInput = screen.getByTestId('resource-deletion-input');
		fireEvent.change(deletionInput, {
			target: { value: applications[0].name },
		});
		const deletionBannerDeleteBtn = screen.getByTestId(
			'resource-deletion-delete-btn',
		);
		fireEvent.click(deletionBannerDeleteBtn);

		await waitFor(() => {
			expect(handleDeleteApplicationSpy).toHaveBeenCalledOnce();
		});
	});
});
