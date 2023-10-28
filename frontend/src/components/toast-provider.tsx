'use client';

import { useToasts } from '@/stores/toast-store';

export function ToastProvider({ children }: { children: React.ReactNode }) {
	return (
		<>
			{children}
			<Toast />
		</>
	);
}

function Toast() {
	const toasts = useToasts();

	return (
		<div data-testid="toast-container" className="toast toast-center">
			{toasts.map(({ type, message }, index) => (
				<div
					key={index}
					data-testid="toast-message"
					className={`alert ${type}`}
				>
					<span>{message}</span>
				</div>
			))}
		</div>
	);
}
