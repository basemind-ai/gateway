import { Footer } from '@/components/landing-page/footer';
import { LandingPageHeader } from '@/components/landing-page/header';
import { LegalDoc } from '@/components/legal-doc';
import { PrivacyPolicyDoc } from '@/constants/legal';

export default function PrivacyPolicyPage() {
	return (
		<div className="w-screen bg-base-100">
			<div className="container w-full mx-auto">
				<header>
					<LandingPageHeader />
				</header>
				<main className="pb-20">
					<LegalDoc doc={PrivacyPolicyDoc} />
				</main>
				<footer>
					<Footer />
				</footer>
			</div>
		</div>
	);
}
