import { handleChange } from '@/utils/events';

describe('event utils tests', () => {
	describe('handleChange tests', () => {
		it('return an event handler', () => {
			const eventHandler = handleChange(vi.fn());
			expect(typeof eventHandler).toBe('function');
		});

		it('calls the callback with the correct value', () => {
			const mockCallback = vi.fn();
			const event = {
				preventDefault: vi.fn(),
				target: { value: 'test' },
			};
			const eventHandler = handleChange(mockCallback);
			eventHandler(event as any);
			expect(mockCallback).toHaveBeenCalledWith('test');
		});

		it('prevents the default behaviour from bubbling.', () => {
			const mockCallback = vi.fn();
			const event = {
				preventDefault: vi.fn(),
				target: { value: 'test' },
			};
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
});
