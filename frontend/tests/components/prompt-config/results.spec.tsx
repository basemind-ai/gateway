import { fireEvent, screen } from '@testing-library/react';
import { render } from 'tests/test-utils';
import { afterEach, describe, expect } from 'vitest';

import { Results } from '@/components/prompt-config/results';
import { DefaultOpenAIPromptConfigTest } from '@/constants/forms';

describe('PromptTemplate tests', () => {
	const handleRunTest = vi.fn();

	afterEach(() => {
		handleRunTest.mockReset();
	});

	it('should render', () => {
		render(
			<Results
				handleRunTest={handleRunTest}
				result={[]}
				testConfig={null}
			/>,
		);
		expect(screen.getByTestId('results-card')).toBeInTheDocument();
	});

	it('clicking on run test should call handleRunTest', () => {
		render(
			<Results
				handleRunTest={handleRunTest}
				result={[]}
				testConfig={null}
			/>,
		);
		const button = screen.getByTestId('result-run-test');
		fireEvent.click(button);
		expect(handleRunTest).toHaveBeenCalledTimes(1);
	});

	it('should render results card when testConfig is not null', async () => {
		let testConfig = null;
		render(
			<Results
				handleRunTest={handleRunTest}
				result={[]}
				testConfig={testConfig}
			/>,
		);
		expect(screen.queryByTestId('post-run-card')).not.toBeInTheDocument();
		testConfig = DefaultOpenAIPromptConfigTest;
		render(
			<Results
				handleRunTest={handleRunTest}
				result={[]}
				testConfig={testConfig}
			/>,
		);
		expect(screen.getByTestId('post-run-card')).toBeInTheDocument();
	});

	it('clicking on button-repeat-test should call another test', () => {
		render(
			<Results
				handleRunTest={handleRunTest}
				result={[]}
				testConfig={DefaultOpenAIPromptConfigTest}
			/>,
		);
		fireEvent.click(screen.getByTestId('button-repeat-test'));
		expect(handleRunTest).toHaveBeenCalledTimes(1);
	});
});
