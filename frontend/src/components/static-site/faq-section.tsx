import { useTranslations } from 'next-intl';

export function FAQSection() {
	const t = useTranslations('landingPage');
	const faqs = [
		{
			answer: t('faqADoYouSaveMyUserData'),
			question: t('faqQDoYouSaveMyUserData'),
		},
		{
			answer: t('faqAIsItSecure'),
			question: t('faqQIsItSecure'),
		},
		{
			answer: t('faqAHelpWithSDK'),
			question: t('faqQHelpWithSDK'),
		},
		{
			answer: t('faqAFasterThanBackend'),
			question: t('faqQFasterThanBackend'),
		},
		{
			answer: t('faqANeedOpenAIKey'),
			question: t('faqQNeedOpenAIKey'),
		},
		{
			answer: t('faqACostToStart'),
			question: t('faqQCostToStart'),
		},
	];

	return (
		<section
			className="z-0 px-8 py-24 sm:py-32 bg-base-200 relative"
			data-testid="landing-page-faq"
		>
			<div className="mx-auto max-w-screen-lg">
				<h2 className="mb-8 text-3xl font-bold tracking-tight gradient-headline sm:text-4xl text-center">
					{t('faqTitle')}
				</h2>
				<div className="grid sm:grid-cols-2">
					{faqs.map((faq) => (
						<details
							className="border-b border-b-neutral"
							key={faq.question}
						>
							<summary className="collapse-title text-md font-normal text-neutral-content hover:text-base-content">
								{faq.question}
							</summary>
							<div className="pb-8 px-12 text-neutral-content hover:text-base-content">
								<p>{faq.answer}</p>
							</div>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}
