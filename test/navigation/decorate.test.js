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
		expect(() => subject(clone.navbar_desktop.uk, '')).to.not.throw();
	});

	it('can handle a map of items', () => {
		expect(() => subject(clone.account, '')).to.not.throw();
	});

	it('can handle nested items', () => {
		expect(() => subject(clone.drawer.uk, '')).to.not.throw();
	});

	it('selects the current item based on the given vanity', () => {
		subject(clone.navbar_desktop.uk, '/world');
		expect(clone.navbar_desktop.uk[1].selected).to.be.true;

		subject(clone.drawer.uk, '/world');
		expect(clone.drawer.uk[0][2].item.selected).to.be.true;
	});

	it('selects the current item based on the given path', () => {
		subject(clone.navbar_desktop.uk, '/stream/sectionId/MQ==-U2VjdGlvbnM=');
		expect(clone.navbar_desktop.uk[1].selected).to.be.true;

		subject(clone.drawer.uk, '/world');
		expect(clone.drawer.uk[0][2].item.selected).to.be.true;
	});

	it('ignores query strings in urls when selecting the current item', () => {
		subject(clone.navbar_mobile.uk, '/?edition=international');
		expect(clone.navbar_mobile.uk[0].selected).to.be.true;
	});

	it('replaces any ${currentPath} placeholders with the given path', () => {
		subject(clone.account, '/current-path');
		expect(clone.account.signin.href).to.not.match(/\$\{\w\}/);
		expect(clone.account.signin.href).to.match(/current-path/);

		subject(clone.navbar_right, '/current-path');
		expect(clone.navbar_right.anon[0].href).to.not.match(/\$\{\w\}/);
		expect(clone.navbar_right.anon[0].href).to.match(/current-path/);
	});
});
