import { useRouter } from 'next/navigation';

import { Navigation } from '@/constants';
import {
	ApiError,
	ConfigurationError,
	PermissionError,
	TokenError,
	UnhandledError,
} from '@/errors';
import { useResetState as useResetAPIStoreState } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
import { useResetState as useResetUserConfigStoreState } from '@/stores/user-config-store';

export function useHandleError() {
	const showError = useShowError();
	const router = useRouter();
	const resetAPIStoreState = useResetAPIStoreState();
	const resetUserConfigStoreState = useResetUserConfigStoreState();

	return (value: unknown) => {
		if (value instanceof ConfigurationError) {
			throw value;
		}

		if (value instanceof TokenError || value instanceof PermissionError) {
			resetAPIStoreState();
			resetUserConfigStoreState();
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
