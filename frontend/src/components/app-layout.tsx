import NavRail from '@/components/nav-rail/nav-rail';

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div
			className="bg-base-100 h-full w-full flex"
			data-testid="app-layout-container"
		>
			<div className="w-2/12 min-w-min max-w-fit">
				<NavRail />
			</div>
			<div className="w-10/12">{children}</div>
		</div>
	);
}
