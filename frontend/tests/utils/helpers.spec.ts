import { OpenAIPromptMessage } from '@/types';
import {
	areArraysEqual,
	copyToClipboard,
	decodeUrlSpaces,
	extractVariables,
	getCloneName,
	handleChange,
	updateTemplateVariablesRecord,
} from '@/utils/helpers';

describe('handleChange tests', () => {
	it('return an event handler', () => {
		const eventHandler = handleChange(vi.fn());
		expect(typeof eventHandler).toBe('function');
	});

	it('calls the callback with the correct value', () => {
		const mockCallback = vi.fn();
		const event = { preventDefault: vi.fn(), target: { value: 'test' } };
		const eventHandler = handleChange(mockCallback);
		eventHandler(event as any);
		expect(mockCallback).toHaveBeenCalledWith('test');
	});

	it('prevents the default behaviour from bubbling.', () => {
		const mockCallback = vi.fn();
		const event = { preventDefault: vi.fn(), target: { value: 'test' } };
		const eventHandler = handleChange(mockCallback);
		eventHandler(event as any);
		expect(event.preventDefault).toHaveBeenCalled();
	});
	it('stops propagation of event if specified.', () => {
		const mockCallback = vi.fn();
		const event = {
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
			target: { value: 'test' },
		};
		const eventHandler = handleChange(mockCallback, true);
		eventHandler(event as any);
		expect(event.stopPropagation).toHaveBeenCalled();
		expect(event.preventDefault).toHaveBeenCalled();
	});
});

describe('copyToClipboard tests', () => {
	const writeText = vi.fn();
	Object.assign(navigator, {
		clipboard: {
			writeText,
		},
	});

	it('copies text to clipboard', () => {
		const text = '123';
		copyToClipboard(text);
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
	});
});

describe('geCloneName tests', () => {
	it('gets a clone name from a source name', () => {
		const sourceName = 'basemind';
		const cloneName = getCloneName(sourceName);

		expect(cloneName).toContain(sourceName);
	});

	it('gets fairly unique clone names from source name', () => {
		// This means that we're okay if the cloned names are unique 95% of the time
		// In reality chances of collision are very very low
		const sourceName = 'basemind';
		const cloneCount = 1000;
		const passPercentage = 95;
		const passCloneCount = cloneCount * (passPercentage / 100);

		const cloneNames = [...Array.from({ length: cloneCount }).keys()].map(
			(_) => getCloneName(sourceName),
		);

		const cloneNameSet = new Set(cloneNames);

		expect(cloneNameSet.size).toBeGreaterThan(passCloneCount);
	});
});

describe('extractVariables', () => {
	it('should extract a single variable from the content', () => {
		const result = extractVariables('Hello {user}!');
		expect(result).toEqual(['user']);
	});

	it('should extract multiple variables from the content', () => {
		const result = extractVariables(
			'Hello {user}, your order {order_id} is ready.',
		);
		expect(result).toEqual(['user', 'order_id']);
	});

	it('should return an empty array when no variables are present', () => {
		const result = extractVariables('Hello there!');
		expect(result).toEqual([]);
	});

	it('should handle content with only curly braces', () => {
		const result = extractVariables('Hello {}!');
		expect(result).toEqual([]);
	});

	it('should handle special characters inside the braces', () => {
		const result = extractVariables('Your balance is {amount$} dollars.');
		expect(result).toEqual(['amount$']);
	});

	it('should handle variables next to each other without spaces', () => {
		const result = extractVariables('Hello {user}{emoji}');
		expect(result).toEqual(['user', 'emoji']);
	});

	it('should handle an empty string without throwing an error', () => {
		const result = extractVariables('');
		expect(result).toEqual([]);
	});
});

describe('updateTemplateVariablesRecord tests', () => {
	it('should update template variables record correctly', () => {
		const messages: OpenAIPromptMessage[] = [
			{
				content: 'Hello {user}, your order {order_id} is ready.',
				role: 'user',
			},
			{
				content: 'Hello {user}, your balance is {balance}.',
				role: 'system',
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
			{ content: 'Hello {user}!', role: 'user' },
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
			{ content: 'Just a plain message.', role: 'user' },
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

describe('decodeUrlSpaces tests', () => {
	it('should replace %20 with space in a single instance', () => {
		const result = decodeUrlSpaces('test%20config');
		expect(result).toBe('test config');
	});

	it('should replace %20 with space in multiple instances', () => {
		const result = decodeUrlSpaces('multiple%20words%20with%20spaces');
		expect(result).toBe('multiple words with spaces');
	});

	it('should return the same string if no %20 is present', () => {
		const result = decodeUrlSpaces('no spaces');
		expect(result).toBe('no spaces');
	});

	it('should return an empty string if input is empty', () => {
		const result = decodeUrlSpaces('');
		expect(result).toBe('');
	});
});

describe('areArraysEqual tests', () => {
	it('returns true for two identical arrays', () => {
		expect(areArraysEqual(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true);
	});

	it('returns true for two arrays with the same elements in different orders', () => {
		expect(areArraysEqual(['c', 'a', 'b'], ['a', 'b', 'c'])).toBe(true);
	});

	it('returns false for arrays of different lengths', () => {
		expect(areArraysEqual(['a', 'b'], ['a', 'b', 'c'])).toBe(false);
	});

	it('returns false for arrays with different elements', () => {
		expect(areArraysEqual(['a', 'b', 'd'], ['a', 'b', 'c'])).toBe(false);
	});

	it('returns true for two empty arrays', () => {
		expect(areArraysEqual([], [])).toBe(true);
	});

	it('returns false when comparing a non-empty array with an empty one', () => {
		expect(areArraysEqual(['a'], [])).toBe(false);
	});

	it('returns false when the first array is undefined', () => {
		expect(areArraysEqual(undefined, ['a', 'b', 'c'])).toBe(false);
	});

	it('returns false when the second array is undefined', () => {
		expect(areArraysEqual(['a', 'b', 'c'])).toBe(false);
	});

	it('returns false when both arrays are undefined', () => {
		expect(areArraysEqual()).toBe(false);
	});
});
