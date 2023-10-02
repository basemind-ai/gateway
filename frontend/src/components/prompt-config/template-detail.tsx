'use client';

import Image from 'next/image';

import { Dimensions } from '@/constants';

export interface TemplateDetailProps {
	imageSrc: string;
	name: string;
	status: 'active' | 'draft';
}

export function TemplateDetail({
	imageSrc,
	name,
	status,
}: TemplateDetailProps) {
	return (
		<div className="mt-4 bg-base-300 bg-opacity-25 flex justify-center items-center h-12 rounded-lg p-2">
			<div className="ml-8 text-neutral-content flex">
				<Image
					data-testid="login-banner-icon"
					height={Dimensions.Eight}
					width={Dimensions.Eight}
					src={imageSrc}
					alt="provider logo"
				/>

				<span className="pl-2">{name}</span>
				<button className="bg-success text-base-200 px-2 rounded-full ml-2">
					{status}
				</button>
			</div>
		</div>
	);
}
