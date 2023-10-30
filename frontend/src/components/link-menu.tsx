'use client';
import Link from 'next/link';

export interface LinkMenuProps {
	text?: string;
	icon?: React.ReactElement;
	badge?: React.ReactNode;
	isCurrent?: boolean;
	isDisabled?: boolean;
	href?: string;
	children?: React.ReactNode;
}

export default function LinkMenu({
	text,
	icon,
	badge,
	isDisabled,
	isCurrent,
	href,
	children,
}: LinkMenuProps) {
	const Wrapper = ({ children }: { children: React.ReactNode }) =>
		isDisabled ? (
			<>{children}</>
		) : (
			<Link data-testid="link-menu-anchor" href={href ?? '#'}>
				{children}
			</Link>
		);

	return (
		<>
			<Wrapper>
				<div
					className={`flex items-center  py-2  ${
						isDisabled && 'opacity-60'
					}`}
				>
					<div
						className={`flex items-center text-base-content transition
						${isCurrent && 'text-primary'}
						${!isDisabled && 'hover:text-primary'}`}
					>
						{icon && <div className="mr-2">{icon}</div>}
						{text && <span className="text-xs ">{text}</span>}
					</div>
					{badge && <span className="ml-2">{badge}</span>}
				</div>
			</Wrapper>
			{children && (
				<div className="flex flex-col gap-2.5 border-l-2 border-neutral ml-5 pl-2.5">
					{children}
				</div>
			)}
		</>
	);
}
