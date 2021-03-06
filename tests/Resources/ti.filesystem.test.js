/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

describe('Titanium.Filesystem', () => {
	it('apiName', () => {
		should(Ti.Filesystem).have.readOnlyProperty('apiName').which.is.a.String();
		should(Ti.Filesystem.apiName).be.eql('Ti.Filesystem');
	});

	it('MODE_APPEND', () => {
		should(Ti.Filesystem).have.constant('MODE_APPEND').which.is.a.Number();
	});

	it('MODE_READ', () => {
		should(Ti.Filesystem).have.constant('MODE_READ').which.is.a.Number();
	});

	it('MODE_WRITE', () => {
		should(Ti.Filesystem).have.constant('MODE_WRITE').which.is.a.Number();
	});

	// Android doesn't support Ti.Filesystem.applicationDirectory
	it.androidMissing('applicationDirectory', () => {
		should(Ti.Filesystem).have.readOnlyProperty('applicationDirectory').which.is.a.String();
	});

	it('applicationDataDirectory', () => {
		should(Ti.Filesystem).have.readOnlyProperty('applicationDataDirectory').which.is.a.String();
	});

	it('resourcesDirectory', () => {
		should(Ti.Filesystem).have.readOnlyProperty('resourcesDirectory').which.is.a.String();
	});

	it.android('resRawDirectory', () => {
		should(Ti.Filesystem).have.readOnlyProperty('resRawDirectory').which.is.a.String();
	});

	// On Windows Runtime, applicationSupportDirectory may return null if app doesn't have permission
	// although it should not throw exception
	it.androidMissing('applicationSupportDirectory', () => {
		should(Ti.Filesystem.applicationSupportDirectory).not.be.undefined();
		should(Ti.Filesystem).have.a.readOnlyProperty('applicationSupportDirectory').which.is.a.String();
	});

	// On Windows Runtime, externalStorageDirectory may return null if app doesn't have permission
	// although it should not throw exception
	it.iosMissing('externalStorageDirectory', () => {
		should(Ti.Filesystem.externalStorageDirectory).not.be.undefined();
		should(Ti.Filesystem).have.a.readOnlyProperty('externalStorageDirectory').which.is.a.String();
	});

	it('applicationCacheDirectory', () => {
		// Windows Store app doesn't support cache directory
		if (utilities.isWindowsDesktop()) {
			should(Ti.Filesystem.applicationCacheDirectory).be.undefined();
		} else {
			should(Ti.Filesystem).have.readOnlyProperty('applicationCacheDirectory').which.is.a.String();
		}
	});

	it('tempDirectory', () => {
		should(Ti.Filesystem).have.readOnlyProperty('tempDirectory').which.is.a.String();
	});

	it('separator', () => {
		should(Ti.Filesystem).have.a.readOnlyProperty('separator').which.is.a.String();
		if (utilities.isWindows()) {
			should(Ti.Filesystem.separator).be.eql('\\');
		} else {
			should(Ti.Filesystem.separator).be.eql('/');
		}
	});

	it('lineEnding', () => {
		should(Ti.Filesystem).have.a.readOnlyProperty('lineEnding').which.is.a.String();
		if (utilities.isWindows()) {
			should(Ti.Filesystem.lineEnding).be.eql('\r\n');
		} else {
			should(Ti.Filesystem.lineEnding).be.eql('\n');
		}
	});

	it('getFile()', () => {
		should(Ti.Filesystem.getFile).be.a.Function();
		const file = Ti.Filesystem.getFile('app.js');
		should(file).be.ok(); // not null or undefined. should(file).not.be.null causes a stack overflow somehow.
	});

	it('openStream()', () => {
		should(Ti.Filesystem.openStream).not.be.undefined();
		should(Ti.Filesystem.openStream).be.a.Function();
		const stream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, 'app.js');
		should(stream).be.ok(); // not null or undefined. should(stream).not.be.null causes a stack overflow somehow.
		stream.close();
	});

	// FIXME Get working on Android. Either exists() or deleteDirectory() is returning false
	it.androidBroken('createTempDirectory()', () => {
		should(Ti.Filesystem.createTempDirectory).not.be.undefined();
		should(Ti.Filesystem.createTempDirectory).be.a.Function();
		const dir = Ti.Filesystem.createTempDirectory();
		should.exist(dir);
		should.exist(dir.name);
		should(dir.exists()).be.true();
		should(dir.deleteDirectory()).be.true();
		should(dir.exists()).be.false();
	});

	// Check if createTempFile exists and make sure it does not throw exception
	it('createTempFile()', () => {
		should(Ti.Filesystem.createTempFile).not.be.undefined();
		should(Ti.Filesystem.createTempFile).be.a.Function();
		const file = Ti.Filesystem.createTempFile();
		should(file).be.ok(); // not null or undefined. should(file).not.; causes a stack overflow somehow.
		should(file.name).be.a.String();
		should(file.exists()).be.true();
		should(file.deleteFile()).be.true();
		should(file.exists()).be.false();
	});

	// TIMOB-10107
	it('multiLingualFilename', () => {
		const msg = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, '網上廣東話輸入法.txt');
		should(msg.write('Appcelerator', true)).be.true();
		should(msg.exists()).be.true();
		should(msg.deleteFile()).be.true();
		should(msg.exists()).be.false();
	});

	// TIMOB-23542 test getAsset()
	it.ios('getAsset()', () => {
		should(Ti.Filesystem.getAsset).not.be.undefined();
		should(Ti.Filesystem.getAsset).be.a.Function();
		const blob = Ti.Filesystem.getAsset('Logo.png');
		should(blob).be.an.Object(); // FIXME: fails on device!
	});

	it('#getFile() should handle files with spaces in path - TIMOB-18765', () => {
		const f = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, '/folder with spaces/comingSoon.html');
		should(f.exists()).be.true();
	});

	// FIXME: Should this work? It is a difference versus how some other file/url resolution works...
	it.allBroken('#getFile() should handle absolute-looking paths by resolving relative to resource dir', () => {
		const f = Ti.Filesystem.getFile('/Logo.png'); // use absolute-looking URL, but actually relative to resources dir!
		should(f.exists()).be.true();
	});
});
