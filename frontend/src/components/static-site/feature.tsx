export function Feature({
	title,
	subtitle,
	description,
	reverse = false,
	name,
	children,
}: {
	children: React.ReactNode;
	description: string;
	name: string;
	reverse?: boolean;
	subtitle: string;
	title: string;
}) {
	return (
		<div
			className={` p-5 h-full flex flex-col justify-between items-center md:px-0 ${
				reverse ? 'md:flex-row-reverse' : 'md:flex-row'
			}`}
			data-testid={`feature-card-${name}`}
		>
			<div className="md:w-5/12  md:text-left mt-8 md:mt-0 p-2 flex flex-col gap-4">
				<h4 className="text-secondary text-lg 2xl:text-xl font-semibold">
					{title}
				</h4>
				<h2 className="text-base-content text-3xl xl:text-4xl 2xl:text-5xl font-bold">
					{subtitle}
				</h2>
				<p className="text-base-content/80 2xl:text-lg">
					{description}
				</p>
			</div>
			<div className="md:w-5/12 m-8 md:mt-0 ">{children}</div>
		</div>
	);
}
