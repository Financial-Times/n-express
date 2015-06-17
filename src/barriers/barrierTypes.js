'use strict';
var debug = require('debug')('ft-next-barrier-component');
var Symbol = require('es6-symbol');

function symbolFor(name){
	Symbol(name);
	return Symbol.for(name);
}


var types = {
	PREMIUM : symbolFor("PREMIUM"),
	STANDARD_PLUS : symbolFor("STANDARD_PLUS"),
	REGISTER_PLUS : symbolFor("REGISTER_PLUS"),
	TRIAL : symbolFor("TRIAL")
};

var barriers = {
	PREMIUM_SIMPLE: symbolFor('PREMIUM_SIMPLE'),
	TRIAL_SIMPLE: symbolFor('TRIAL_SIMPLE'),
	TRIAL_GRID : symbolFor('TRIAL_GRID')
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
