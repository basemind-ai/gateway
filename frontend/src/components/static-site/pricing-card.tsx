'use client';

import { useRouter } from 'next/navigation';

import { useAnalytics } from '@/hooks/use-analytics';

export interface Perk {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
}
export interface PricingCardProps {
	cta: string;
	displayCost: string;
	perks: Perk[];
	title: string;
	url: string;
}
export function PricingCard({
	title,
	perks,
	cta,
	displayCost,
	url,
}: PricingCardProps) {
	const { initialized, track } = useAnalytics();
	const router = useRouter();

	function handleIconClick() {
		if (initialized) {
			track(`${title}_click`);
		}
		if (url.startsWith('/')) {
			router.push(url);
		} else {
			window.open(url);
		}
	}
	return (
		<div className="flex flex-col gap-6 md:justify-between items-start p-6 flex-grow self-stretch max-w-md rounded-4xl md:border md:border-neutral md:shadow-md hover:border-0 shadow-2xl hover:shadow-2xl text-base-content md:text-neutral-content hover:text-base-content overflow-hidden relative group">
			<div className="flex justify-between items-center w-full">
				<p className="text-2xl pb-2">{title}</p>
			</div>
			<div className="flex items-center gap-1 lg:gap-1.5">
				<p className="text-xl">{displayCost}</p>
			</div>
			<div className=" bg-gradient-to-tr from-accent to-primary opacity-15 md:opacity-0 group-hover:opacity-20 right-0 pointer-events-none absolute aspect-square w-1/2  rounded-full blur-3xl transition duration-700 ease-in-out" />

			<div className="flex flex-col">
				{perks.map((perk, index: number) => (
					<div
						key={index}
						className="flex items-center py-2 gap-1.5 self-stretch"
					>
						<perk.icon className="h-3 w-3 2xl:h-4 2xl:w-4" />
						<p className="align-middle text-sm xl:text-md">
							{perk.title}
						</p>
					</div>
				))}
				{perks.length < 4 && (
					<div className="flex items-center py-2 gap-1.5 self-stretch">
						<p className="align-middle text-sm xl:text-md opacity-0">
							Placeholder
						</p>
					</div>
				)}
			</div>
			<button
				className="btn btn-sm group-hover:btn-primary btn-block btn-primary md:btn-neutral transition-colors duration-500 ease-in-out"
				onClick={handleIconClick}
				data-testid={`${title}-pricing-card-cta`}
			>
				{cta}
			</button>
		</div>
	);
}
