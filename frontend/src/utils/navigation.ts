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
			populateProjectId(url, projectId),
		]),
	) as Record<keyof typeof Navigation, string>;
}

export function populateLink(
	enumUrl: string,
	projectId?: string,
	applicationId?: string,
	configId?: string,
) {
	let url = JSON.stringify(enumUrl);
	if (projectId) {
		url = populateProjectId(enumUrl, projectId);
	}
	if (applicationId) {
		url = populateApplicationId(url, applicationId);
	}
	if (configId) {
		url = populateConfigId(url, configId);
	}
	return url;
}

export function populateProjectId(search: string, projectId: string) {
	return search.replaceAll(':projectId', projectId);
}

export function populateApplicationId(search: string, applicationId: string) {
	return search.replaceAll(':applicationId', applicationId);
}

export function populateConfigId(search: string, configId: string) {
	return search.replaceAll(':configId', configId);
}
