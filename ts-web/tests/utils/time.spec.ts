import { wait } from '@/utils/time';

describe('time util tests', () => {
	describe('wait tests', () => {
		it('test_wait_with_positive_timeout', async () => {
			const start = Date.now();
			await wait(50);
			const end = Date.now();
			expect(end - start).toBeGreaterThanOrEqual(50);
		});
	});
});
