import { fireEvent, screen } from '@testing-library/react';
import { render } from 'tests/test-utils';
import { describe, expect } from 'vitest';

import ModelConfiguration from '@/components/prompt-config/model-configuration';
import { PromptConfigDefault } from '@/constants/forms';
import { ModelType } from '@/types';

describe('model configuration tests', () => {
	let config = PromptConfigDefault;
	const setConfig = vi.fn();
	setConfig.mockImplementation((updater) => {
		// Replace the original config with the new state for subsequent assertions
		config = typeof updater === 'function' ? updater(config) : updater;
	});

	it('should render', () => {
		render(<ModelConfiguration config={config} setConfig={setConfig} />);
		expect(screen.getByTestId('model-config-card')).toBeInTheDocument();
	});

	it('picking a model should update the config', () => {
		render(<ModelConfiguration config={config} setConfig={setConfig} />);
		const radio = screen.getByTestId(
			`model-type-select-${ModelType.Gpt3516K}`,
		);
		expect(radio).toBeInTheDocument();
		fireEvent.click(radio);

		expect(setConfig).toHaveBeenCalled();
		expect(config.modelType).toBe(ModelType.Gpt3516K);
	});

	it('slider should update the config', () => {
		render(<ModelConfiguration config={config} setConfig={setConfig} />);
		const slider = screen.getByTestId('temperature-slider');
		expect(slider).toBeInTheDocument();
		fireEvent.change(slider, { target: { value: 0.5 } });
		expect(setConfig).toHaveBeenCalled();
		expect(config.modelParameters.temperature).toBeTypeOf('number');
		expect(config.modelParameters.temperature).toBe(0.5);
	});

	it('should render all parameters sliders', () => {
		render(<ModelConfiguration config={config} setConfig={setConfig} />);
		Object.keys(config.modelParameters).forEach((key) => {
			const slider = screen.getByTestId(`${key}-slider`);
			expect(slider).toBeInTheDocument();
			if (key === 'maxTokens') {
				fireEvent.change(slider, { target: { value: 50 } });
				expect(setConfig).toHaveBeenCalled();
				expect(config.modelParameters[key]).toBeTypeOf('number');
				expect(config.modelParameters[key]).toBe(50);
			} else {
				fireEvent.change(slider, { target: { value: 0.5 } });
				expect(setConfig).toHaveBeenCalled();
				// @ts-expect-error
				expect(config.modelParameters[key]).toBeTypeOf('number');
				// @ts-expect-error
				expect(config.modelParameters[key]).toBe(0.5);
			}
		});
	});
});
