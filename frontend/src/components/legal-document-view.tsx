export interface LegalDocument {
	Paragraphs: { content: string[]; title: string }[];
	lastUpdated: string;
	openingParagraphs: string[];
	title: string;
}

export function LegalDocumentView({ document }: { document: LegalDocument }) {
	return (
		<>
			<div className="relative mx-auto max-w-sm py-16 text-center">
				<h1 className="text-4xl text-base-content font-bold tracking-tight sm:text-5xl">
					{document.title}
				</h1>
				<p className="mt-4 leading-7 text-base-content/80 ">
					{document.lastUpdated}
				</p>
			</div>
			<div className="relative px-4 sm:px-6 lg:px-8">
				<div className="mx-auto  prose prose-sm text-neutral-content">
					{document.openingParagraphs.map(
						(openingParagraph, indexOpening) => (
							<p key={`openingParagraph${indexOpening}`}>
								{openingParagraph}
							</p>
						),
					)}
					{document.Paragraphs.map((section, index) => (
						<>
							<h2 key={section.title + index}>{section.title}</h2>
							{section.content.map((paragraph, indexSection) => (
								<p
									key={`${index} section.title ${indexSection}`}
								>
									{paragraph}
								</p>
							))}
						</>
					))}
				</div>
			</div>
		</>
	);
}
