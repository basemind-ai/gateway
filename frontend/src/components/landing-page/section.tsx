export function Section({
	name,
	children,
}: {
	name: string;
	children: React.ReactNode;
}) {
	return (
		<section
			className="flex flex-col md:flex-row justify-between items-center py-24 px-2 md:px-0"
			data-testid={`landing-page-${name}-section`}
		>
			{children}
		</section>
	);
}
