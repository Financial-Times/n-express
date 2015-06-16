'use strict';
var debug = require('debug')('ft-next-barrier-component');

const BarrierAPITypes = {
	PREMIUM : Symbol("PREMIUM"),
	STANDARD_PLUS : Symbol("STANDARD_PLUS"),
	REGISTER_PLUS : Symbol("REGISTER_PLUS"),
	TRIAL : Symbol("TRIAL")
}

const types = {
	PREMIUM : Symbol.for("PREMIUM"),
	STANDARD_PLUS : Symbol.for("STANDARD_PLUS"),
	REGISTER_PLUS : Symbol.for("REGISTER_PLUS"),
	TRIAL : Symbol.for("TRIAL")
};

const variants = {
	[types.PREMIUM] : {
		PREMIUM_SIMPLE : Symbol('PREMIUM_SIMPLE')
	},
	[types.TRIAL] : {
		TRIAL_SIMPLE : Symbol('TRIAL_SIMPLE'),
		TRIAL_GRID : Symbol('TRIAL_GRID')
	}
};

const barriers = {
	PREMIUM_SIMPLE: Symbol.for('PREMIUM_SIMPLE'),
	TRIAL_SIMPLE: Symbol.for('TRIAL_SIMPLE'),
	TRIAL_GRID : Symbol.for('TRIAL_GRID')
};

module.exports = function getBarrierName(barrier, flags){
	debug('Get barrier for %s with gridTrialBarrier flag %s', barrier, flags.gridTrialBarrier ? 'on' : 'off');
	var barrierSymbol = Symbol.for(barrier);
	if(barrierSymbol === types.TRIAL){
		return flags.gridTrialBarrier ? barriers.TRIAL_GRID : barriers.TRIAL_SIMPLE;
	}

	if(barrierSymbol === types.PREMIUM){
		return barriers.PREMIUM_SIMPLE;
	}
	debug('%s %s', Symbol.keyFor(types.PREMIUM), Symbol.keyFor(barrierSymbol));
	debug(Symbol.keyFor(types.PREMIUM) === Symbol.keyFor(barrierSymbol));
	debug('Failed to get barrier for %s', Symbol.keyFor(barrierSymbol));
};

module.exports.barriers = barriers;
