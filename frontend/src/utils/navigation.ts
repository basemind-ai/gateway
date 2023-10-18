import { Navigation } from '@/constants';

export function contextNavigation(
	projectId: string | null | undefined,
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

export function populateProjectId(search: string, applicationId: string) {
	return search.replaceAll(':projectId', applicationId);
}

export function populateApplicationId(search: string, applicationId: string) {
	return search.replaceAll(':applicationId', applicationId);
}
