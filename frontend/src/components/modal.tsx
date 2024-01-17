import { useClickAway } from '@uidotdev/usehooks';
import { LegacyRef, useEffect, useRef } from 'react';

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
	const clickAwayRef = useClickAway(() => {
		dialogRef.current?.close();
		onClose?.();
	});

	useEffect(() => {
		if (modalOpen) {
			dialogRef.current?.showModal();
			onOpen?.();
		} else {
			dialogRef.current?.close();
			onClose?.();
		}
	}, [onOpen, onClose, modalOpen]);

	return (
		<div ref={clickAwayRef as LegacyRef<HTMLDivElement>}>
			<dialog ref={dialogRef} className="modal" data-testid={dataTestId}>
				<div
					className="dialog-box bg-base-300"
					data-testid="modal-content"
				>
					{children}
				</div>
				<form method="dialog" className="modal-backdrop">
					<button />
				</form>
			</dialog>
		</div>
	);
}
