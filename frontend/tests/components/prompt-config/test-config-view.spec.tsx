import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from 'tests/test-utils';
import { describe, expect, vi } from 'vitest';

import { TestPromptConfigView } from '@/components/prompt-config/test-prompt-config-view';
import { DefaultOpenAIPromptConfigTest } from '@/constants/forms';

describe('TestConfigView tests', () => {
	// Mock props
	const config = DefaultOpenAIPromptConfigTest;
	const setPromptTestConfig = vi.fn();
	const projectId = 'testProjectId';
	const applicationId = 'testApplicationId';

	beforeEach(() => {
		setPromptTestConfig.mockClear();
	});

	it('should render the TestConfigView component', () => {
		render(
			<TestPromptConfigView
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
				projectId={projectId}
				applicationId={applicationId}
			/>,
		);

		expect(
			screen.getByTestId('test-prompt-config-view-model-headline'),
		).toBeInTheDocument();
	});

	it('should toggle sections correctly', async () => {
		render(
			<TestPromptConfigView
				promptTestConfig={config}
				setPromptTestConfig={setPromptTestConfig}
				projectId={projectId}
				applicationId={applicationId}
			/>,
		);
		expect(
			screen.queryByTestId('prompt-template-card'),
		).not.toBeInTheDocument();
		fireEvent.click(
			screen.getByTestId('test-prompt-config-view-template-headline'),
		);
		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-template-card'),
			).toBeInTheDocument();
		});
		fireEvent.click(
			screen.getByTestId('test-prompt-config-view-model-headline'),
		);
		await waitFor(() => {
			expect(
				screen.queryByTestId('prompt-template-card'),
			).not.toBeInTheDocument();
		});
		expect(screen.getByTestId('model-config-card')).toBeInTheDocument();
	});
});
