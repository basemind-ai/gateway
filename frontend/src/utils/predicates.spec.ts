import { OpenAIContentMessage, OpenAIFunctionMessage } from '@/types';
import { isOpenAIContentMessage } from '@/utils/predicates';

describe('predicate utils tests', () => {
	describe('isOpenAIContentMessage', () => {
		it('should return true if message is OpenAIContentMessage', () => {
			const message = {
				content: 'test',
				name: undefined,
				role: 'user',
				templateVariables: [],
			} satisfies OpenAIContentMessage;
			expect(isOpenAIContentMessage(message)).toBe(true);
		});
		it('should return false if message is not OpenAIContentMessage', () => {
			const message = {
				functionArguments: ['a', 'b'],
				name: 'myFunction',
				role: 'function',
			} satisfies OpenAIFunctionMessage;
			expect(isOpenAIContentMessage(message)).toBe(false);
		});
	});
});
