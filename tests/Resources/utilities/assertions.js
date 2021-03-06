'use strict';
/* globals OS_ANDROID,OS_IOS */
const should = require('should');
const utilities = require('./utilities');
const isIOSDevice = OS_IOS && !Ti.Platform.model.includes('(Simulator)');

// use pngjs and pixelmatch!
const zlib = require('browserify-zlib');
global.binding.register('zlib', zlib);
const PNG = require('pngjs').PNG;
const cgbiToPng = isIOSDevice ? require('cgbi-to-png') : { revert: (buf) => buf };
const pixelmatch = require('pixelmatch');

// Copied from newer should.js
// Verifies the descriptor for an own property on a target
should.Assertion.add('ownPropertyWithDescriptor', function (name, desc) {
	this.params = { actual: this.obj, operator: 'to have own property `' + name + '` with descriptor ' + JSON.stringify(desc) };

	// descriptors do have default values! If not specified, they're treated as false
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptor
	const keys = [ 'writable', 'configurable', 'enumerable' ];
	const descriptor = Object.getOwnPropertyDescriptor(Object(this.obj), name);

	for (let key in keys) {
		const expected = (desc[key] || false);
		const actual = (descriptor[key] || false);
		if (expected !== actual) {
			should.fail(`Expected ${name}.${key} = ${expected}`);
		}
	}
}, false);

// Finds a property up the prototype chain with a given descriptor
should.Assertion.add('propertyWithDescriptor', function (propName, desc) {
	var target = this.obj;
	this.params = { actual: this.obj, operator: 'to have property `' + propName + '` with descriptor ' + JSON.stringify(desc) };
	if (this.obj.apiName) {
		this.params.obj = this.obj.apiName;
	}

	// first let's see if we can find the property up the prototype chain...
	// need to call hasOwnProperty in a funky way due to https://jira.appcelerator.org/browse/TIMOB-23504
	while (!Object.prototype.hasOwnProperty.call(target, propName)) {
		target = Object.getPrototypeOf(target); // go up the prototype chain
		if (!target) {
			should.fail(`Unable to find property ${propName} up the prototype chain!`);
			break;
		}
	}

	// Now verify the property descriptor for it
	should(target).have.ownPropertyWithDescriptor(propName, desc);
}, false);

/**
 * Use this to test for read-only, non-configurable properties on an Object. We
 * will look up the prototype chain to find the owner of the property.
 *
 * @param {String} propName     Name of the property to test for.
 */
should.Assertion.add('readOnlyProperty', function (propName) {
	this.params = { operator: `to have a read-only property with name: ${propName}` };
	if (this.obj.apiName) {
		this.params.obj = this.obj.apiName;
	}

	// Now verify the property descriptor for it
	const props = { writable: false };
	// FIXME read-only properties should also be non-configurable on iOS and Windows (JSC)!
	if (!utilities.isIOS() && !utilities.isWindows()) {
		props.configurable = false;
	}
	this.have.propertyWithDescriptor(propName, props);

	// lastly swap over to the property itself (on our original object)
	this.have.property(propName);
}, false);

// Is this needed? Why not just test for 'property'?
should.Assertion.add('readWriteProperty', function (propName) {
	this.params = { operator: `to have a read-write property with name: ${propName}` };
	if (this.obj.apiName) {
		this.params.obj = this.obj.apiName;
	}

	// Now verify the property descriptor for it
	const props = {
		writable: true,
		enumerable: true,
		configurable: true,
	};
	this.have.propertyWithDescriptor(propName, props);

	// lastly swap over to the property itself (on our original object)
	this.have.property(propName);
}, false);

// TODO Do we need to distinguish between constant and readOnlyproperty?
should.Assertion.alias('readOnlyProperty', 'constant');

should.Assertion.add('enumeration', function (type, names) {
	this.params = { operator: `to have a set of enumerated constants with names: ${names}` };
	if (this.obj.apiName) {
		this.params.obj = this.obj.apiName;
	}

	for (let i = 0; i < names.length; i++) {
		should(this.obj).have.constant(names[i]).which.is.a[type](); // eslint-disable-line no-unused-expressions
	}
}, false);

/**
 * @param {Ti.Blob} blob binary data to write
 * @param {string} imageFilePath relative file path to save image under
 * @returns {Ti.Filesystem.File}
 */
function saveImage(blob, imageFilePath) {
	const file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, imageFilePath);
	if (!file.parent.exists()) {
		file.parent.createDirectory();
	}
	file.write(blob);
	return file;
}

