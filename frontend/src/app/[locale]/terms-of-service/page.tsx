import {
	LegalDocument,
	LegalDocumentView,
} from '@/components/legal-document-view';
import { Footer } from '@/components/static-site/footer';
import { StaticPageHeader } from '@/components/static-site/header';
import { TrackStaticPage } from '@/components/static-site/track-static-page';

export default function TermsOfServicePage() {
	return (
		<div className="w-screen bg-base-100">
			<TrackStaticPage pageName="terms-of-service" />
			<div className="container w-full mx-auto">
				<header>
					<StaticPageHeader />
				</header>
				<main className="pb-20">
					<LegalDocumentView document={termsOfServiceDocument} />
				</main>
				<footer>
					<Footer />
				</footer>
			</div>
		</div>
	);
}

const termsOfServiceDocument: LegalDocument = {
	Paragraphs: [
		{
			content: [
				'These terms and conditions ("Terms") govern your use of BaseMind\'s website located at BaseMind.ai ("Website"). By accessing or using the Website, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please do not continue to use the Website.',
			],
			title: 'Acceptance of Terms',
		},
		{
			content: [
				'We use cookies on the Website in accordance with our Privacy Policy. By using the Website, you consent to the use of cookies as described in the Privacy Policy.',
			],
			title: 'Cookies',
		},
		{
			content: [
				'Unless otherwise stated, all materials on the Website are owned by BaseMind inc and its licensors and are protected by intellectual property laws. You may access the materials for personal use only, subject to the restrictions set forth in these Terms.',
				'You must not republish, sell, rent, or sub-license the materials from the Website; reproduce, duplicate, or copy the materials from the Website; redistribute the content from the Website.',
			],
			title: 'License and Intellectual Property',
		},
		{
			content: [
				'Certain areas of the Website may allow users to post and exchange opinions and information. BaseMind does not filter, edit, publish, or review user-generated content before it is posted. The views and opinions expressed in user-generated content do not necessarily reflect those of BaseMind. BaseMind reserves the right to monitor and remove any inappropriate, offensive, or non-compliant user-generated content.',
				'By posting user-generated content on the Website, you warrant and represent that you have the necessary licenses and consents to post the content; the content does not infringe any intellectual property rights or invade privacy; the content is not defamatory, offensive, indecent, or unlawful; the content will not be used for solicitation, promotion of business, or unlawful activities; and you grant BaseMind a non-exclusive license to use, reproduce, and edit your user-generated content in any form or media.',
			],
			title: 'User-Generated Content',
		},
		{
			content: [
				'Certain organizations may link to our Website without prior written approval, including government agencies, search engines, news organizations, online directory distributors. Other organizations may request approval to link to our Website by contacting us via email. Approved organizations may hyperlink to our Website using our corporate name or URL.',
				"No use of BaseMind's logo or artwork is allowed for linking without a trademark license agreement.",
			],
			title: 'Hyperlinking to Our Content',
		},
		{
			content: [
				'You may not create frames around our web pages without prior approval and written permission.',
			],
			title: 'iFrames',
		},
		{
			content: [
				'We are not responsible for any content that appears on your website. You agree to protect and defend us against any claims arising from your website.',
			],
			title: 'Content Liability',
		},
		{
			content: [
				'We reserve the right to request the removal of any links to our Website. You must immediately remove any links upon our request. We may also amend these Terms and our linking policy at any time.',
			],
			title: 'Reservation of Rights',
		},
		{
			content: [
				'If you find any offensive links on our Website, please inform us, and we will consider your request to remove the links.',
			],
			title: 'Removal of Links',
		},
		{
			content: [
				'We do not guarantee the accuracy, completeness, or availability of the information on the Website. We exclude all representations, warranties, and conditions relating to the Website to the maximum extent permitted by law.',
			],
			title: 'Disclaimer',
		},
		{
			content: [
				'Users are responsible for their account activities and must use the Website and services as intended. Misuse or exploitative usage may result in account suspension or termination.',
			],
			title: "Users' Responsibilities",
		},
		{
			content: [
				"We offer subscription services with terms provided at the time of purchase. Cancellation procedures can be found in the user's account settings.",
			],
			title: 'Payment Terms',
		},
		{
			content: [
				'We reserve the right to suspend or terminate user accounts for suspected misuse or exploitation of our site or services.',
			],
			title: 'Account Termination or Suspension',
		},
		{
			content: [
				'We respect your privacy and protect your personal data in accordance with our Privacy Policy, available at www.basemind.ai/privacy-policy.',
			],
			title: 'Data Protection and Privacy',
		},
		{
			content: [
				'Any disputes related to the Website or services will be governed by the laws of Israel or Delaware. Claims for events that occurred more than six months ago or more than a year ago (for certain claims) are not permitted.',
			],
			title: 'Dispute Resolution and Governing Law',
		},
		{
			content: [
				'We may amend these Terms of Service at our discretion without notice. Continued use of the Website after any changes constitutes acceptance of the revised Terms.',
			],
			title: 'Changes to Terms',
		},
		{
			content: [
				'For hyperlinking requests or any questions or comments about these Terms of Service, please email us at tom@basemind.ai.',
			],
			title: 'Contact Us',
		},
	],
	lastUpdated: 'Last updated on November, 16, 2023',
	openingParagraphs: [
		"Welcome to BaseMind. We are thrilled to have you explore our website located at https://basemind.ai/. Before you dive into our services, it’s important for us to clarify the rules and guidelines governing your use of our website. These Terms and Conditions serve as a legal agreement between you and BaseMind, outlining your rights and responsibilities as a user of our website. By accessing or using BaseMind's website, you acknowledge and agree to these Terms. If you do not agree with any part of these Terms, we respectfully ask that you do not use our website. We have crafted these Terms to ensure a safe, reliable, and respectful environment for all our users.",
	],
	title: 'Terms and Conditions',
};
