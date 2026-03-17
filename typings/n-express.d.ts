import Express from 'express';
import http from 'http';
import https from 'https';
import { cacheHeaders } from '../src/middleware/cache';
import type { Healthcheck } from './metrics';

export type CacheHeaders = typeof cacheHeaders;

export interface Request extends Express.Request {}

export interface Response extends Express.Response, CacheHeaders {
	set(field: any, value?: string | string[]): this;

	unvary: (...args: string[]) => void;
	unvaryAll: (preset?: string) => void;

	// Backwards-compatible uber-camel-cased names
	unVary: unvary;
	unVaryAll: unvaryAll;
}

export interface NextFunction extends Express.NextFunction {}

export type Callback = (
	req: Request,
	res: Response,
	next: NextFunction
) => void;

export interface AppMeta {
	name: string;
	directory: string;
	systemCode: string;
}
export interface AppOptions extends AppMeta {
	healthChecksAppName?: string;
	healthChecks: Healthcheck[];
	demo?: boolean;
	withAnonMiddleware?: boolean;
	withConsent: boolean;
	withBackendAuthentication: boolean;
	withFlags: boolean;
}


export interface AppContainer {
	app: Express.Application;
	meta: AppMeta & {
		description: string;
	};
	addInitPromise: (...items: Promise<any>[]) => number;
}

// TODO Overload Express.Application methods to use NextApplication
export interface NextApplication extends Express.Application {
	listen(
		port?: number,
		callback?: () => void
	): Promise<https.Server | http.Server>;
}

declare function express(options?: Partial<AppOptions>): NextApplication;
declare namespace express {
	declare const json: Express.json;
	declare const Router = Express.Router;
	declare const static: Express.static;
	declare const metrics: unknown;
	declare const flags: flags;
	declare const getAppContainer: getAppContainer;
}
export = express;
