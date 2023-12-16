import { InfoCircle } from 'react-bootstrap-icons';

export function TooltipIcon({
	dataTestId,
	tooltip,
}: {
	dataTestId: string;
	tooltip: string;
}) {
	return (
		<div
			className="tooltip tooltip-top flex max-w-sm items-center gap-1 pr-3"
			data-tip={tooltip}
			data-testid={dataTestId}
		>
			<InfoCircle className="w-3 h-3" />
		</div>
	);
}
