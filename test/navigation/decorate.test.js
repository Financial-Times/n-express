'use strict';

const expect = require('chai').expect;
const fixture = require('../stubs/navigationListData.json');
const subject = require('../../src/navigation/decorate');

describe('Navigation middleware: decorate', () => {
	let clone;

	Object.freeze(fixture);

	beforeEach(() => {
		clone = JSON.parse(JSON.stringify(fixture));
	});

	it('can handle an array of items', () => {
		expect(() => subject(clone.navbar_desktop.uk, 'navbar_desktop', '')).to.not.throw();
	});

	it('can handle a map of items', () => {
		expect(() => subject(clone.account, 'account', '')).to.not.throw();
	});

	it('can handle nested items', () => {
		expect(() => subject(clone.drawer.uk, 'drawer', '')).to.not.throw();
	});

	it('selects the current item based on the given vanity', () => {
		subject(clone.navbar_desktop.uk, 'navbar_desktop', '/world');
		expect(clone.navbar_desktop.uk[1].selected).to.be.true;

		subject(clone.drawer.uk, 'drawer', '/world');
		expect(clone.drawer.uk[0][2].item.selected).to.be.true;
	});

	it('selects the current item based on the given path', () => {
		subject(clone.navbar_desktop.uk, 'navbar_desktop', '/stream/sectionId/MQ==-U2VjdGlvbnM=');
		expect(clone.navbar_desktop.uk[1].selected).to.be.true;

		subject(clone.drawer.uk, 'drawer', '/world');
		expect(clone.drawer.uk[0][2].item.selected).to.be.true;
	});

	it('replaces any ${currentPath} placeholders with the given path', () => {
		subject(clone.account, 'account', '/current-path');
		expect(clone.account.signin.href).to.not.match(/\$\{\w\}/);
		expect(clone.account.signin.href).to.match(/current-path/);

		subject(clone.navbar_right, 'navbar_right', '/current-path');
		expect(clone.navbar_right.anon[0].href).to.not.match(/\$\{\w\}/);
		expect(clone.navbar_right.anon[0].href).to.match(/current-path/);
	});
});
