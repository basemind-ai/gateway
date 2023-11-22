import dayjs from 'dayjs';
import duration, { DurationUnitType } from 'dayjs/plugin/duration';

dayjs.extend(duration);

export function parseDuration(
	latency: number,
	unit: DurationUnitType = 'milliseconds',
): string {
	latency = Math.abs(latency);

	return `${dayjs.duration(latency, unit).asMilliseconds()} MS`;
}
