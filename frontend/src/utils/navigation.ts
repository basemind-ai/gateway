import { Navigation } from '@/constants';

export function contextNavigation(
	projectId?: string | null,
): Record<keyof typeof Navigation, string> {
	if (!projectId) {
		return Navigation;
	}
	return Object.fromEntries(
		Object.entries(Navigation).map(([key, url]) => [
			key,
			setProjectId(url, projectId),
		]),
	) as Record<keyof typeof Navigation, string>;
}

export type NavigationPathParam = 'projectId' | 'applicationId' | 'configId';

const keyReplacerMap: Record<
	NavigationPathParam,
	(url: string, value: string) => string
> = {
	applicationId: setApplicationId,
	configId: setConfigId,
	projectId: setProjectId,
};

export function setPathParams<T extends string>(
	url: T,
	params: Partial<Record<NavigationPathParam, string>>,
): string {
	let result = url as string;
	for (const [key, value] of Object.entries(params)) {
		result = keyReplacerMap[key as NavigationPathParam](result, value);
	}

	return result;
}

export function setProjectId(url: string, projectId: string) {
	return url.replaceAll(':projectId', projectId);
}

export function setApplicationId(url: string, applicationId: string) {
	return url.replaceAll(':applicationId', applicationId);
}

export function setConfigId(url: string, configId: string) {
	return url.replaceAll(':configId', configId);
}
