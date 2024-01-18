'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Logo } from '@/components/logo';
import { NavAuctionIcons } from '@/components/static-site/nav-auction-icons';
import { Navigation } from '@/constants';

export const FooterLinks = [
	{ href: Navigation.Base, title: 'home' },
	{ href: Navigation.PrivacyPolicy, title: 'pp' },
	{ href: Navigation.TOS, title: 'tos' },
	{ href: Navigation.SignIn, title: 'signIn' },
];

export function Footer() {
	const t = useTranslations('landingPage');

	return (
		<footer
			className="footer footer-center text-base-content bg-base-200 p-8"
			data-testid="static-site-footer"
		>
			<aside>
				<Logo />
			</aside>

			<nav className="grid grid-flow-col gap-4 pb-0">
				{FooterLinks.map(({ title, href }) => (
					<Link
						key={title}
						href={href}
						className="link link-hover hover:text-accent"
						data-testid={`footer-${title}`}
						locale="en"
					>
						{t(title)}
					</Link>
				))}
			</nav>
			<NavAuctionIcons />
		</footer>
	);
}
