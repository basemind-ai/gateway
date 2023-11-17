'use client';

import { Logo } from '@/components/logo';
import { NavRailFooter } from '@/components/navrail/nav-rail-footer';
import { NavRailList } from '@/components/navrail/nav-rail-list';

export function NavRail() {
	return (
		<div className="flex flex-col pt-6 px-8 h-full bg-base-200 justify-between">
			<div className="flex-shrink-0">
				<Logo />
				<NavRailList />
			</div>
			<NavRailFooter />
		</div>
	);
}
