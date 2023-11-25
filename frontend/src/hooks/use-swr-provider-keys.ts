import useSWR from 'swr';

import { handleRetrieveProviderKeys } from '@/api/provider-keys-api';
import { useHandleError } from '@/hooks/use-handle-error';
import { useProviderKeys, useSetProviderKeys } from '@/stores/api-store';

export function useSwrProviderKeys({ projectId }: { projectId: string }) {
	const handleError = useHandleError();

	const providerKeys = useProviderKeys();
	const setProviderKeys = useSetProviderKeys();

	const { isLoading } = useSWR(
		{
			projectId,
		},
		handleRetrieveProviderKeys,
		{
			onError: handleError,
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
