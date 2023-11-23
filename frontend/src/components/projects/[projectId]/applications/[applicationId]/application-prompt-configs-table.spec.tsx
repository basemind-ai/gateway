import { faker } from '@faker-js/faker';
import en from 'public/messages/en.json';
import { OpenAIPromptConfigFactory } from 'tests/factories';
import { routerPushMock } from 'tests/mocks';
import { fireEvent, render, screen } from 'tests/test-utils';

import { ApplicationPromptConfigsTable } from '@/components/projects/[projectId]/applications/[applicationId]/application-prompt-configs-table';
import { PromptConfig } from '@/types';

describe('ApplicationPromptConfigsTable', () => {
	const namespace = en.application;

	it('should render a table with the correct headers and data for each prompt configuration', () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const projectId = faker.string.uuid();
		const applicationId = faker.string.uuid();
		const handleEditPromptConfig = vi.fn();
		const handlePromptConfigIdCopy = vi.fn();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
				handleEditPromptConfig={handleEditPromptConfig}
				handlePromptConfigIdCopy={handlePromptConfigIdCopy}
			/>,
		);

		expect(
			screen.getByTestId('application-prompt-configs-table-container'),
		).toBeInTheDocument();
		expect(screen.getByText(namespace.name)).toBeInTheDocument();
		expect(screen.getByText(namespace.type)).toBeInTheDocument();
		expect(screen.getByText(namespace.model)).toBeInTheDocument();
		expect(screen.getByText('ID')).toBeInTheDocument();
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
				'application-prompt-configs-table-config-id-copy-button',
			),
		).toHaveLength(2);
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
		const handleEditPromptConfig = vi.fn();
		const handlePromptConfigIdCopy = vi.fn();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
				handleEditPromptConfig={handleEditPromptConfig}
				handlePromptConfigIdCopy={handlePromptConfigIdCopy}
			/>,
		);

		expect(screen.getByText(promptConfigs[0].name)).toBeInTheDocument();
		expect(
			screen.getAllByTestId(
				'application-prompt-configs-table-config-id-copy-button',
			),
		).toHaveLength(2);
		expect(
			screen.getAllByTestId(
				'application-prompt-configs-table-config-edit-button',
			),
		).toHaveLength(2);
	});

	it('should call the copy prompt config id handler when pressing the edit button', () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const projectId = faker.string.uuid();
		const applicationId = faker.string.uuid();
		const handleEditPromptConfig = vi.fn();
		const handlePromptConfigIdCopy = vi.fn();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
				handleEditPromptConfig={handleEditPromptConfig}
				handlePromptConfigIdCopy={handlePromptConfigIdCopy}
			/>,
		);

		fireEvent.click(
			screen.getAllByTestId(
				'application-prompt-configs-table-config-id-copy-button',
			)[0],
		);

		expect(handlePromptConfigIdCopy).toHaveBeenCalledWith(
			promptConfigs[0].id,
		);
	});

	it('should call the edit prompt config handler when pressing the edit button', () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const projectId = faker.string.uuid();
		const applicationId = faker.string.uuid();
		const handleEditPromptConfig = vi.fn();
		const handlePromptConfigIdCopy = vi.fn();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
				handleEditPromptConfig={handleEditPromptConfig}
				handlePromptConfigIdCopy={handlePromptConfigIdCopy}
			/>,
		);

		fireEvent.click(
			screen.getAllByTestId(
				'application-prompt-configs-table-config-edit-button',
			)[0],
		);

		expect(handleEditPromptConfig).toHaveBeenCalledWith(
			promptConfigs[0].id,
		);
	});

	it('should route to the prompt config detail page when pressing the prompt config name', () => {
		const promptConfigs = OpenAIPromptConfigFactory.batchSync(2);
		const projectId = faker.string.uuid();
		const applicationId = faker.string.uuid();
		const handleEditPromptConfig = vi.fn();
		const handlePromptConfigIdCopy = vi.fn();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
				handleEditPromptConfig={handleEditPromptConfig}
				handlePromptConfigIdCopy={handlePromptConfigIdCopy}
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
		const handleEditPromptConfig = vi.fn();
		const handlePromptConfigIdCopy = vi.fn();

		render(
			<ApplicationPromptConfigsTable
				promptConfigs={promptConfigs}
				projectId={projectId}
				applicationId={applicationId}
				handleEditPromptConfig={handleEditPromptConfig}
				handlePromptConfigIdCopy={handlePromptConfigIdCopy}
			/>,
		);

		expect(
			screen.queryByTestId('application-prompt-configs-table-row'),
		).not.toBeInTheDocument();
	});
});
