import { act, renderHook } from 'tests/test-utils';

import { DateFormat } from '@/constants';
import {
	useDateFormat,
	useResetState,
	useSetDateFormat,
} from '@/stores/user-config-store';

describe('user-config-store tests', () => {
	const {
		result: { current: resetState },
	} = renderHook(useResetState);

	beforeEach(() => {
		resetState();
	});

	describe('useDateFormat and useSetDateFormat', () => {
		it('sets and returns dateFormat', () => {
			const {
				result: { current: dateFormat },
			} = renderHook(useDateFormat);
			expect(dateFormat).toBe(DateFormat.ISO);

			const {
				result: { current: setDateFormat },
			} = renderHook(useSetDateFormat);
			act(() => {
				setDateFormat('MM-YYYY');
			});

			const {
				result: { current: newDateFormat },
			} = renderHook(useDateFormat);
			expect(newDateFormat).toBe('MM-YYYY');
		});
	});
});
