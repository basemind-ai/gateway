import { EventHandler, SyntheticEvent } from 'react';

export function handleChange<T = any>(
	cb: (value: any) => void,
	stopPropagation = false,
): EventHandler<SyntheticEvent<T>> {
	return (
		event: SyntheticEvent<T> & {
			target: {
				value: any;
			};
		},
	) => {
		event.preventDefault();
		if (stopPropagation) {
			event.stopPropagation();
		}
		cb(event.target.value);
	};
}
