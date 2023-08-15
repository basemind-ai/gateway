import { placeholder } from '@/main';

describe('main tests', () => {
	it('throws an error', () => {
		expect(() => placeholder()).toThrow();
	});
});
