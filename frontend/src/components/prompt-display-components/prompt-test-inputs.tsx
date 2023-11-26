import { useTranslations } from 'next-intl';

import { CardHeaderWithTooltip } from '@/components/card-header-with-tooltip';
import { handleChange } from '@/utils/events';

export function PromptTestInputs({
	expectedVariables,
	setTemplateVariables,
	templateVariables,
}: {
	expectedVariables: string[];
	setTemplateVariables: (variables: Record<string, string>) => void;
	templateVariables: Record<string, string>;
}) {
	const t = useTranslations('createConfigWizard');

	return (
		<div data-testid="test-inputs-container">
			<CardHeaderWithTooltip
				headerText={t('variables')}
				tooltipText={t('variablesTooltip')}
				dataTestId="test-inputs-header"
			/>
			<div className="rounded-data-card grid grid-cols-2 gap-4 min-w-[50%]">
				{expectedVariables.map((variable) => (
					<div key={variable} className="form-control">
						<input
							type="text"
							className="input input-secondary input-sm w-96 placeholder-accent"
							data-testid={`input-variable-input-${variable}`}
							value={templateVariables[variable]}
							placeholder={`{${variable}}`}
							onChange={handleChange((value: string) => {
								setTemplateVariables({
									...templateVariables,
									[variable]: value,
								});
							})}
						/>
					</div>
				))}
			</div>
		</div>
	);
}
