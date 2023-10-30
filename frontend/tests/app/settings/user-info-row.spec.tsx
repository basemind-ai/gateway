import { screen } from '@testing-library/react';
import { render } from 'tests/test-utils';

import { UserInfoRow } from '@/components/settings/user-info-row';

describe('UserInfoRow component tests', () => {
	it('should render loading state when user null', () => {
		render(<UserInfoRow label={'test'} value={null} />);
		expect(screen.getByText('test')).toBeInTheDocument();
		expect(screen.getByTestId('user-info-value').textContent).toBe(
			'\u00A0',
		);
	});
	it('should render label and value', () => {
		render(<UserInfoRow label={'label'} value={'value'} />);
		expect(screen.getByText('label')).toBeInTheDocument();
		expect(screen.getByText('value')).toBeInTheDocument();
	});
});
