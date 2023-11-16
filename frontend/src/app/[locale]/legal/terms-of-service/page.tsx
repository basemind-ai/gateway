import { LegalDoc } from '@/components/legal-doc';
import { Footer } from '@/components/marketing-site/footer';
import { LandingPageHeader } from '@/components/marketing-site/header';
import { TermsOfServiceDoc } from '@/constants/legal';

export default function TermsOfServicePage() {
	return (
		<div className="w-screen bg-base-100">
			<div className="container w-full mx-auto">
				<header>
					<LandingPageHeader />
				</header>
				<main className="pb-20">
					<LegalDoc doc={TermsOfServiceDoc} />
				</main>
				<footer>
					<Footer />
				</footer>
			</div>
		</div>
	);
}