/**
 * @param {string|Ti.Blob} imageFilePath path to imeg file on disk (relative), or an in-memory Ti.Blob instance (holding an image)
 * @param {Number} [threshold=0.1] threshold for comparing images
 */
should.Assertion.add('matchImage', function (imageFilePath, threshold = 0.1) {
	let isBlob = false;
	if (imageFilePath.apiName && imageFilePath.apiName === 'Ti.Blob') {
		isBlob = true;
		this.params = { operator: 'view to match Ti.Blob' };
	} else {
		this.params = { operator: `view to match snapshot image: ${imageFilePath}` };
	}
	if (this.obj.apiName) {
		this.params.obj = this.obj.apiName;
	}

	this.obj.should.have.property('toImage').which.is.a.Function();
	const view = this.obj;
	const actualBlob = view.toImage();
	const timestamp = Date.now();
	let expectedBlob;
	if (isBlob) {
		expectedBlob = imageFilePath;
		// save any generated image to a made up path
		imageFilePath = `snapshots/${timestamp}.png`;
	} else {
		const snapshot = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, imageFilePath);
		if (!snapshot.exists()) {
			// No snapshot. Generate one, then fail test
			const file = saveImage(actualBlob, imageFilePath);
			console.log(`!IMAGE: {"path":"${file.nativePath}","platform":"${OS_ANDROID ? 'android' : 'ios'}","relativePath":"${imageFilePath}"}`);
			this.fail(`No snapshot image to compare for platform "${OS_ANDROID ? 'android' : 'ios'}": ${imageFilePath}\nGenerated image at ${file.nativePath}`);
			return;
		}
		expectedBlob = snapshot.read();
	}

	// Compare versus existing image
	try {
		should(actualBlob.width).equal(expectedBlob.width, 'width');
		should(actualBlob.height).equal(expectedBlob.height, 'height');
		should(actualBlob.size).equal(expectedBlob.size, 'size');
	} catch (e) {
		// assume we failed some assertion, let's try and save the image for reference!
		// The wrapping script should basically generate a "diffs" folder with actual vs expected PNGs in subdirectories
		const file = saveImage(actualBlob, imageFilePath);
		console.log(`!IMG_DIFF: {"path":"${file.nativePath}","platform":"${OS_ANDROID ? 'android' : 'ios'}","relativePath":"${imageFilePath}"}`);
		throw e;
	}

	// Need to create a Buffer around the contents of each image!
	const expectedBuffer = Buffer.from(expectedBlob.toArrayBuffer());
	const expectedImg = PNG.sync.read(cgbiToPng.revert(expectedBuffer));

	const actualBuffer = Buffer.from(actualBlob.toArrayBuffer());
	const actualImg = PNG.sync.read(cgbiToPng.revert(actualBuffer));

	const { width, height } = actualImg;
	const diff = new PNG({ width, height });
	const pixelsDiff = pixelmatch(actualImg.data, expectedImg.data, diff.data, width, height, { threshold });
	// TODO: I don't see how, but if we're negated - ideally we'd save the images if diff === 0. `this.negate` is always false here...
	if (pixelsDiff !== 0) {
		const file = saveImage(actualBlob, imageFilePath); // save "actual"
		if (isBlob) {
			console.log(`!IMAGE: {"path":"${file.nativePath}","platform":"${OS_ANDROID ? 'android' : 'ios'}","relativePath":"${imageFilePath}"}`);
			// If we're comparing against a blob, let's save something to disk to look at
			// Save expected blob
			const expectedPath = `snapshots/${timestamp}/expected.png`;
			saveImage(expectedBlob, expectedPath);
		}
		// Save diff image!
		const diffBuffer = PNG.sync.write(diff);
		const diffFilePath = imageFilePath.slice(0, -4) + '_diff.png';
		saveImage(diffBuffer.toTiBuffer().toBlob(), diffFilePath); // TODO Pass along path to diff file?
		console.log(`!IMG_DIFF: {"path":"${file.nativePath}","platform":"${OS_ANDROID ? 'android' : 'ios'}","relativePath":"${imageFilePath}","blob":${isBlob}}`);
		this.fail(`Image ${imageFilePath} failed to match, had ${pixelsDiff} differing pixels. View actual/expected/diff images to compare manually.`);
	}
}, false);

// TODO Add an assertion for "exclusive" group of constants: A set of constants whose values must be unique (basically an enum), i.e. Ti.UI.FILL vs SIZE vs UNKNOWN
// TODO Use more custom assertions for things like color properties?
module.exports = should;
