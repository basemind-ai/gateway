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
			<div className="flex flex-col gap-5 w-full">
				{expectedVariables.map((variable) => (
					<div key={variable} className="form-control">
						<textarea
							className="card-textarea textarea-accent bg-neutral placeholder-accent w-2/3"
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
