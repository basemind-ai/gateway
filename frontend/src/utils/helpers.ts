import { EventHandler, SyntheticEvent } from 'react';
import {
	adjectives,
	animals,
	uniqueNamesGenerator,
} from 'unique-names-generator';

import { ModelType, OpenAIPromptMessage } from '@/types';

export function handleChange<T = any>(
	cb: (value: any) => void,
	stopPropagation = false,
): EventHandler<SyntheticEvent<T>> {
	return (event: SyntheticEvent<T> & { target: { value: any } }) => {
		event.preventDefault();
		if (stopPropagation) {
			event.stopPropagation();
		}
		cb(event.target.value);
	};
}

export function copyToClipboard(text: string) {
	void navigator.clipboard.writeText(text);
}

export function getCloneName(name: string) {
	return `${uniqueNamesGenerator({
		dictionaries: [adjectives, animals], // colors can be omitted here as not used
	})} clone of ${name}`;
}

export function maxTokensForModelType(modelType: ModelType): string {
	switch (modelType) {
		case ModelType.Gpt35Turbo: {
			return '4096';
		}
		case ModelType.Gpt3516K: {
			return '16384';
		}
		case ModelType.Gpt4: {
			return '8192';
		}
		case ModelType.Gpt432K: {
			return '32768';
		}
	}
}

export function extractVariables(messageContent: string) {
	// Define a regular expression to find matches within curly braces
	const pattern = /{([^}]+)}/g;

	// Use the regular expression to find all matches in the message content
	const matches = messageContent.match(pattern);

	// If matches are found, remove the curly braces and return the variables
	if (matches) {
		return matches.map((variable) => variable.replaceAll(/[{}]/g, ''));
	}
	// Return an empty array if no matches are found
	return [];
}

export function updateTemplateVariablesRecord(
	messages: OpenAIPromptMessage[],
	existingVars: Record<string, string>,
): Record<string, string> {
	const uniqueVariablesFromMessages = new Set<string>(
		messages.flatMap((msg) => extractVariables(msg.content)),
	);
	const updatedVariables: Record<string, string> = {};
	uniqueVariablesFromMessages.forEach((variable) => {
		const hasVariable = Object.prototype.hasOwnProperty.call(
			existingVars,
			variable,
		);
		updatedVariables[variable] = hasVariable ? existingVars[variable] : '';
	});

	return updatedVariables;
}
export function decodeUrlSpaces(str: string): string {
	return str.replaceAll('%20', ' ');
}

export function areArraysEqual(arr1?: string[], arr2?: string[]): boolean {
	if (!arr1 || !arr2 || arr1.length !== arr2.length) {
		return false;
	}
	const sortedArr1 = [...arr1].sort();
	const sortedArr2 = [...arr2].sort();
	return sortedArr1.every((value, index) => value === sortedArr2[index]);
}
export function formatNumber(num: number | undefined) {
	if (num === undefined) {
		return '0.00';
	}
	return num <= 2 ? num.toFixed(2) : num.toString();
}
