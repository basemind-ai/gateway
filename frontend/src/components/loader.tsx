'use client';
import Lottie from 'lottie-react';

import tigerShooting from '@/../public/images/tiger-shooting.json';

export function LottieLoader() {
	return (
		<div
			className={`flex flex-col justify-center items-center m-auto max-w-xl`}
		>
			<Lottie
				animationData={tigerShooting}
				className="flex justify-center items-center aspect-square"
				loop={true}
			/>
		</div>
	);
}
