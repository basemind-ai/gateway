import { useTranslations } from 'next-intl';

export function Footer() {
	const t = useTranslations('landingPage');

	return (
		<footer
			className="footer footer-center p-12 bg-base-200 text-base-content"
			data-testid="landing-page-footer"
		>
			<div>
				<p data-testid="footer-text">{t('footerText')}</p>
				<p data-testid="footer-copyright">{t('footerCopyright')}</p>
			</div>
		</footer>
	);
}
