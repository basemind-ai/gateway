import { EventHandler, SyntheticEvent } from 'react';
import {
	adjectives,
	animals,
	uniqueNamesGenerator,
} from 'unique-names-generator';

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
