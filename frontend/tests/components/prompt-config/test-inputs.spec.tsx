import { fireEvent, screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { render, renderHook } from 'tests/test-utils';
import { describe } from 'vitest';

import TestInputs from '@/components/prompt-config/test-inputs';
import { PromptConfigDefault } from '@/constants/forms';

describe('TestInputs component tests', () => {
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('promptTesting'));
	const handleRunTestMock = vi.fn();
	const noValuesTemplateVariables = {
		test0: '',
		test1: '',
		test2: '',
	};
	let config = PromptConfigDefault;
	const setConfig = vi.fn();
	setConfig.mockImplementation((updater) => {
		// Replace the original config with the new state for subsequent assertions
		config = typeof updater === 'function' ? updater(config) : updater;
	});
	it('should render headline', () => {
		const emptyTemplateVariables = {};
		render(
			<TestInputs
				templateVariables={emptyTemplateVariables}
				handleRunTest={handleRunTestMock}
				setConfig={setConfig}
			/>,
		);
		expect(screen.getByTestId('test-inputs-card')).toBeInTheDocument();
	});

	it('should render no variables headline when no variables are passed', () => {
		const emptyTemplateVariables = {};
		render(
			<TestInputs
				templateVariables={emptyTemplateVariables}
				handleRunTest={handleRunTestMock}
				setConfig={setConfig}
			/>,
		);
		expect(screen.getByText(t('noVariablesHeadline'))).toBeInTheDocument();
	});

	it('should render all template variables text fields', () => {
		render(
			<TestInputs
				templateVariables={noValuesTemplateVariables}
				setConfig={setConfig}
				handleRunTest={handleRunTestMock}
			/>,
		);
		Object.keys(noValuesTemplateVariables).forEach((variable) => {
			expect(screen.getByText(variable)).toBeInTheDocument();
			expect(
				screen.getByTestId(`test-textarea-${variable}`),
			).toBeInTheDocument();
		});
	});

	it('should run handleTest when button is clicked', () => {
		render(
			<TestInputs
				templateVariables={noValuesTemplateVariables}
				setConfig={setConfig}
				handleRunTest={handleRunTestMock}
			/>,
		);
		const cta = screen.getByTestId('test-cta-run');
		expect(cta).toBeInTheDocument();
		expect(handleRunTestMock).not.toHaveBeenCalled();
		fireEvent.click(cta);
		expect(handleRunTestMock).toHaveBeenCalled();
	});

	it('should update template variables when text is entered', async () => {
		render(
			<TestInputs
				templateVariables={noValuesTemplateVariables}
				setConfig={setConfig}
				handleRunTest={handleRunTestMock}
			/>,
		);
		for (const variable of Object.keys(noValuesTemplateVariables)) {
			expect(config.templateVariables[variable]).toBeUndefined();
			const textarea = screen.getByTestId(`test-textarea-${variable}`);
			expect(textarea).toBeInTheDocument();
			fireEvent.change(textarea, {
				target: { value: `test ${variable}` },
			});
			expect(setConfig).toHaveBeenCalled();
			expect(config.templateVariables[variable]).toBe(`test ${variable}`);
		}
	});
});
