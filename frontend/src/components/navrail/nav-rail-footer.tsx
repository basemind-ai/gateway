import { usePathname } from 'next/navigation';
import { Gear, QuestionCircle } from 'react-bootstrap-icons';

import { Navigation } from '@/constants';

export default function NavRailFooter() {
	const [pathname] = usePathname().split('?');

	const linkStyle = (linkPath: Navigation) =>
		linkPath === pathname ? 'text-primary' : 'text-base-content';

	return (
		<div
			className="flex h-12 items-center justify-around relative border-t border-base-100 shadow-sm"
			data-testid="nav-rail-footer"
		>
			<a
				data-testid="nav-rail-footer-settings"
				href={Navigation.Settings}
				className={`${linkStyle(
					Navigation.Settings,
				)} hover:text-primary`}
			>
				<Gear />
			</a>
			<a
				data-testid="nav-rail-footer-support"
				href={Navigation.Support}
				className={`${linkStyle(
					Navigation.Support,
				)} hover:text-primary`}
			>
				<QuestionCircle />
			</a>
		</div>
	);
}
