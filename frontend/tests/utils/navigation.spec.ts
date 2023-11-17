import { Navigation } from '@/constants';
import {
	contextNavigation,
	setApplicationId,
	setProjectId,
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

			expect(navigation.Applications).toContain(projectId);
			expect(navigation.Applications).not.toContain(':projectId');
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
});
