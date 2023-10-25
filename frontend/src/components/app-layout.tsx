import NavRail from '@/components/nav-rail/nav-rail';

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div
			className="bg-base-100 h-full w-full flex"
			data-testid="app-layout-container"
		>
			<div className="min-w-min max-w-fit">
				<NavRail />
			</div>
			<div className="w-full">{children}</div>
		</div>
	);
}
