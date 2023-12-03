import { copyToClipboard } from '@/utils/helpers';

describe('helper utils tests', () => {
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
});
