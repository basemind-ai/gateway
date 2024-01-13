import { useTranslations } from 'next-intl';

const faqs = [
	{
		answer: "No, we don't store any of your user data or requests. Privacy is a priority, so rest assured, 0% of your data is saved on our servers.",
		question: 'Do you save my user data or requests?',
	},
	{
		answer: "Yes, it's secure. With our SDK, storing the key in your app is safe thanks to GRPC encryption. Plus, even if someone accesses the key, they can only use the prompts you configured.",
		question: 'Is it secure to store the BaseMind key in my mobile app?',
	},
	{
		answer: "Definitely! Just contact us and we'll guide you through the implementation process.",
		question: 'Can you help me implement the BaseMind SDK?',
	},
	{
		answer: 'Yes, our system, built with Golang and GRPC, is much faster than a typical custom backend. Plus, our systems can scale with your needs, ensuring efficiency as your app grows.',
		question: 'Are you faster than a custom backend?',
	},
	{
		answer: "No, an OpenAI key isn't necessary. Just sign up, create a key for your app, and manage all AI model billing through BaseMind without exposing your OpenAI key.",
		question: 'Do I need an OpenAI key to use BaseMind?',
	},
	{
		answer: 'Starting with BaseMind is free, and no credit card is required. We provide initial credits worth a dollar for AI model usage, which typically lasts for hundreds to thousands of calls. For production use, we offer customized packages that scale with your needs and fit every stage of your AI journey.',
		question:
			'How much does it cost, and do I need a credit card to start using BaseMind?',
	},
];

export default function FAQSection() {
	const t = useTranslations('landingPage');
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
					{faqs.map((faq, index) => (
						<details
							className="border-b border-b-neutral"
							key={index}
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
