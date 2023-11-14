export enum ApiVersions {
	V1 = '1',
}

export enum TimeUnit {
	OneHourInSeconds = 3600,
	OneSecondInMilliseconds = 1000,
}

export enum Environment {
	Development = 'development',
	Production = 'production',
	Test = 'test',
}

export enum HttpMethod {
	Delete = 'DELETE',
	Get = 'GET',
	Patch = 'PATCH',
	Post = 'POST',
	Put = 'PUT',
}

export enum DateFormat {
	AMERICAN = 'MM/DD/YYYY',
	CHINESE = 'YYYY/MM/DD',
	ISO = 'DD/MM/YYYY',
}

export const MIN_NAME_LENGTH = 3;
