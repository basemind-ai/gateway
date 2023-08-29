import dayjs from 'dayjs';

export function wait(timeout: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, timeout);
	});
}

export function formatDate(
	date: Date | string | number,
	format = 'MMMM D, YYYY h:mm A',
): string {
	return dayjs(date).format(format);
}

export function sortByDateProp<
	T extends Record<string, any> & {
		createdAt: string | Date | number;
		updatedAt?: string | Date | number;
	},
>(collection: T[]) {
	return (
		key: keyof T = 'createdAt',
		direction: 'asc' | 'desc' = 'asc',
	): T[] => {
		return collection.sort((a, b) =>
			direction === 'asc'
				? dayjs(a[key]).isBefore(dayjs(b[key]))
					? -1
					: 1
				: dayjs(a[key]).isBefore(dayjs(b[key]))
				? 1
				: -1,
		);
	};
}
