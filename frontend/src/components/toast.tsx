'use client';

import { useToasts } from '@/stores/toast-store';

export function ToastWrapper({ children }: { children: React.ReactNode }) {
	return (
		<>
			{children}
			<Toast />
		</>
	);
}

export function Toast() {
	const toasts = useToasts();

	return (
		<div data-testid="toast-container" className="toast toast-center">
			{toasts.map(({ type, message }, index) => (
				<div
					key={index + type}
					data-testid={`toast-message-${type}`}
					className={`alert ${type}`}
				>
					{message}
				</div>
			))}
		</div>
	);
}
