import { faker } from '@faker-js/faker';
import { fireEvent, waitFor } from '@testing-library/react';
import en from 'public/messages/en.json';
import { ApplicationFactory, OpenAIPromptConfigFactory } from 'tests/factories';
import { routerPushMock } from 'tests/mocks';
import { render, screen } from 'tests/test-utils';
import { expect } from 'vitest';

import { ProjectApplicationsListTable } from '@/components/projects/[projectId]/project-applications-list-table';
import { PromptConfig } from '@/types';

describe('ProjectApplicationsListTable', () => {
	const namespace = en.projectOverview;

	it('should render a table with correct headers and data', () => {
		const applications = ApplicationFactory.batchSync(3);
		const projectId = faker.string.uuid();
		const promptConfigs = applications.reduce<
			Record<string, PromptConfig<any>[] | undefined>
		>((acc, cur, i) => {
			acc[cur.id] = OpenAIPromptConfigFactory.batchSync(i + 1);
			return acc;
		}, {});

		render(
			<ProjectApplicationsListTable
				applications={applications}
				projectId={projectId}
				promptConfigs={promptConfigs}
			/>,
		);

		expect(screen.getByText(namespace.name)).toBeInTheDocument();
		expect(screen.getByText(namespace.configs)).toBeInTheDocument();
		expect(screen.getByText(namespace.edit)).toBeInTheDocument();

		expect(screen.getByText(applications[0].name)).toBeInTheDocument();
		expect(screen.getByText(applications[1].name)).toBeInTheDocument();
		expect(screen.getByText(applications[2].name)).toBeInTheDocument();

		expect(
			screen.getByTestId(
				`application-prompt-config-count-${applications[0].id}`,
			).textContent,
		).toBe('1');
		expect(
			screen.getByTestId(
				`application-prompt-config-count-${applications[1].id}`,
			).textContent,
		).toBe('2');
		expect(
			screen.getByTestId(
				`application-prompt-config-count-${applications[2].id}`,
			).textContent,
		).toBe('3');
	});

	it('should generate a link for each application', async () => {
		const applications = ApplicationFactory.batchSync(3);
		const projectId = faker.string.uuid();
		const promptConfigs = applications.reduce<
			Record<string, PromptConfig<any>[] | undefined>
		>((acc, cur, i) => {
			acc[cur.id] = OpenAIPromptConfigFactory.batchSync(i + 1);
			return acc;
		}, {});

		render(
			<ProjectApplicationsListTable
				applications={applications}
				projectId={projectId}
				promptConfigs={promptConfigs}
			/>,
		);

		const linkButtons: HTMLButtonElement[] = screen.getAllByTestId(
			'project-application-list-name-button',
		);
		expect(linkButtons).toHaveLength(applications.length);
		for (const [i, linkButton] of linkButtons.entries()) {
			fireEvent.click(linkButton);
			await waitFor(() => {
				expect(routerPushMock).toHaveBeenCalledTimes(i + 1);
			});
		}
	});

	it('should handle an empty applications prop', () => {
		const projectId = faker.string.uuid();
		const promptConfigs: Record<string, PromptConfig<any>[] | undefined> =
			{};

		render(
			<ProjectApplicationsListTable
				applications={[]}
				projectId={projectId}
				promptConfigs={promptConfigs}
			/>,
		);

		expect(
			screen.queryByTestId('project-application-list-name-button'),
		).not.toBeInTheDocument();
	});

	it('should handle missing prompt config for an application', () => {
		const applications = ApplicationFactory.batchSync(3);
		const projectId = faker.string.uuid();
		const promptConfigs = applications.reduce<
			Record<string, PromptConfig<any>[] | undefined>
		>((acc, cur, i) => {
			acc[cur.id] =
				i === 1
					? undefined
					: OpenAIPromptConfigFactory.batchSync(i + 1);
			return acc;
		}, {});

		render(
			<ProjectApplicationsListTable
				applications={applications}
				projectId={projectId}
				promptConfigs={promptConfigs}
			/>,
		);

		expect(
			screen.getByTestId(
				`application-prompt-config-count-${applications[0].id}`,
			).textContent,
		).toBe('1');
		expect(
			screen.getByTestId(
				`application-prompt-config-count-${applications[1].id}`,
			).textContent,
		).toBe('0');
		expect(
			screen.getByTestId(
				`application-prompt-config-count-${applications[2].id}`,
			).textContent,
		).toBe('3');
	});
});
