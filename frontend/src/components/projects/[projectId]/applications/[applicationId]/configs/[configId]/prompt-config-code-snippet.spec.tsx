import { ApplicationFactory, ProjectFactory } from 'tests/factories';
import { routerPushMock } from 'tests/mocks';
import { fireEvent, render, screen } from 'tests/test-utils';

import { PromptConfigCodeSnippet } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-code-snippet';

const writeTextMock = vi.fn();

// @ts-expect-error
navigator.clipboard = { writeText: writeTextMock };

describe('PromptConfigCodeSnippet', () => {
	const project = ProjectFactory.buildSync();
	const application = ApplicationFactory.buildSync();
	it('should render the component with the default framework selected', () => {
		render(
			<PromptConfigCodeSnippet
				projectId={project.id}
				applicationId={application.id}
			/>,
		);
		const defaultFrameworkTab = screen.getByTestId('tab-Android');

		expect(defaultFrameworkTab).toBeInTheDocument();
		expect(defaultFrameworkTab).toHaveClass('tab-active');
	});

	it('should display the code snippet for the selected framework', () => {
		render(
			<PromptConfigCodeSnippet
				projectId={project.id}
				applicationId={application.id}
			/>,
		);
		const kotlinCodeSnippet = screen.getByTestId('code-snippet-kotlin');

		expect(kotlinCodeSnippet).toBeInTheDocument();
	});

	it('should disable and not allow selection of a tab when its framework is not active', () => {
		render(
			<PromptConfigCodeSnippet
				projectId={project.id}
				applicationId={application.id}
			/>,
		);
		const flutterTab = screen.getByTestId('tab-Flutter');

		expect(flutterTab).toBeDisabled();
	});

	it('should not display the code snippet when the language is not supported', () => {
		render(
			<PromptConfigCodeSnippet
				projectId={project.id}
				applicationId={application.id}
			/>,
		);
		const reactNativeCodeSnippet = screen.queryByTestId(
			'code-snippet-react-native',
		);

		expect(reactNativeCodeSnippet).not.toBeInTheDocument();
	});

	it('should copy the code snippet to the clipboard when the user clicks the copy button', async () => {
		render(
			<PromptConfigCodeSnippet
				projectId={project.id}
				applicationId={application.id}
			/>,
		);
		const copyButtonKotlin = screen.getByTestId(
			'code-snippet-code-copy-button-kotlin',
		);
		fireEvent.click(copyButtonKotlin);
		expect(writeTextMock).toHaveBeenCalledWith(expect.any(String));
		const copyButtonSwift = screen.getByTestId(
			'code-snippet-code-copy-button-swift',
		);
		fireEvent.click(copyButtonSwift);
		expect(writeTextMock).toHaveBeenCalledWith(expect.any(String));
	});

	it('should route to the docs page when the user clicks the view docs button in android', () => {
		render(
			<PromptConfigCodeSnippet
				projectId={project.id}
				applicationId={application.id}
			/>,
		);
		const viewDocsButtonKotlin = screen.getByTestId(
			'code-snippet-view-docs-button-kotlin',
		);
		fireEvent.click(viewDocsButtonKotlin);
		expect(routerPushMock).toHaveBeenCalled();
	});

	it('should route to the docs page when the user clicks the view docs button in swift', () => {
		render(
			<PromptConfigCodeSnippet
				projectId={project.id}
				applicationId={application.id}
			/>,
		);
		const viewDocsButtonSwift = screen.getByTestId(
			'code-snippet-view-docs-button-swift',
		);
		fireEvent.click(viewDocsButtonSwift);
		expect(routerPushMock).toHaveBeenCalled();
	});

	it('should open create API key model when the user clicks the create API key button', async () => {
		render(
			<PromptConfigCodeSnippet
				projectId={project.id}
				applicationId={application.id}
			/>,
		);
		const createAPIKeyButton = screen.getByTestId(
			'code-snippet-create-api-key-button-kotlin',
		);
		fireEvent.click(createAPIKeyButton);
		expect(
			screen.getByTestId('create-api-key-modal-container'),
		).toBeInTheDocument();
	});
});
