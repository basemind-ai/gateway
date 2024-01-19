import { DotLottiePlayer } from '@dotlottie/react-player';

export function LottieLoader() {
	return (
		<div className="flex flex-col justify-center items-center m-auto max-w-xl">
			<DotLottiePlayer
				src="/images/tiger-shooting.lottie"
				autoplay
				loop
			/>
		</div>
	);
}
