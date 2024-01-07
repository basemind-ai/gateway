import { faker } from '@faker-js/faker';
import { OpenAIPromptConfigFactory } from 'tests/factories';
import { routerPushMock } from 'tests/mocks';
import {
	fireEvent,
	getLocaleNamespace,
	render,
	screen,
} from 'tests/test-utils';

import { ApplicationPromptConfigsTable } from '@/components/projects/[projectId]/applications/[applicationId]/application-prompt-configs-table';
import { PromptConfig } from '@/types';

describe('ApplicationPromptConfigsTable', () => {
	const namespace = getLocaleNamespace('application');

	it('should render a table with the correct headers and data for each prompt configuration', () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const projectId = faker.string.uuid();
		const applicationId = faker.string.uuid();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
			/>,
		);

		expect(
			screen.getByTestId('application-prompt-configs-table-container'),
		).toBeInTheDocument();
		expect(screen.getByText(namespace.name)).toBeInTheDocument();
		expect(screen.getByText(namespace.vendor)).toBeInTheDocument();
		expect(screen.getByText(namespace.model)).toBeInTheDocument();
		expect(screen.getByText(namespace.test)).toBeInTheDocument();
		expect(screen.getByText(namespace.edit)).toBeInTheDocument();
		expect(
			screen.getAllByTestId('application-prompt-configs-table-row'),
		).toHaveLength(2);
		expect(
			screen.getAllByTestId(
				'application-prompt-configs-table-config-name-button',
			),
		).toHaveLength(2);
		expect(screen.getByText(promptConfigs[0].name)).toBeInTheDocument();
		expect(
			screen.getAllByTestId(
				'application-prompt-configs-table-config-edit-button',
			),
		).toHaveLength(2);
	});

	it('should display the name, type, model, ID, test, and edit buttons for each prompt configuration', () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const projectId = faker.string.uuid();
		const applicationId = faker.string.uuid();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
			/>,
		);

		expect(screen.getByText(promptConfigs[0].name)).toBeInTheDocument();
		expect(
			screen.getAllByTestId(
				'application-prompt-configs-table-config-edit-button',
			),
		).toHaveLength(2);
	});

	it('should call the edit prompt config handler when pressing the edit button', () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const projectId = faker.string.uuid();
		const applicationId = faker.string.uuid();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
			/>,
		);

		fireEvent.click(
			screen.getAllByTestId(
				'application-prompt-configs-table-config-edit-button',
			)[0],
		);

		expect(routerPushMock).toHaveBeenCalled();
	});

	it('should route to the prompt config detail page when pressing the prompt config name', () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const projectId = faker.string.uuid();
		const applicationId = faker.string.uuid();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
			/>,
		);

		fireEvent.click(
			screen.getAllByTestId(
				'application-prompt-configs-table-config-name-button',
			)[0],
		);

		expect(routerPushMock).toHaveBeenCalled();
	});

	it('should render an empty table when promptConfigs is an empty array', () => {
		const promptConfigs = [] as PromptConfig<any>[];
		const projectId = faker.string.uuid();
		const applicationId = faker.string.uuid();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
			/>,
		);

		expect(
			screen.queryByTestId('application-prompt-configs-table-row'),
		).not.toBeInTheDocument();
	});

	it('should navigate to the prompt config detail page testing tab when pressing the test button', () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const projectId = faker.string.uuid();
		const applicationId = faker.string.uuid();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
			/>,
		);

		fireEvent.click(
			screen.getAllByTestId(
				'application-prompt-configs-table-config-test-button',
			)[0],
		);

		expect(routerPushMock).toHaveBeenCalled();
	});
});
