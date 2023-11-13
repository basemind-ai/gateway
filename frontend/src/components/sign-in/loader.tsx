export function Loader() {
	return (
		<div
			data-testid="loader-anim"
			className="m-10 flex justify-center items-center h-full"
		>
			<span
				className="animate-spin inline-block w-6 h-6 border-[4px] border-current border-t-transparent text-primary rounded-full"
				role="status"
				aria-label="loading"
			/>
		</div>
	);
}
