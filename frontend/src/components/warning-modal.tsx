import { useTranslations } from 'next-intl';
import { ExclamationTriangle } from 'react-bootstrap-icons';

export function WarningModal({
	warningText,
	closeModal,
	onContinue,
}: {
	closeModal: () => void;
	onContinue: () => void;
	warningText: string;
}) {
	const t = useTranslations('common');

	return (
		<div className="modal modal-open modal-middle sm:modal-middle">
			<div className="modal-box bg-warning">
				<div className="flex justify-between items-center">
					<ExclamationTriangle className="text-warning-content h-6 w-6" />
					<span
						className="text-warning-content"
						data-testid="warning-modal-text"
					>
						{warningText}
					</span>
				</div>
				<div className="modal-action">
					<button
						data-testid="warning-modal-cancel-button"
						className="btn btn-xs btn-info"
						onClick={closeModal}
					>
						<span className="text-warning-content">
							{t('cancel')}
						</span>
					</button>
					<button
						data-testid="warning-modal-continue-button"
						className="btn btn-accent btn-xs"
						onClick={onContinue}
					>
						<span className="text-accent-content">
							{t('continue')}
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}
