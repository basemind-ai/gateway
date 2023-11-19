import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Logo } from '@/components/logo';
import DiscordBtn from '@/components/static-site/discord-btn';
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
				<br />
				<p
					className="text-base-content text-xs"
					data-testid={'footer-copyright'}
				>
					{t('footerCopyright')}
				</p>
			</aside>
			<nav className="">
				<span className="footer-title">{t('general')}</span>
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
			<nav className="">
				<span className="footer-title">{t('legal')}</span>
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
				<span className="footer-title" data-testid="footer-social">
					{t('social')}
				</span>
				<div className="grid grid-flow-col gap-4">
					<DiscordBtn />
				</div>
			</nav>
		</footer>
	);
}
