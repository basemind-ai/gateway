import { screen } from '@testing-library/react';
import { render } from 'tests/test-utils';
import { describe, it } from 'vitest';

import { LegalDoc, LegalDocument } from '@/components/legal-doc';

describe('LegalDoc component tests', () => {
	const mockDoc: LegalDocument = {
		Paragraphs: [
			{ content: ['test content', 'este'], title: 'test title 1' },
			{ content: ['tsdd', 'qwqwe'], title: 'test title 2' },
		],
		lastUpdated: 'last updated on 2021-10-10',
		openingParagraphs: [],
		title: 'test title 3',
	};
	it('should render the title', () => {
		render(<LegalDoc doc={mockDoc} />);
		expect(screen.getByText(mockDoc.title)).toBeInTheDocument();
	});
	it('should render the last updated date', () => {
		render(<LegalDoc doc={mockDoc} />);
		expect(screen.getByText(mockDoc.lastUpdated)).toBeInTheDocument();
	});
	it('should render the opening paragraphs', () => {
		render(<LegalDoc doc={mockDoc} />);
		for (const paragraph of mockDoc.openingParagraphs) {
			expect(screen.getByText(paragraph)).toBeInTheDocument();
		}
	});
	it('should render the sections', () => {
		render(<LegalDoc doc={mockDoc} />);
		for (const section of mockDoc.Paragraphs) {
			expect(screen.getByText(section.title)).toBeInTheDocument();
			for (const paragraph of section.content) {
				expect(screen.getByText(paragraph)).toBeInTheDocument();
			}
		}
	});
});
