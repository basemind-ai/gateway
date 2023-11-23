import { Navigation } from '@/constants';
import {
	contextNavigation,
	setApplicationId,
	setProjectId,
	setRouteParams,
} from '@/utils/navigation';

describe('navigation utils tests', () => {
	describe('contextNavigation tests', () => {
		it('returns original Navigation object when projectId is not defined', () => {
			const navigation = contextNavigation();
			expect(navigation).toBe(Navigation);
		});

		it('returns navigation links populated with projectId', () => {
			const projectId = '2';
			const navigation = contextNavigation(projectId);

			expect(navigation.ApplicationDetail).toContain(projectId);
			expect(navigation.ApplicationDetail).not.toContain(':projectId');
		});
	});

	describe('populateProjectId tests', () => {
		it('replaces :projectId in string with the given project id', () => {
			const projectId = '123';
			const url = setProjectId(
				`/projects/${projectId}/application`,
				projectId,
			);
			expect(url).toBe('/projects/123/application');
		});
	});

	describe('populateApplicationId tests', () => {
		it('replaces :applicationId in string with the given application id', () => {
			const applicationId = '123';
			const url = setApplicationId(
				'/projects/:projectId/applications/:applicationId',
				applicationId,
			);
			expect(url).toBe('/projects/:projectId/applications/123');
		});
	});

	describe('setRouteParams', () => {
		it('should replace all path parameters in the URL with the corresponding values in the params object', () => {
			const url = '/projects/:projectId/applications/:applicationId';
			const params = {
				applicationId: '456',
				projectId: '123',
			};
			const result = setRouteParams(url, params);
			expect(result).toBe('/projects/123/applications/456');
		});

		it('should append the tab parameter to the URL if provided', () => {
			const url = '/projects/:projectId/applications/:applicationId';
			const params = {
				applicationId: '456',
				projectId: '123',
			};
			const tab = 'details';
			const result = setRouteParams(url, params, tab);
			expect(result).toBe('/projects/123/applications/456#tab-details');
		});
	});
});
