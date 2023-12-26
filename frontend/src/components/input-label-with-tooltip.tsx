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
			className="tooltip tooltip-top before:whitespace-pre-wrap before:content-[attr(data-tip)]"
			data-tip={tooltip}
			data-testid={dataTestId}
		>
			<InfoCircle className="w-3 h-3 text-base-content" />
		</div>
	);
}
