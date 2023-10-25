import { fireEvent } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { routerPushMock } from 'tests/mocks';
import { render, renderHook, screen } from 'tests/test-utils';
import { describe } from 'vitest';

import { GetInTouch } from '@/components/support/get-in-touch';
import { Navigation } from '@/constants';

describe('get-in-touch tests', () => {
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('support'));

	it('should render headline', () => {
		render(<GetInTouch />);
		const headline = screen.getByText(t('getInTouch'));
		expect(headline).toBeInTheDocument();
	});
	it('should render discord link', async () => {
		render(<GetInTouch />);
		const link = screen.getByText(t('joinOurDiscord'));
		expect(link).toBeInTheDocument();
		fireEvent.click(link);
		expect(routerPushMock).toHaveBeenCalledWith(Navigation.Discord);
	});
});
