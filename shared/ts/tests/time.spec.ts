import { wait } from 'shared/time';

describe('time util tests', () => {
	describe('wait tests', () => {
		it('handles timeout', async () => {
			const start = Date.now();
			await wait(50);
			const end = Date.now();
			expect(end - start).toBeGreaterThanOrEqual(50);
		});
	});
});
