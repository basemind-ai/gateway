import { screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { render, renderHook } from 'tests/test-utils';

import { UserDetails } from '@/components/settings/user-details';

describe('user details card tests', () => {
	const { result } = renderHook(() => useTranslations('userSettings'));
	const t = result.current;
	const mockUser = {
		phoneNumber: '',
		providerId: '',
		uid: '',
		displayName: 'Skywalker',
		email: 'Skywalker@gmail.com',
		photoURL: 'https://picsum.photos/200',
	};
	it('should render', () => {
		render(<UserDetails user={mockUser} />);
		const userDetails = screen.getByText(t('headlineDetailsCard'));
		expect(userDetails).toBeInTheDocument();
	});
	it('should display user name when user is authenticated', () => {
		render(<UserDetails user={mockUser} />);
		const userName = screen.getByText(mockUser.displayName);
		expect(userName).toBeInTheDocument();
	});
	it('should display user email when user is authenticated', () => {
		render(<UserDetails user={mockUser} />);
		const userEmail = screen.getByText(mockUser.email);
		expect(userEmail).toBeInTheDocument();
	});
	it('should render loading animate-pulse animation on user name when its null', () => {
		render(<UserDetails user={null} />);
		const loadingAnimation = screen.getByTestId('user-name');
		expect(loadingAnimation).toHaveClass('animate-pulse');
	});
	it('should render loading animate-pulse animation on user email when its null', () => {
		render(<UserDetails user={null} />);
		const loadingAnimation = screen.getByTestId('user-email');
		expect(loadingAnimation).toHaveClass('animate-pulse');
	});
});
