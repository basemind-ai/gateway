import { OpenAIPromptMessage, OpenAIPromptMessageRole } from '@/types';
import {
	extractTemplateVariables,
	updateTemplateVariablesRecord,
} from '@/utils/models';

describe('model utils tests', () => {
	describe('extractTemplateVariables', () => {
		it('should extract a single variable from the content', () => {
			const result = extractTemplateVariables('Hello {user}!');
			expect(result).toEqual(['user']);
		});

		it('should extract multiple variables from the content', () => {
			const result = extractTemplateVariables(
				'Hello {user}, your order {order_id} is ready.',
			);
			expect(result).toEqual(['user', 'order_id']);
		});

		it('should return an empty array when no variables are present', () => {
			const result = extractTemplateVariables('Hello there!');
			expect(result).toEqual([]);
		});

		it('should handle content with only curly braces', () => {
			const result = extractTemplateVariables('Hello {}!');
			expect(result).toEqual([]);
		});

		it('should handle special characters inside the braces', () => {
			const result = extractTemplateVariables(
				'Your balance is {amount$} dollars.',
			);
			expect(result).toEqual(['amount$']);
		});

		it('should handle variables next to each other without spaces', () => {
			const result = extractTemplateVariables('Hello {user}{emoji}');
			expect(result).toEqual(['user', 'emoji']);
		});

		it('should handle an empty string without throwing an error', () => {
			const result = extractTemplateVariables('');
			expect(result).toEqual([]);
		});
	});

	describe('updateTemplateVariablesRecord tests', () => {
		it('should update template variables record correctly', () => {
			const messages: OpenAIPromptMessage[] = [
				{
					content: 'Hello {user}, your order {order_id} is ready.',
					role: OpenAIPromptMessageRole.User,
				},
				{
					content: 'Hello {user}, your balance is {balance}.',
					role: OpenAIPromptMessageRole.System,
				},
			];

			const existingVars: Record<string, string> = {
				old_var: 'should be removed',
				order_id: '123456',
				user: 'John Doe', // This should be removed since it's not in messages
			};

			const updatedRecord = updateTemplateVariablesRecord(
				messages,
				existingVars,
			);

			expect(updatedRecord).toEqual({
				balance: '',
				order_id: '123456',
				user: 'John Doe', // This is new or undefined in existingVars, so it gets initialized
			});
			expect(updatedRecord).not.toHaveProperty('old_var'); // old_var should be removed
		});

		it('should not remove existing variables with values', () => {
			const messages: OpenAIPromptMessage[] = [
				{
					content: 'Hello {user}!',
					role: OpenAIPromptMessageRole.User,
				},
			];

			const existingVars: Record<string, string> = {
				user: 'existing value',
			};

			const updatedRecord = updateTemplateVariablesRecord(
				messages,
				existingVars,
			);

			expect(updatedRecord).toEqual({
				user: 'existing value',
			});
		});

		it('should handle an empty array of messages without errors', () => {
			const messages: OpenAIPromptMessage[] = [];
			const existingVars: Record<string, string> = {
				some_var: 'some value',
			};

			const updatedRecord = updateTemplateVariablesRecord(
				messages,
				existingVars,
			);

			expect(updatedRecord).toEqual({});
		});

		it('should handle messages without variables', () => {
			const messages: OpenAIPromptMessage[] = [
				{
					content: 'Just a plain message.',
					role: OpenAIPromptMessageRole.User,
				},
			];
			const existingVars: Record<string, string> = {
				plain_var: 'some value',
			};

			const updatedRecord = updateTemplateVariablesRecord(
				messages,
				existingVars,
			);

			expect(updatedRecord).toEqual({});
		});
	});
});
