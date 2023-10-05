import { ReactElement } from 'react';

export interface DataCardProps {
	imageSrc: ReactElement;
	metric: string;
	totalValue: string;
	currentValue: string;
	percentage: string;
}

export function DataCard({
	imageSrc,
	metric,
	totalValue,
	currentValue,
	percentage,
}: DataCardProps) {
	return (
		<div className="flex flex-col">
			<div className="text-neutral-content">{metric}</div>
			<div className="text-2xl font-semibold text-neutral-content flex">
				{totalValue}
				<div className="ml-5">{imageSrc}</div>
			</div>
			<div className="text-neutral-content">
				{currentValue} ({percentage})
			</div>
		</div>
	);
}
