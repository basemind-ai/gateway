declare module '*.svg' {
	import { ComponentType, SVGProps } from 'react';

	const content: ComponentType<SVGProps<SVGElement>>;
	export default content;
}
