import { copyToClipboard, getCloneName } from '@/utils/helpers';

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

			const cloneNames = [
				...Array.from({ length: cloneCount }).keys(),
			].map((_) => getCloneName(sourceName));

			const cloneNameSet = new Set(cloneNames);

			expect(cloneNameSet.size).toBeGreaterThan(passCloneCount);
		});
	});
});
