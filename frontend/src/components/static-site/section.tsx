export function Section({
	name,
	children,
}: {
	children: React.ReactNode;
	name: string;
}) {
	return (
		<section
			className="flex flex-col md:flex-row justify-between items-center py-8 px-2 md:px-0 "
			data-testid={`landing-page-${name}-section`}
		>
			{children}
		</section>
	);
}
