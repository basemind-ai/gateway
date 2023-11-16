'use client';
import { useTranslations } from 'next-intl';

import { ContactForm } from '@/components/support/contact-form';
import { GetInTouch } from '@/components/support/get-in-touch';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';

export default function Support() {
	const user = useAuthenticatedUser();
	const t = useTranslations('support');

	return (
		<div data-testid="support-page" className="mt-6 mx-32">
			<h1 className="text-2xl font-semibold text-base-content mb-10">
				{t('headline')}
			</h1>
			<div className="mb-10">
				<GetInTouch />
			</div>
			<ContactForm isAuthenticated={!!user} />
		</div>
	);
}