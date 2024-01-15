import { unstable_setRequestLocale } from 'next-intl/server';

import {
	LegalDocument,
	LegalDocumentView,
} from '@/components/legal-document-view';
import { Footer } from '@/components/static-site/footer';
import { StaticPageHeader } from '@/components/static-site/header';
import { TrackStaticPage } from '@/components/static-site/track-static-page';

export default function PrivacyPolicyPage({
	params: { locale },
}: {
	params: { locale: string };
}) {
	unstable_setRequestLocale(locale);
	return (
		<div className="w-screen bg-base-100">
			<TrackStaticPage pageName="privacy_policy" />
			<div className="container w-full mx-auto">
				<header>
					<StaticPageHeader />
				</header>
				<main className="pb-20">
					<LegalDocumentView document={privacyPolicyDocument} />
				</main>
				<footer>
					<Footer />
				</footer>
			</div>
		</div>
	);
}

const privacyPolicyDocument: LegalDocument = {
	Paragraphs: [
		{
			content: [
				'By using our website, app, SDKs, or APIs, you consent to our Privacy Policy and its terms.',
			],
			title: 'Consent',
		},
		{
			content: [
				'We collect various types of personal data during your interactions with our website, app, SDKs, and APIs. The purpose for collecting personal data will be clearly stated at the time of collection.',
				'Direct Contact: If you contact us, we may receive details like your name, email address, phone number, message contents, attachments, and other information you provide.',
				'Account Registration: For account creation, we may ask for your contact details, including name, company name, address, email address, and phone number.',
			],
			title: 'Data Collection',
		},
		{
			content: [
				'We use your data for several purposes:',
				'Operate, maintain, and improve our website, app, SDKs, and APIs.',
				'Develop new products, services, and features.',
				'Understand and analyze your use of our services.',
				'Communicate with you for customer service, updates, marketing, and promotions.',
				'Prevent fraud.',
			],
			title: 'Data Utilization',
		},
		{
			content: [
				'We use log files to document visitors, collecting data like IP addresses, browser types, ISPs, and time stamps. This information is used for trend analysis, site administration, and user movement tracking.',
			],
			title: 'Log Files',
		},
		{
			content: [
				"Cookies store data about visitors' preferences and website visits, enhancing user experience by tailoring our content to your browser type and other information.",
			],
			title: 'Cookies and Web Beacons',
		},
		{
			content: [
				'We employ third-party services for analytics, user interaction analysis, data storage, and payment processing. These include Google Analytics, Mixpanel, Google Cloud, and Stripe. Payment details are managed by Stripe and are not stored by us.',
			],
			title: 'Third-Party Services',
		},
		{
			content: [
				'We retain personal data as long as necessary for providing our services and for legitimate legal or business purposes.',
			],
			title: 'Data Retention',
		},
		{
			content: [
				'We adopt measures to prevent unauthorized access, alteration, disclosure, or destruction of your personal information. However, no method is 100% secure.',
			],
			title: 'Security Measures',
		},
		{
			content: [
				'In case of a data breach, we will notify affected users and authorities within 72 hours, with details and mitigation strategies.',
			],
			title: 'Data Breach Procedures',
		},
		{
			content: [
				'Data may be processed outside your country, and we ensure it receives the same level of protection.',
			],
			title: 'International Data Transfers',
		},
		{
			content: [
				"Our services are not targeted at children under 18, and we don't knowingly collect information from them without parental consent.",
			],
			title: "Children's Information",
		},
		{
			content: [
				'We may periodically update this policy, with changes communicated via email or in-app notifications.',
			],
			title: 'Changes to This Privacy Policy',
		},
		{
			content: [
				'For inquiries or suggestions about our Privacy Policy, contact us at Tom@basemind.ai.',
			],
			title: 'Contact Us',
		},
		{
			content: [
				'We respect your rights under the CCPA and GDPR. Exercise your rights, including data erasure, by contacting our Data Protection Officer at Tom@basemind.ai.',
			],
			title: 'CCPA and GDPR Rights',
		},
		{
			content: [
				'You can opt out of marketing communications through the unsubscribe instructions in emails or on our opt-out page.',
			],
			title: 'Opt-Out Options',
		},
		{
			content: [
				'Our policy applies only to our website, app, SDKs, and APIs. We are not responsible for the privacy practices of third-party websites.',
			],
			title: 'Links to Other Websites',
		},
	],
	lastUpdated: 'Last updated on November, 16, 2023',
	openingParagraphs: [
		'Welcome to BaseMind, accessible at https://basemind.ai/. At BaseMind, we are deeply committed to respecting and protecting your privacy and personal data. This Privacy Policy applies to all interactions you may have with our website, app, SDKs, and APIs. It’s designed to help you understand how we collect, use, and safeguard the information you provide us during your use of our services.',
		'We believe in transparency and want to ensure that your experience with BaseMind is both informed and secure. Our privacy practices are structured to provide a high standard of protection for your personal data, in compliance with global privacy laws and regulations. Whether you are a new visitor or a returning user, we encourage you to read and understand our practices regarding your personal data.',
		'This policy outlines our data handling procedures and describes your rights and how you can exercise them. By accessing or using our platform, you agree to the practices and terms described in this policy. If you have any questions or concerns about our use of your personal information, please contact us at the provided contact details.',
	],
	title: 'Privacy Policy',
};
