'use client';
import Link from 'next/link';

interface LinkMenuProps {
	text?: string;
	icon?: React.ReactElement;
	badge?: React.ReactNode;
	isCurrent?: boolean;
	isDisabled?: boolean;
	href?: string;
}

export default function LinkMenu({
	text,
	icon,
	badge,
	isDisabled,
	isCurrent,
	href,
}: LinkMenuProps) {
	return isDisabled ? (
		<div className="flex items-center pb-4 opacity-60">
			<div className="flex items-center text-base-content">
				{icon && <div className="mr-2">{icon}</div>}
				{text && <span className="text-sm font-medium">{text}</span>}
			</div>
			{badge && <span className="ml-2">{badge}</span>}
		</div>
	) : (
		<Link href={href ?? '#'}>
			<div className="flex items-center pb-4">
				<div
					className={`text-base-content transition ${
						isCurrent ? 'text-primary' : 'hover:text-primary'
					}`}
				>
					{icon && <div className="mr-2">{icon}</div>}
					{text && (
						<span className="text-sm font-medium">{text}</span>
					)}
				</div>
				{badge && <span className="ml-2">{badge}</span>}
			</div>
		</Link>
	);
}
