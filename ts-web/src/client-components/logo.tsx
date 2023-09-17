import Image from 'next/image';

export function Logo() {
	return (
		<div className="align-baseline flex">
			<Image
				priority
				width="26"
				height="26"
				src="/images/pinecone-transparent-bg.svg"
				alt="Logo"
			/>
			<span className="text-2xl font-bold text-primary">BaseMind</span>
		</div>
	);
}
