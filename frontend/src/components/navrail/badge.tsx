export interface BadgeProps {
	fillColor: string;
	textColor: string;
	text: string;
}

export default function Badge({ fillColor, textColor, text }: BadgeProps) {
	return (
		<span
			className={`inline-flex items-center py-0.5 px-1 rounded-full text-[8px] ${fillColor} ${textColor} align-middle`}
		>
			{text}
		</span>
	);
}
