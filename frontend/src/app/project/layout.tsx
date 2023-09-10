import '@/styles/globals.scss';

import NavRail from '@/components/nav-rail/nav-rail';
import AuthGuard from '@/guards/auth-guard';

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="bg-base-100 h-full flex">
			<AuthGuard />
			<NavRail />
			{children}
		</div>
	);
}
