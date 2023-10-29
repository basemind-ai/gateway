import { screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { render, renderHook } from 'tests/test-utils';
import { expect } from 'vitest';

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
	it('should render loading animate-pulse animation on user name when its null', async () => {
		render(<UserDetails user={null} />);
		const loadingAnimation =
			await screen.findAllByTestId('user-info-value');
		expect(loadingAnimation[0]).toHaveClass('animate-pulse');
		expect(loadingAnimation[1]).toHaveClass('animate-pulse');
	});
});
