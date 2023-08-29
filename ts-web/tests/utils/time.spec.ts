import { formatDate, sortByDateProp, wait } from '@/utils/time';

describe('time util tests', () => {
	describe('wait tests', () => {
		it('test_wait_with_positive_timeout', async () => {
			const start = Date.now();
			await wait(50);
			const end = Date.now();
			expect(end - start).toBeGreaterThanOrEqual(50);
		});
	});

	describe('formatDate tests', () => {
		it('formats according to the default formatting', () => {
			expect(formatDate('2022-01-01')).toBe('January 1, 2022 12:00 AM');
		});

		it('formats according to a custom format', () => {
			expect(formatDate('2022-01-01', 'YYYY/MM/DD')).toBe('2022/01/01');
		});
	});

	describe('sortByDateProp tests', () => {
		it('sorts by "createdAt"', () => {
			const collection = [
				{
					createdAt: '2022-01-01T00:00:00.000Z',
					updatedAt: '2022-01-02T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-03T00:00:00.000Z',
					updatedAt: '2022-01-04T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-02T00:00:00.000Z',
					updatedAt: '2022-01-01T00:00:00.000Z',
				},
			];
			const sortedCollection = sortByDateProp(collection)();
			expect(sortedCollection).toEqual([
				{
					createdAt: '2022-01-01T00:00:00.000Z',
					updatedAt: '2022-01-02T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-02T00:00:00.000Z',
					updatedAt: '2022-01-01T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-03T00:00:00.000Z',
					updatedAt: '2022-01-04T00:00:00.000Z',
				},
			]);
		});

		it('sorts by "updatedAt"', () => {
			const collection = [
				{
					createdAt: '2022-01-01T00:00:00.000Z',
					updatedAt: '2022-01-02T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-03T00:00:00.000Z',
					updatedAt: '2022-01-04T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-02T00:00:00.000Z',
					updatedAt: '2022-01-01T00:00:00.000Z',
				},
			];
			const sortedCollection = sortByDateProp(collection)('updatedAt');
			expect(sortedCollection).toEqual([
				{
					createdAt: '2022-01-02T00:00:00.000Z',
					updatedAt: '2022-01-01T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-01T00:00:00.000Z',
					updatedAt: '2022-01-02T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-03T00:00:00.000Z',
					updatedAt: '2022-01-04T00:00:00.000Z',
				},
			]);
		});

		it('sorts ascending', () => {
			const collection = [
				{
					createdAt: '2022-01-01T00:00:00.000Z',
					updatedAt: '2022-01-02T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-03T00:00:00.000Z',
					updatedAt: '2022-01-04T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-02T00:00:00.000Z',
					updatedAt: '2022-01-01T00:00:00.000Z',
				},
			];
			const sortedCollection = sortByDateProp(collection)();
			expect(sortedCollection).toEqual([
				{
					createdAt: '2022-01-01T00:00:00.000Z',
					updatedAt: '2022-01-02T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-02T00:00:00.000Z',
					updatedAt: '2022-01-01T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-03T00:00:00.000Z',
					updatedAt: '2022-01-04T00:00:00.000Z',
				},
			]);
		});

		it('sorts descending', () => {
			const collection = [
				{
					createdAt: '2022-01-01T00:00:00.000Z',
					updatedAt: '2022-01-02T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-03T00:00:00.000Z',
					updatedAt: '2022-01-04T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-02T00:00:00.000Z',
					updatedAt: '2022-01-01T00:00:00.000Z',
				},
			];
			const sortedCollection = sortByDateProp(collection)(
				'createdAt',
				'desc',
			);
			expect(sortedCollection).toEqual([
				{
					createdAt: '2022-01-03T00:00:00.000Z',
					updatedAt: '2022-01-04T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-02T00:00:00.000Z',
					updatedAt: '2022-01-01T00:00:00.000Z',
				},
				{
					createdAt: '2022-01-01T00:00:00.000Z',
					updatedAt: '2022-01-02T00:00:00.000Z',
				},
			]);
		});

		it('handles empty collection', () => {
			const collection: { createdAt: string; updatedAt: string }[] = [];
			const sortedCollection = sortByDateProp(collection)();
			expect(sortedCollection).toEqual([]);
		});
	});
});
