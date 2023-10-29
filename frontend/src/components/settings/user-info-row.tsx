export function UserInfoRow({
	label,
	value,
}: {
	label: string;
	value: string | null | undefined;
}) {
	return (
		<div className="my-auto">
			<div className="text-neutral-content text-xs font-medium mb-1">
				{' '}
				{label}
			</div>
			<div
				data-testid="user-info-value"
				className={`text-neutral-content text-lg font-medium ${
					!value && 'animate-pulse w-24 bg-neutral'
				}`}
			>
				{value ?? '\u00A0'}
			</div>
		</div>
	);
}
