import { server } from '@/index';

describe('main tests', () => {
	it('throws an error', () => {
		expect(server).toThrow();
	});
});
