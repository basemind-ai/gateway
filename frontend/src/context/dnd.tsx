import {
	DndContext,
	KeyboardSensor as LibKeyboardSensor,
	MouseSensor as LibMouseSensor,
	PointerSensor as LibPointerSensor,
	TouchSensor as LibTouchSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { Props } from '@dnd-kit/core/dist/components/DndContext/DndContext';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type {
	KeyboardEvent,
	MouseEvent,
	PointerEvent,
	TouchEvent,
} from 'react';

/*
 * Logic in this file addresses an issue with dnd-kit where inputs dont work,
 * see: https://github.com/clauderic/dnd-kit/issues/477
 * */

/* c8 ignore start */

function shouldHandleEvent(element: HTMLElement | null) {
	let cur = element;

	while (cur) {
		if (cur.dataset.noDnd) {
			return false;
		}
		cur = cur.parentElement;
	}

	return true;
}
export class MouseSensor extends LibMouseSensor {
	static activators = [
		{
			eventName: 'onMouseDown' as const,
			handler: ({ nativeEvent: event }: MouseEvent) => {
				return shouldHandleEvent(event.target as HTMLElement);
			},
		},
	];
}

export class KeyboardSensor extends LibKeyboardSensor {
	static activators = [
		{
			eventName: 'onKeyDown' as const,
			handler: ({ nativeEvent: event }: KeyboardEvent) => {
				return shouldHandleEvent(event.target as HTMLElement);
			},
		},
	];
}
export class PointerSensor extends LibPointerSensor {
	static activators = [
		{
			eventName: 'onPointerDown' as const,
			handler: ({ nativeEvent: event }: PointerEvent) => {
				return shouldHandleEvent(event.target as HTMLElement);
			},
		},
	];
}

export class TouchSensor extends LibTouchSensor {
	static activators = [
		{
			eventName: 'onTouchStart' as const,
			handler: ({ nativeEvent: event }: TouchEvent) => {
				return shouldHandleEvent(event.target as HTMLElement);
			},
		},
	];
}

export function DnDContext({
	children,
	...props
}: { children: React.ReactNode } & Props) {
	const sensors = useSensors(
		useSensor(MouseSensor),
		useSensor(TouchSensor),
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	return (
		<DndContext sensors={sensors} {...props}>
			{children}
		</DndContext>
	);
}

/* c8 ignore end */
