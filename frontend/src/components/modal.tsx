import { useEffect, useRef } from 'react';

export function Modal({
	children,
	modalOpen,
	onOpen,
	onClose,
	dataTestId = 'dialog-modal',
}: {
	children: React.ReactNode;
	dataTestId?: string;
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
		<dialog ref={dialogRef} className="modal" data-testid={dataTestId}>
			<div className="dialog-box" data-testid="modal-content">
				{children}
			</div>
			<form method="dialog" className="modal-backdrop">
				<button />
			</form>
		</dialog>
	);
}
