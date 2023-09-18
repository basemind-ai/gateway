/* eslint sonarjs/no-duplicate-string: "off" */

'use client';

import { usePathname } from 'next/navigation';
import { Bank2, Gear, QuestionCircle } from 'react-bootstrap-icons';

import { Navigation } from '@/constants';

export default function NavRailFooter() {
	const pathname: string = usePathname().split('?')[0];
	return (
		<div className="flex h-12 items-center justify-around relative border-t border-base-100 shadow-sm">
			<a
				href={Navigation.Settings as string}
				className={`${
					Navigation.Settings === pathname
						? 'text-primary'
						: 'text-base-content'
				} hover:text-primary`}
			>
				<Gear />
			</a>
			<a
				href={Navigation.Billing as string}
				className={`${
					Navigation.Billing === pathname
						? 'text-primary'
						: 'text-base-content'
				} hover:text-primary`}
			>
				<Bank2 />
			</a>
			<a
				href={Navigation.Help as string}
				className={`${
					Navigation.Help === pathname
						? 'text-primary'
						: 'text-base-content'
				} hover:text-primary`}
			>
				<QuestionCircle />
			</a>
		</div>
	);
}
