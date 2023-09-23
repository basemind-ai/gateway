'use client';

import { useEffect } from 'react';

export function PrelineComponentWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	useEffect(() => {
		// @ts-expect-error, no types available
		import('preline');
	}, []);

	return <>{children}</>;
}
