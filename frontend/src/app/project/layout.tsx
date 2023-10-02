import '@/styles/globals.scss';

import NavRail from '@/components/nav-rail/nav-rail';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="bg-base-100 h-full w-full flex">
			<div className="w-2/12">
				<NavRail />
			</div>
			<div className="w-10/12">{children}</div>
		</div>
	);
}
