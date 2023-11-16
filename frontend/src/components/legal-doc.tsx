import { LegalDocument } from '@/types';

export function LegalDoc({ doc }: { doc: LegalDocument }) {
	return (
		<>
			<div className="relative mx-auto max-w-sm py-16 text-center">
				<h1 className="text-4xl text-base-content font-bold tracking-tight sm:text-5xl">
					{doc.title}
				</h1>
				<p className="mt-4 leading-7 text-base-content/80 ">
					{doc.lastUpdated}
				</p>
			</div>
			<div className="relative px-4 sm:px-6 lg:px-8">
				<div className="mx-auto  prose prose-sm text-neutral-content">
					{doc.openingParagraphs.map(
						(openingParagraph, indexOpening) => (
							<p key={`openingParagraph${indexOpening}`}>
								{openingParagraph}
							</p>
						),
					)}
					{doc.Paragraphs.map((section, indexParg) => (
						<>
							<h2 key={section.title + indexParg}>
								{section.title}
							</h2>
							{section.content.map((paragraph, indexSection) => (
								<p
									key={`${indexParg} section.title ${indexSection}`}
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
