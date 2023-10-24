export default function DashboardCard({
	children,
	title,
}: {
	children: React.ReactNode;
	title: string;
}) {
	return (
		<div>
			<h2 className="text-xl font-normal text-base-content mb-4">
				{title}
			</h2>
			<div className="bg-base-200 shadow-sm rounded-4xl py-8 px-32">
				<div className="justify-between flex">{children}</div>
			</div>
		</div>
	);
}
