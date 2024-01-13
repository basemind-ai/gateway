import { useTranslations } from 'next-intl';
import { Boxes, Lightning, LockFill } from 'react-bootstrap-icons';

const features = [
	{
		description:
			' Built with Golang and GRPC, BaseMind delivers exceptional speed, outperforming traditional backends with swift response times and scalable performance.',
		icon: <Lightning className="absolute left-1 top-1 text-secondary" />,
		name: 'Unmatched Speed.',
	},
	{
		description:
			'We dont save any of your users data. We act as a pure pipeline between your users device and the AI models.',
		icon: <LockFill className="absolute left-1 top-1 text-secondary" />,
		name: '0% of your users data saved.',
	},

	{
		description:
			'Integrate in minutes, scale to millions. BaseMind Allows you to focus on your product, not your infrastructure.',
		icon: <Boxes className="absolute left-1 top-1 text-secondary" />,
		name: 'Scalable Infrastructure.',
	},
];

export default function BenefitsSection() {
	const gridItems = Array.from({ length: 64 }).fill(null);
	const t = useTranslations('landingPage');
	return (
		<section
			className="z-0 px-8 py-24 sm:py-32 bg-base-300 relative overflow-hidden"
			data-testid="landing-page-benefits"
		>
			<div className="mx-auto max-w-7xl px-6 lg:px-8">
				<div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:place-items-center">
					<div className="lg:pr-8">
						<div className="lg:max-w-lg">
							<p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl gradient-headline">
								{t('notJustEasier')}
								<span className="text-primary">
									{t('better')}
								</span>
							</p>
							<dl className="mt-10 max-w-xl space-y-8 text-base leading-7 text-neutral-content/80 lg:max-w-none">
								{features.map((feature) => (
									<div
										key={feature.name}
										className="relative pl-8"
									>
										<dl> {feature.icon}</dl>
										<dt className="inline font-semibold text-primary">
											{feature.name}
										</dt>{' '}
										<dd className="inline">
											{feature.description}
										</dd>
									</div>
								))}
							</dl>
						</div>
					</div>
					<div className=" blur-3xl bg-gradient-to-br from-neutral-content/60 via-primary to-neutral-content/80 w-1/2   absolute aspect-square top-1/2 opacity-10 left-2/3 transform -translate-x-1/2 -translate-y-1/2" />

					<div className="flex h-full aspect-square overflow-clip rounded-full">
						<div className="relative w-full self-center">
							<div className="z-50 bg-base-300 absolute rounded-box flex items-center justify-center bg-gradient-to-r from-base-300 to-neutral shadow-xl w-16 h-16 rotate-[-14deg] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
								<LockFill className="text-primary rotate-[14deg]" />
							</div>
							<svg
								className="absolute z-20 blur-2xl transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
								width="480"
								height="480"
								viewBox="0 0 480 480"
								xmlns="http://www.w3.org/2000/svg"
							>
								<defs>
									<linearGradient
										id="pulse-a"
										x1="50%"
										x2="50%"
										y1="100%"
										y2="0%"
									>
										<stop
											offset="0%"
											stopColor="#A855F7"
										></stop>
										<stop
											offset="76.382%"
											stopColor="#FAF5FF"
										></stop>
										<stop
											offset="100%"
											stopColor="#6366F1"
										></stop>
									</linearGradient>
								</defs>
								<g fillRule="evenodd" className="grow-and-fade">
									<path
										fill="url(#pulse-a)"
										fillRule="evenodd"
										d="M240,0 C372.5484,0 480,107.4516 480,240 C480,372.5484 372.5484,480 240,480 C107.4516,480 0,372.5484 0,240 C0,107.4516 107.4516,0 240,0 Z M240,88.8 C156.4944,88.8 88.8,156.4944 88.8,240 C88.8,323.5056 156.4944,391.2 240,391.2 C323.5056,391.2 391.2,323.5056 391.2,240 C391.2,156.4944 323.5056,88.8 240,88.8 Z"
									></path>
									<path
										fill="url(#pulse-a)"
										fillRule="evenodd"
										d="M240,0 C372.5484,0 480,107.4516 480,240 C480,372.5484 372.5484,480 240,480 C107.4516,480 0,372.5484 0,240 C0,107.4516 107.4516,0 240,0 Z M240,88.8 C156.4944,88.8 88.8,156.4944 88.8,240 C88.8,323.5056 156.4944,391.2 240,391.2 C323.5056,391.2 391.2,323.5056 391.2,240 C391.2,156.4944 323.5056,88.8 240,88.8 Z"
									></path>
									<path
										fill="url(#pulse-a)"
										fillRule="evenodd"
										d="M240,0 C372.5484,0 480,107.4516 480,240 C480,372.5484 372.5484,480 240,480 C107.4516,480 0,372.5484 0,240 C0,107.4516 107.4516,0 240,0 Z M240,88.8 C156.4944,88.8 88.8,156.4944 88.8,240 C88.8,323.5056 156.4944,391.2 240,391.2 C323.5056,391.2 391.2,323.5056 391.2,240 C391.2,156.4944 323.5056,88.8 240,88.8 Z"
									></path>
								</g>
							</svg>
							<svg
								className="absolute z-20 top-1/2 left-1/2 blur-2xl transform -translate-x-1/2 -translate-y-1/2"
								width="480"
								height="480"
								viewBox="0 0 480 480"
								xmlns="http://www.w3.org/2000/svg"
							>
								<defs>
									<linearGradient
										id="pulse-a"
										x1="50%"
										x2="50%"
										y1="100%"
										y2="0%"
									>
										<stop
											offset="0%"
											stopColor="#A855F7"
										></stop>
										<stop
											offset="76.382%"
											stopColor="#FAF5FF"
										></stop>
										<stop
											offset="100%"
											stopColor="#6366F1"
										></stop>
									</linearGradient>
								</defs>

								<g
									fillRule="evenodd"
									className="grow-and-fade-delayed"
								>
									<path
										fill="url(#pulse-a)"
										fillRule="evenodd"
										d="M240,0 C372.5484,0 480,107.4516 480,240 C480,372.5484 372.5484,480 240,480 C107.4516,480 0,372.5484 0,240 C0,107.4516 107.4516,0 240,0 Z M240,88.8 C156.4944,88.8 88.8,156.4944 88.8,240 C88.8,323.5056 156.4944,391.2 240,391.2 C323.5056,391.2 391.2,323.5056 391.2,240 C391.2,156.4944 323.5056,88.8 240,88.8 Z"
									></path>
									<path
										fill="url(#pulse-a)"
										fillRule="evenodd"
										d="M240,0 C372.5484,0 480,107.4516 480,240 C480,372.5484 372.5484,480 240,480 C107.4516,480 0,372.5484 0,240 C0,107.4516 107.4516,0 240,0 Z M240,88.8 C156.4944,88.8 88.8,156.4944 88.8,240 C88.8,323.5056 156.4944,391.2 240,391.2 C323.5056,391.2 391.2,323.5056 391.2,240 C391.2,156.4944 323.5056,88.8 240,88.8 Z"
									></path>
									<path
										fill="url(#pulse-a)"
										fillRule="evenodd"
										d="M240,0 C372.5484,0 480,107.4516 480,240 C480,372.5484 372.5484,480 240,480 C107.4516,480 0,372.5484 0,240 C0,107.4516 107.4516,0 240,0 Z M240,88.8 C156.4944,88.8 88.8,156.4944 88.8,240 C88.8,323.5056 156.4944,391.2 240,391.2 C323.5056,391.2 391.2,323.5056 391.2,240 C391.2,156.4944 323.5056,88.8 240,88.8 Z"
									></path>
								</g>
							</svg>
							<svg
								className="absolute z-20 grow-and-fade-delayed-short blur-2xl transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
								width="480"
								height="480"
								viewBox="0 0 480 480"
								xmlns="http://www.w3.org/2000/svg"
							>
								<defs>
									<linearGradient
										id="pulse-a"
										x1="50%"
										x2="50%"
										y1="100%"
										y2="0%"
									>
										<stop
											offset="0%"
											stopColor="#A855F7"
										></stop>
										<stop
											offset="76.382%"
											stopColor="#FAF5FF"
										></stop>
										<stop
											offset="100%"
											stopColor="#6366F1"
										></stop>
									</linearGradient>
								</defs>
								<g
									fillRule="evenodd"
									className="grow-and-fade-delayed-short"
								>
									<path
										className="cbmx5"
										fill="url(#pulse-a)"
										fillRule="evenodd"
										d="M240,0 C372.5484,0 480,107.4516 480,240 C480,372.5484 372.5484,480 240,480 C107.4516,480 0,372.5484 0,240 C0,107.4516 107.4516,0 240,0 Z M240,88.8 C156.4944,88.8 88.8,156.4944 88.8,240 C88.8,323.5056 156.4944,391.2 240,391.2 C323.5056,391.2 391.2,323.5056 391.2,240 C391.2,156.4944 323.5056,88.8 240,88.8 Z"
									></path>
									<path
										fill="url(#pulse-a)"
										fillRule="evenodd"
										d="M240,0 C372.5484,0 480,107.4516 480,240 C480,372.5484 372.5484,480 240,480 C107.4516,480 0,372.5484 0,240 C0,107.4516 107.4516,0 240,0 Z M240,88.8 C156.4944,88.8 88.8,156.4944 88.8,240 C88.8,323.5056 156.4944,391.2 240,391.2 C323.5056,391.2 391.2,323.5056 391.2,240 C391.2,156.4944 323.5056,88.8 240,88.8 Z"
									></path>
									<path
										fill="url(#pulse-a)"
										fillRule="evenodd"
										d="M240,0 C372.5484,0 480,107.4516 480,240 C480,372.5484 372.5484,480 240,480 C107.4516,480 0,372.5484 0,240 C0,107.4516 107.4516,0 240,0 Z M240,88.8 C156.4944,88.8 88.8,156.4944 88.8,240 C88.8,323.5056 156.4944,391.2 240,391.2 C323.5056,391.2 391.2,323.5056 391.2,240 C391.2,156.4944 323.5056,88.8 240,88.8 Z"
									></path>
								</g>
							</svg>
							<div className="absolute z-10 w-full max-h-[500px] overflow-hidden top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ">
								<div className="container mx-auto p-4 overflow-hidden ">
									<div className="grid grid-cols-8 gap-4 animate-slideUp">
										{gridItems.map((_, index) => (
											<div
												key={index}
												className="w-full aspect-square bg-transparent border border-secondary"
											></div>
										))}
									</div>
									<div className="h-4" />
									<div className="grid grid-cols-8 gap-4 animate-slideUp">
										{gridItems.map((_, index) => (
											<div
												key={index}
												className="w-full aspect-square bg-transparent border border-secondary"
											></div>
										))}
									</div>
									<div className="h-4" />
									<div className="grid grid-cols-8 gap-4 animate-slideUp">
										{gridItems.map((_, index) => (
											<div
												key={index}
												className="w-full aspect-square bg-transparent border border-secondary"
											></div>
										))}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
