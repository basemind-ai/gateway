import { useRouter } from 'next/navigation';

import { Navigation } from '@/constants';
import {
	ApiError,
	ConfigurationError,
	TokenError,
	UnhandledError,
} from '@/errors';
import { useShowError } from '@/stores/toast-store';

export function useHandleError() {
	const showError = useShowError();
	const router = useRouter();

	return (value: unknown) => {
		if (value instanceof ConfigurationError) {
			throw value;
		}

		if (value instanceof TokenError) {
			router.replace(Navigation.SignIn);
			return;
		}

		if (value instanceof ApiError) {
			showError(value.message);
			return;
		}

		if (process.env.NODE_ENV === 'development') {
			throw new UnhandledError('unhandled error', value);
		}

		showError('Something went wrong');
	};
}
