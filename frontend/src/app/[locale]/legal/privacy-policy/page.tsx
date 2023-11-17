import { LegalDocumentView } from '@/components/legal-document-view';
import { Footer } from '@/components/marketing-site/footer';
import { LandingPageHeader } from '@/components/marketing-site/header';
import { PrivacyPolicyDoc } from '@/constants/legal';

export default function PrivacyPolicyPage() {
	return (
		<div className="w-screen bg-base-100">
			<div className="container w-full mx-auto">
				<header>
					<LandingPageHeader />
				</header>
				<main className="pb-20">
					<LegalDocumentView document={PrivacyPolicyDoc} />
				</main>
				<footer>
					<Footer />
				</footer>
			</div>
		</div>
	);
}
