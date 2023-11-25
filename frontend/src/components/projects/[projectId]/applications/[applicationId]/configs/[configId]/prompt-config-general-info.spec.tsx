import dayjs from 'dayjs';
import { ApplicationFactory, OpenAIPromptConfigFactory } from 'tests/factories';
import { render, renderHook, screen } from 'tests/test-utils';
import { expect } from 'vitest';

import { PromptConfigGeneralInfo } from '@/components/projects/[projectId]/applications/[applicationId]/configs/[configId]/prompt-config-general-info';
import {
	modelTypeToLocaleMap,
	modelVendorToLocaleMap,
} from '@/constants/models';
import {
	useSetProjectApplications,
	useSetPromptConfigs,
} from '@/stores/api-store';

describe('PromptGeneralInfo', () => {
	const projectId = '1';
	const application = ApplicationFactory.buildSync();

	const {
		result: { current: setProjectApplications },
	} = renderHook(useSetProjectApplications);
	setProjectApplications(projectId, [application]);

	const promptConfig = OpenAIPromptConfigFactory.buildSync();
	const {
		result: { current: setPromptConfigs },
	} = renderHook(useSetPromptConfigs);
	setPromptConfigs(application.id, [promptConfig]);

	it('renders prompt settings', () => {
		render(<PromptConfigGeneralInfo promptConfig={promptConfig} />);

		const vendor = screen.getByTestId('prompt-general-info-model-vendor');
		expect(vendor.innerHTML).toBe(
			modelVendorToLocaleMap[promptConfig.modelVendor],
		);

		const modelType = screen.getByTestId('prompt-general-info-model-type');
		expect(modelType.innerHTML).toBe(
			modelTypeToLocaleMap[promptConfig.modelType],
		);

		const id = screen.getByTestId('prompt-general-info-id');
		expect(id.innerHTML).toBe(promptConfig.id);

		const isDefault = screen.getByTestId('prompt-general-info-is-default');
		expect(isDefault.innerHTML).toBe(promptConfig.isDefault?.toString());

		const createdAt = screen.getByTestId('prompt-general-info-created-at');
		expect(createdAt.innerHTML).toBe(
			dayjs(promptConfig.createdAt).format('YYYY-MM-DD'),
		);

		const updatedAt = screen.getByTestId('prompt-general-info-updated-at');
		expect(updatedAt.innerHTML).toBe(
			dayjs(promptConfig.updatedAt).format('YYYY-MM-DD'),
		);
	});

	it('returns null when promptConfig is undefined', () => {
		render(<PromptConfigGeneralInfo promptConfig={undefined} />);

		const settingsContainer = screen.queryByTestId(
			'prompt-general-info-container',
		);
		expect(settingsContainer).not.toBeInTheDocument();
	});
});
