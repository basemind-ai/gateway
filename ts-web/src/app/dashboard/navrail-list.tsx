'use client';
import { usePathname } from 'next/navigation';
import {
	Boxes,
	HddStack,
	HouseDoor,
	Lightning,
	Search,
	Speedometer2,
} from 'react-bootstrap-icons';

import Badge from '@/components/badge';
import LinkMenu from '@/components/link-menu';
import { Navigation } from '@/constants';

export default function NavRailList({
	item1,
	item2,
	item3,
	item4,
	item5,
	item6,
}: {
	item1: string;
	item2: string;
	item3: string;
	item4: string;
	item5: string;
	item6: string;
}) {
	const pathname: string = usePathname().split('?')[0];

	return (
		<div className="mt-12 ml-2 ">
			<LinkMenu
				href={Navigation.Dashboard}
				text={item1}
				icon={<HouseDoor className="w-3 h-3" />}
				isCurrent={Navigation.Dashboard === pathname}
			/>
			<LinkMenu
				href={Navigation.TestPrompt}
				text={item2}
				icon={<Search className="w-3 h-3" />}
				isCurrent={Navigation.TestPrompt === pathname}
			/>
			<LinkMenu
				href={Navigation.API}
				text={item3}
				icon={<Boxes className="w-3 h-3" />}
				isCurrent={Navigation.API === pathname}
			/>
			<LinkMenu
				text={item4}
				icon={<HddStack className="w-3 h-3" />}
				isDisabled={true}
				badge={
					<Badge
						text="Soon"
						fillColor="bg-secondary"
						textColor="text-secondary-content"
					/>
				}
			/>
			<LinkMenu
				text={item5}
				icon={<Lightning className="w-3 h-3" />}
				isDisabled={true}
				badge={
					<Badge
						text="Soon"
						fillColor="bg-secondary"
						textColor="text-secondary-content"
					/>
				}
			/>
			<LinkMenu
				text={item6}
				icon={<Speedometer2 className="w-3 h-3" />}
				isDisabled={true}
				badge={
					<Badge
						text="Soon"
						fillColor="bg-secondary"
						textColor="text-secondary-content"
					/>
				}
			/>
		</div>
	);
}
