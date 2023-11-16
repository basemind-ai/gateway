import { fireEvent, screen, waitFor } from '@testing-library/react';
import { render } from 'tests/test-utils';
import { describe, expect, vi } from 'vitest';

import TestConfigView from '@/components/prompt-config/test-config-view';
import { DefaultPromptConfigTest } from '@/constants/forms';

describe('TestConfigView tests', () => {
	// Mock props
	const config = DefaultPromptConfigTest;
	const setConfig = vi.fn();
	const projectId = 'testProjectId';
	const applicationId = 'testApplicationId';

	beforeEach(() => {
		setConfig.mockClear();
	});

	it('should render the TestConfigView component', () => {
		render(
			<TestConfigView
				config={config}
				setConfig={setConfig}
				projectId={projectId}
				applicationId={applicationId}
			/>,
		);

		expect(screen.getByTestId('model-config-headline')).toBeInTheDocument();
	});

	it('should toggle sections correctly', async () => {
		render(
			<TestConfigView
				config={config}
				setConfig={setConfig}
				projectId={projectId}
				applicationId={applicationId}
			/>,
		);
		expect(
			screen.queryByTestId('prompt-template-card'),
		).not.toBeInTheDocument();
		fireEvent.click(screen.getByTestId('prompt-template-headline'));
		await waitFor(() => {
			expect(
				screen.getByTestId('prompt-template-card'),
			).toBeInTheDocument();
		});
		fireEvent.click(screen.getByTestId('model-config-headline'));
		await waitFor(() => {
			expect(
				screen.queryByTestId('prompt-template-card'),
			).not.toBeInTheDocument();
		});
		expect(screen.getByTestId('model-config-card')).toBeInTheDocument();
	});
});
