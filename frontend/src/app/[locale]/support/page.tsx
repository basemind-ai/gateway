'use client';
import { useTranslations } from 'next-intl';

import { Navbar } from '@/components/navbar';
import { ContactForm } from '@/components/support/contact-form';
import { GetInTouch } from '@/components/support/get-in-touch';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';

export default function Support() {
	const user = useAuthenticatedUser();
	const t = useTranslations('support');

	return (
		<div
			data-testid="support-page"
			className="flex flex-col min-h-screen w-full bg-base-100"
		>
			<Navbar headline={t('headline')} />
			<div className="page-content-container">
				<GetInTouch />

				<div className="card-divider">
					<ContactForm isAuthenticated={!!user} />
				</div>
			</div>
		</div>
	);
}
