import NavRail from '@/components/navrail/nav-rail';

export function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div
			className="bg-base-100 h-full min-h-screen w-full grid grid-cols-[min-content,1fr]"
			data-testid="app-layout-container"
		>
			<div className="sticky top-0 h-screen">
				<NavRail />
			</div>
			<div className="overflow-auto">{children}</div>
		</div>
	);
}
