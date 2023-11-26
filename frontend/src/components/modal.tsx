import { useEffect, useRef } from 'react';

export function Modal({
	children,
	modalOpen,
	onOpen,
	onClose,
}: {
	children: React.ReactNode;
	modalOpen: boolean;
	onClose?: () => void;
	onOpen?: () => void;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		if (modalOpen) {
			dialogRef.current?.showModal();
			onOpen?.();
		} else {
			dialogRef.current?.close();
			onClose?.();
		}
	}, [modalOpen, dialogRef.current]);

	return (
		<dialog ref={dialogRef} className="modal" data-testid="dialog-modal">
			<div className="dialog-box" data-testid="modal-content">
				{children}
			</div>
			<form method="dialog" className="modal-backdrop">
				<button />
			</form>
		</dialog>
	);
}
