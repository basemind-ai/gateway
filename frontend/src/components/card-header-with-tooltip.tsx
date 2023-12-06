import { InfoCircle } from 'react-bootstrap-icons';

export function CardHeaderWithTooltip({
	headerText,
	tooltipText,
	dataTestId,
}: {
	dataTestId: string;
	headerText: string;
	tooltipText: string;
}) {
	return (
		<div
			className="tooltip tooltip-top flex max-w-sm items-center gap-1 pr-3"
			data-tip={tooltipText}
			data-testid={dataTestId}
		>
			<h2 className="card-header">{headerText}</h2>
			<InfoCircle className="w-3 h-3" />
		</div>
	);
}
