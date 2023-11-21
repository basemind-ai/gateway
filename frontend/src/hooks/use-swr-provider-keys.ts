import useSWR from 'swr';

import { handleRetrieveProviderKeys } from '@/api/provider-keys-api';
import { ApiError } from '@/errors';
import { useProviderKeys, useSetProviderKeys } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';

export function useSwrProviderKeys({ projectId }: { projectId: string }) {
	const showError = useShowError();

	const providerKeys = useProviderKeys();
	const setProviderKeys = useSetProviderKeys();

	const { isLoading } = useSWR(
		{
			projectId,
		},
		handleRetrieveProviderKeys,
		{
			onError(apiError: ApiError) {
				showError(apiError.message);
			},
			onSuccess(data) {
				setProviderKeys(data);
			},
		},
	);

	return {
		isLoading,
		providerKeys,
		setProviderKeys,
	};
}
