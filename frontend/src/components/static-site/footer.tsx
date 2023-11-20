import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Logo } from '@/components/logo';
import DiscordButton from '@/components/static-site/discord-button';
import { Navigation } from '@/constants';

export const LegalFooterLinks = [
	{ href: Navigation.PrivacyPolicy, title: 'pp' },
	{ href: Navigation.TOS, title: 'tos' },
];

export const GeneralFooterLinks = [
	{ href: Navigation.Base, title: 'home' },
	{ href: Navigation.SignIn, title: 'signIn' },
	{ href: Navigation.Support, title: 'support' },
];

export function Footer() {
	const t = useTranslations('landingPage');

	return (
		<footer
			className="footer p-12 bg-base-100 text-base-content"
			data-testid="static-site-footer"
		>
			<aside>
				<Logo />
				<p
					className="text-base-content text-xs pt-6 pl-2"
					data-testid="footer-copyright"
				>
					{t('footerCopyright')}
				</p>
			</aside>
			<nav>
				<header className="footer-title">{t('general')}</header>
				{GeneralFooterLinks.map(({ title, href }) => (
					<Link
						key={title}
						href={href}
						className="link link-hover hover:text-secondary"
						data-testid={`footer-${title}`}
						locale="en"
					>
						{t(title)}
					</Link>
				))}
			</nav>
			<nav>
				<header className="footer-title">{t('legal')}</header>
				{LegalFooterLinks.map(({ href, title }) => (
					<Link
						key={title}
						href={href}
						className="link link-hover hover:text-secondary"
						data-testid={`footer-${title}`}
						locale="en"
					>
						{t(title)}
					</Link>
				))}
			</nav>
			<nav>
				<header className="footer-title" data-testid="footer-social">
					{t('social')}
				</header>
				<div className="grid grid-flow-col gap-4">
					<DiscordButton />
				</div>
			</nav>
		</footer>
	);
}
