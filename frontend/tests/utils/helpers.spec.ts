import { handleChange } from '@/utils/helpers';

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
});
