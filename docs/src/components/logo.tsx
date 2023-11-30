import Image from 'next/image';
import { useRouter } from 'next/router';

export function Logo() {
	const router = useRouter();
	return (
		<div
			className="flex justify-start items-center"
			data-testid="logo-component"
			onClick={() => {
				void router.push('/');
			}}
		>
			<Image
				priority
				width={22}
				height={22}
				src="/images/basemind-logo.svg"
				alt="Logo"
				data-testid="logo-image"
			/>
			<span
				className="pl-2 font-bold text-primary text-lg"
				data-testid="logo-text"
			>
				BaseMind.AI
			</span>
		</div>
	);
}
