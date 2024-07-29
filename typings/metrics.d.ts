export interface HealthcheckStatus {
	id: string;
	name: string;
	ok: boolean;
	checkOutput: string;
	lastUpdated: Date;
	severity: number;
	panicGuide: string;
	businessImpact: string;
	technicalSummary: string;
}

export type TickingMetric = {
	stop: () => void;
}

export type Healthcheck = {
	getStatus: () => HealthcheckStatus;
};
