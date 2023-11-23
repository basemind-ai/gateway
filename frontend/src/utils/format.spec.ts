import { formatNumber } from '@/utils/format';

describe('formatNumber tests', () => {
	it('should return a string with two decimal places when the input is a number between 0 and 2', () => {
		const result = formatNumber(1);
		expect(result).toBe('1.00');
	});

	it('should return a string with two decimal places when the input is a string that represents a number between 0 and 2', () => {
		const result = formatNumber('1');
		expect(result).toBe('1.00');
	});

	it('should return the input as a string when the input is a number greater than 2', () => {
		const result = formatNumber(3);
		expect(result).toBe('3');
	});

	it('should return "0.00" when the input is undefined', () => {
		const result = formatNumber(undefined);
		expect(result).toBe('0.00');
	});

	it('should return "0.00" when the input is an empty string', () => {
		const result = formatNumber('');
		expect(result).toBe('0.00');
	});

	it('should return "0.00" when the input is a string that does not represent a number', () => {
		const result = formatNumber('abc');
		expect(result).toBe('0.00');
	});
});
