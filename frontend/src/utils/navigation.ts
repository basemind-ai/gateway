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

export type NavigationPathParam =
	| 'projectId'
	| 'applicationId'
	| 'promptConfigId';

const keyReplacerMap: Record<
	NavigationPathParam,
	(url: string, value: string) => string
> = {
	applicationId: setApplicationId,
	projectId: setProjectId,
	promptConfigId: setPromptConfigId,
};

export function setRouteParams<
	U extends string,
	T extends string | number = number,
>(
	url: U,
	params: Partial<Record<NavigationPathParam, string>>,
	tab?: T,
): string {
	let result = url as string;
	for (const [key, value] of Object.entries(params)) {
		result = keyReplacerMap[key as NavigationPathParam](result, value);
	}

	return tab ? `${result}#tab-${tab}` : result;
}

export function setProjectId(url: string, projectId: string) {
	return url.replaceAll(':projectId', projectId);
}

export function setApplicationId(url: string, applicationId: string) {
	return url.replaceAll(':applicationId', applicationId);
}

export function setPromptConfigId(url: string, promptConfigId: string) {
	return url.replaceAll(':promptConfigId', promptConfigId);
}
