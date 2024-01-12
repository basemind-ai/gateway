import { StreamFinishReason } from 'shared/constants';
import { PromptTestRecordFactory } from 'tests/factories';
import { render, screen } from 'tests/test-utils';

import { PromptTestResultTable } from '@/components/prompt-display-components/prompt-test-result-table';
import {
	modelTypeToLocaleMap,
	modelVendorToLocaleMap,
} from '@/constants/models';
import { ModelVendor, OpenAIModelType } from '@/types';

describe('PromptTestResultTable', () => {
	it('should render a table with the test results', () => {
		const modelVendor = ModelVendor.OpenAI;
		const modelType = OpenAIModelType.Gpt35Turbo;
		const testFinishReason = StreamFinishReason.DONE;
		const testRecord = PromptTestRecordFactory.buildSync({
			durationMs: 1000,
			requestTokens: 10,
			requestTokensCost: 5,
			responseTokens: 20,
			responseTokensCost: 100,
		});

		render(
			<PromptTestResultTable
				modelVendor={modelVendor}
				modelType={modelType}
				testFinishReason={testFinishReason}
				testRecord={testRecord}
			/>,
		);

		expect(
			screen.getByTestId('prompt-test-result-table'),
		).toBeInTheDocument();
		expect(
			screen.getByText(modelVendorToLocaleMap[modelVendor]),
		).toBeInTheDocument();
		expect(
			screen.getByText(modelTypeToLocaleMap[modelType]),
		).toBeInTheDocument();
		expect(screen.getByText(testFinishReason)).toBeInTheDocument();
		expect(screen.getByText('1000 MS')).toBeInTheDocument();
		expect(screen.getByText('10')).toBeInTheDocument();
		expect(screen.getByText('5')).toBeInTheDocument();
		expect(screen.getByText('20')).toBeInTheDocument();
		expect(screen.getByText('100')).toBeInTheDocument();
	});

	it('should display the vendor and type of the model being tested', () => {
		const modelVendor = ModelVendor.OpenAI;
		const modelType = OpenAIModelType.Gpt35Turbo;
		const testFinishReason = StreamFinishReason.DONE;
		const testRecord = PromptTestRecordFactory.buildSync({
			durationMs: 1000,
			requestTokens: 10,
			requestTokensCost: 5,
			responseTokens: 20,
			responseTokensCost: 10,
		});

		render(
			<PromptTestResultTable
				modelVendor={modelVendor}
				modelType={modelType}
				testFinishReason={testFinishReason}
				testRecord={testRecord}
			/>,
		);

		expect(
			screen.getByText(modelVendorToLocaleMap[modelVendor]),
		).toBeInTheDocument();
		expect(
			screen.getByText(modelTypeToLocaleMap[modelType]),
		).toBeInTheDocument();
	});

	it('should display the finish reason of the test or "N/A"', () => {
		const modelVendor = ModelVendor.OpenAI;
		const modelType = OpenAIModelType.Gpt35Turbo;
		const testFinishReason = StreamFinishReason.DONE;
		const testRecord = PromptTestRecordFactory.buildSync();

		render(
			<PromptTestResultTable
				modelVendor={modelVendor}
				modelType={modelType}
				testFinishReason={testFinishReason}
				testRecord={testRecord}
			/>,
		);

		expect(screen.getByText(testFinishReason)).toBeInTheDocument();
	});

	it('should display "N/A" for all fields when testRecord is null', () => {
		const modelVendor = ModelVendor.OpenAI;
		const modelType = OpenAIModelType.Gpt35Turbo;
		const testRecord = null;

		render(
			<PromptTestResultTable
				modelVendor={modelVendor}
				modelType={modelType}
				testFinishReason={undefined}
				testRecord={testRecord}
			/>,
		);

		expect(screen.getByText('N/A')).toBeInTheDocument();
	});

	it('should display "N/A" for the finish reason field when testFinishReason is undefined', () => {
		const modelVendor = ModelVendor.OpenAI;
		const modelType = OpenAIModelType.Gpt35Turbo;
		const testFinishReason = undefined;
		const testRecord = PromptTestRecordFactory.buildSync({
			durationMs: 1000,
			requestTokens: 10,
			requestTokensCost: 5,
			responseTokens: 20,
			responseTokensCost: 10,
		});

		render(
			<PromptTestResultTable
				modelVendor={modelVendor}
				modelType={modelType}
				testFinishReason={testFinishReason}
				testRecord={testRecord}
			/>,
		);

		expect(screen.getByText('N/A')).toBeInTheDocument();
	});

	it('should display the duration of the test in milliseconds', () => {
		const modelVendor = ModelVendor.OpenAI;
		const modelType = OpenAIModelType.Gpt35Turbo;
		const testFinishReason = StreamFinishReason.DONE;
		const testRecord = PromptTestRecordFactory.buildSync({
			durationMs: 1000,
			requestTokens: 10,
			requestTokensCost: 5,
			responseTokens: 20,
			responseTokensCost: 10,
		});

		render(
			<PromptTestResultTable
				modelVendor={modelVendor}
				modelType={modelType}
				testFinishReason={testFinishReason}
				testRecord={testRecord}
			/>,
		);

		expect(screen.getByText('1000 MS')).toBeInTheDocument();
	});
});
