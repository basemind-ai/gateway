export function Feature({
	title,
	subtitle,
	description,
	reverse = false,
	name,
	children,
}: {
	title: string;
	subtitle: string;
	description: string;
	reverse?: boolean;
	name: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={`card p-5 shadow shadow-neutral border-3 border-base-200/10 h-full flex flex-col justify-between items-center md:px-0 ${
				reverse ? 'md:flex-row-reverse' : ''
			}`}
			data-testid={`feature-card-${name}`}
		>
			<div className="md:w-5/12 justify-center md:text-left mt-8 md:mt-0 p-2">
				<h4 className="text-secondary text-lg mb-4 font-semibold">
					{title}
				</h4>
				<h2 className="text-base-content text-3xl xl:text-4xl 2xl:text-5xl font-bold mb-4 p-2">
					{subtitle}
				</h2>
				<p className="text-base-content/80">{description}</p>
			</div>
			<div className="md:w-5/12 m-8 md:mt-0 p-2">{children}</div>
		</div>
	);
}
