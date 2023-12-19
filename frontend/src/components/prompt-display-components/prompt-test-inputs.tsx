import { handleChange } from '@/utils/events';

export function PromptTestInputs({
	expectedVariables,
	setTemplateVariables,
	templateVariables,
}: {
	expectedVariables: string[];
	setTemplateVariables: (variables: Record<string, string>) => void;
	templateVariables: Record<string, string | undefined>;
}) {
	return (
		<div data-testid="test-inputs-container">
			<div className="grid grid-cols-2 gap-4 min-w-[50%]">
				{expectedVariables.map((variable) => (
					<div key={variable} className="form-control">
						<input
							type="text"
							className="card-textarea textarea-info bg-neutral placeholder-info"
							data-testid={`input-variable-input-${variable}`}
							value={templateVariables[variable] ?? ''}
							placeholder={`{${variable}}`}
							onChange={handleChange((value: string) => {
								setTemplateVariables({
									...(templateVariables as Record<
										string,
										string
									>),
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
