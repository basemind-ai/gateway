import { Navigation } from '@/constants';
import {
	contextNavigation,
	populateApplicationId,
	populateProjectId,
} from '@/utils/navigation';

describe('contextNavigation tests', () => {
	it('returns original Navigation object when projectId is not defined', () => {
		const navigation = contextNavigation();
		expect(navigation).toBe(Navigation);
	});

	it('returns navigation links populated with projectId', () => {
		const projectId = '2';
		const navigation = contextNavigation(projectId);

		expect(navigation.Application).toContain(projectId);
		expect(navigation.Application).not.toContain(':projectId');
	});
});

describe('populateProjectId tests', () => {
	it('replaces :projectId in string with the given project id', () => {
		const projectId = '123';
		const url = populateProjectId(
			'/projects/:projectId/application',
			projectId,
		);
		expect(url).toBe('/projects/123/application');
	});
});

describe('populateApplicationId tests', () => {
	it('replaces :applicationId in string with the given application id', () => {
		const applicationId = '123';
		const url = populateApplicationId(
			'/projects/:projectId/application/:applicationId',
			applicationId,
		);
		expect(url).toBe('/projects/:projectId/application/123');
	});
});
