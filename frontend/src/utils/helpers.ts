import {
	adjectives,
	animals,
	uniqueNamesGenerator,
} from 'unique-names-generator';

export function copyToClipboard(text: string) {
	void navigator.clipboard.writeText(text);
}

export function getCloneName(name: string) {
	return `${uniqueNamesGenerator({
		dictionaries: [adjectives, animals], // colors can be omitted here as not used
	})} clone of ${name}`;
}
