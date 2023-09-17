'use client';

import { FirebaseLogin } from '@/app/sign-in/firebase-login';
import { LoginBanner } from '@/app/sign-in/login-banner';
import { PrelineComponentWrapper } from '@/client-components/preline-component-wrapper';

export function LoginContainer() {
	return (
		<PrelineComponentWrapper>
			<main
				data-testid="login-container"
				className="h-full w-full flex items-center justify-center bg-base-200"
			>
				<div className="flex max-w-7xl mx-6 xl:mx-0 bg-gray-111 p-12 rounded-xl	gap-8 ">
					<div className="flex-1">
						<FirebaseLogin />
					</div>
					<div className="flex-1 hidden lg:block ">
						<LoginBanner
							imageSrc="/images/pinecone-transparent-bg.svg"
							iconSrc="/images/pinecone-round.svg"
						/>
					</div>
				</div>
			</main>
		</PrelineComponentWrapper>
	);
}
