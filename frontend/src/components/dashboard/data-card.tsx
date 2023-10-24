import { ReactElement } from 'react';
import { ArrowUpRight } from 'react-bootstrap-icons';

export interface DataCardProps {
	imageSrc: ReactElement;
	metric: string;
	totalValue: string | number;
	currentValue?: string;
	percentage?: string;
}

export function DataCard({
	imageSrc,
	metric,
	totalValue,
	currentValue,
	percentage,
}: DataCardProps) {
	return (
		<div className="flex items-center gap-4">
			<div>
				<p className="text-neutral-content text-sm">{metric}</p>
				<h1
					data-testid={`data-card-total-value-${metric}`}
					className="text-3xl font-semibold text-neutral-content"
				>
					{totalValue}
				</h1>
				{currentValue && percentage && (
					<p className="text-neutral-content text-xs font-light flex gap-1.5 items-center">
						<ArrowUpRight className="w-3 h-3 text-neutral-content" />
						<span>
							{currentValue} ({percentage})
						</span>
					</p>
				)}
			</div>
			{imageSrc}
		</div>
	);
}
