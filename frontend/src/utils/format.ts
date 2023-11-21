export function formatNumber(num: string | number | undefined) {
	if (typeof num === 'string') {
		num = Number.parseFloat(num);
	}

	if (num === undefined || Number.isNaN(num)) {
		return '0.00';
	}

	return num <= 2 ? num.toFixed(2) : num.toString();
}
