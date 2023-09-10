/* eslint sonarjs/no-duplicate-string: "off" */

'use client';

import { usePathname } from 'next/navigation';
import { Bank2, Gear, QuestionCircle } from 'react-bootstrap-icons';

import { Navigation } from '@/constants';

export default function NavRailFooter() {
	const [pathname] = usePathname().split('?');
	return (
		<div
			className="flex h-12 items-center justify-around relative border-t border-base-100 shadow-sm"
			data-testid="nav-rail-footer"
		>
			<a
				data-testid="nav-rail-footer-settings"
				href={Navigation.Settings}
				className={`${
					Navigation.Settings === pathname
						? 'text-primary'
						: 'text-base-content'
				} hover:text-primary`}
			>
				<Gear />
			</a>
			<a
				data-testid="nav-rail-footer-billing"
				href={Navigation.Billing}
				className={`${
					Navigation.Billing === pathname
						? 'text-primary'
						: 'text-base-content'
				} hover:text-primary`}
			>
				<Bank2 />
			</a>
			<a
				href={Navigation.Support}
				className={`${
					Navigation.Support === pathname
						? 'text-primary'
						: 'text-base-content'
				} hover:text-primary`}
			>
				<QuestionCircle />
			</a>
		</div>
	);
}
