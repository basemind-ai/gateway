import { OpenAIPromptMessage } from '@/types';

export const curlyBracketsRe = /{([^}]+)}/g;
export function extractTemplateVariables(messageContent: string) {
	return (
		messageContent
			.match(curlyBracketsRe)
			?.map((value) => value.replaceAll(/[{}]/g, '')) ?? []
	);
}

export function updateTemplateVariablesRecord(
	messages: OpenAIPromptMessage[],
	existingTemplateVariables: Record<string, string>,
): Record<string, string> {
	const updatedVariables: Record<string, string> = {};
	new Set(
		messages.flatMap(({ content }) => extractTemplateVariables(content)),
	).forEach((variable) => {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		updatedVariables[variable] = existingTemplateVariables[variable] ?? '';
	});

	return updatedVariables;
}
