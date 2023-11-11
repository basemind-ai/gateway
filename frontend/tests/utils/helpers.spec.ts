import { copyToClipboard, getCloneName, handleChange } from '@/utils/helpers';

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
			stopPropagation: vi.fn(),
			preventDefault: vi.fn(),
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
