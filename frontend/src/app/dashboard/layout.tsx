import '@/styles/globals.scss';

import AuthGuard from '@/app/dashboard/auth-guard';
import NavRail from '@/app/dashboard/nav-rail';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="bg-base-100 h-full flex">
			<NavRail />
			{children}
			<AuthGuard />
		</div>
	);
}
