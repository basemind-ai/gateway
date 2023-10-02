import Image from 'next/image';

import { Dimensions } from '@/constants';

export interface DataCardProps {
	imageSrc: string;
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
				<Image
					className="ml-5"
					src={imageSrc}
					alt={'data card logo'}
					width={Dimensions.Eight}
					height={Dimensions.Eight}
				/>
			</div>
			<div className="text-neutral-content">
				{currentValue} ({percentage})
			</div>
		</div>
	);
}
