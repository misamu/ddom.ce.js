/*!
 * DDom.js customEvent extension
 * https://github.com/misamu/ddom.ce.js
 *
 * Licence: MIT
 */

'use strict'; // jshint ignore:line

(function(/*Window*/window) {
	if (window.$DDom === null) {
		throw new Error('$DDom::ce - $DDom has not been defined');
	}

	/**
	 * @type {DDom}
	 */
	const doc = window.$DDom(document);

	if (!doc.isDDom) {
		throw new Error('$DDom::ce - $DDom is not instance of DDom');
	}

	/**
	 * @example {
	 *		ddom: {
	 *			ddom-first: Array.<Function>,
	 *			ddom-second: Array.<Function>
	 *		}
	 *		my: {
	 *			my-first: Array.<Function>,
	 *			my-second: Array.<Function>
	 *		}
	 * }
	 * @type {Object.<Object.<Object.<Array>>>}
	 */
	const ceEvents = Object.create(null);

	/**
	 * @see ceEvents
	 * @type {Object.<Object.<Object.<Array>>>}
	 */
	const ceEventsOnce = Object.create(null);

	/**
	 * Bind ce events first level
	 * @param {string} ceEventType
	 */
	function bindType(ceEventType) {
		// Set namespace for ceEvents and ceEventsOnce
		ceEvents[ceEventType] = Object.create(null);
		ceEventsOnce[ceEventType] = Object.create(null);

		// Bind event listener to type
		doc.eventBind(ceEventType, function(ceEvents, ceEventsOnce, event) {
			let events = ceEvents[this] || Object.create(null),
					eventsOnce = ceEventsOnce[this] || Object.create(null),
					ceName = event.detail[0],
					args = event.detail;

			// Replace first element ceName with Event object
			args[0] = event;

			// After triggering once delete the item
			if (typeof eventsOnce[ceName] === 'object') {
				for(let x = 0; x < eventsOnce[ceName].length; x++) {
					eventsOnce[ceName][x].apply(null, args);
				}

				delete eventsOnce[ceName];
			}

			// Bound to be triggered events
			if (typeof events[ceName] === 'object') {
				for (let x = 0; x < events[ceName].length; x++) {
					events[ceName][x].apply(null, args);
				}
			}

			return false;
		}.bind(ceEventType, ceEvents, ceEventsOnce));
	}

	/**
	 * Check that listener namespace exists and if not then create
	 * @param {string} ceName
	 * @return {string}
	 */
	function bindTypeCheck(ceName) {
		const index = ceName.indexOf('-'),
				ceEventType = (index === -1) ? 'DDomCE' : ceName.substring(0, index);

		// create new listener to namespace if does not exist
		if (ceEvents[ceEventType] === undefined) {
			bindType(ceEventType);
		}

		return ceEventType;
	}

	/**
	 * Remove event listener
	 * @param {Object} eventSpace
	 * @param {string} ceEventType
	 * @param {string} ceName
	 * @param {Function} callback
	 */
	function removeEvent(eventSpace, ceEventType, ceName, callback) {
		let index;

		const handler = eventSpace[ceEventType][ceName] || [];

		while ((index = handler.indexOf(callback)) !== -1) {
			handler.splice(index, 1);
		}

		if (handler.length === 0) {
			delete eventSpace[ceEventType][ceName];

			if (Object.keys(eventSpace[ceEventType]).length === 0) {
				delete eventSpace[ceEventType];
			}
		}
	}

	/**
	 * Bind custom event callback to queue
	 * @param {string|Array<string>} ceName
	 * @param {Function} callback
	 * @param {boolean} [fifo=true] by default first in first out but can be changed to lifo (last in first out)
	 */
	$DDom.ceBind = function(ceName, callback, fifo) {
		const ceNames = (Array.isArray(ceName)) ? ceName : [ceName];

		for (let ceName of ceNames) {
			const ceEventType = bindTypeCheck(ceName);

			if (typeof callback !== "function") {
				throw new Error("$DDom::ceBind callback not defined");
			}

			const handler = ceEvents[ceEventType][ceName] = ceEvents[ceEventType][ceName] || [];

			// CustomEvents work in FIFO if not defined otherwise
			if (fifo === false) {
				handler.unshift(callback);
			} else {
				handler.push(callback);
			}
		}
	};

	/**
	 * Bind custom event callback to queue
	 * @param {string} ceName
	 * @param {Function} callback
	 * @param {boolean} [fifo=true] by default first in first out but can be changed to lifo (last in first out)
	 */
	$DDom.ceBindOnce = function(ceName, callback, fifo) {
		const ceEventType = bindTypeCheck(ceName);

		if (typeof callback !== "function") {
			throw new Error("$DDom::ceBindOnce callback not defined");
		}

		const handler = ceEventsOnce[ceEventType][ceName] = ceEventsOnce[ceEventType][ceName] || [];

		// CustomEvents work in FIFO if not defined otherwise
		if (fifo === false) {
			handler.unshift(callback);
		} else {
			handler.push(callback);
		}
	};

	/**
	 * Bind event if callback does not exist yet
	 * @param {string} ceName
	 * @param {Function} callback
	 * @param {boolean} [fifo=true] by default first in first out but can be changed to lifo (last in first out)
	 */
	$DDom.ceBindUnique = function(ceName, callback, fifo) {
		const ceEventType = bindTypeCheck(ceName);

		if (typeof callback !== "function") {
			throw new Error("$DDom::ceBindUnique callback not defined");
		}

		const handler = ceEvents[ceEventType][ceName] = ceEvents[ceEventType][ceName] || [];

		if (handler.indexOf(callback) === -1) {
			// CustomEvents work in FIFO if not defined otherwise
			if (fifo === false) {
				handler.unshift(callback);
			} else {
				handler.push(callback);
			}
		}
	};

	/**
	 * Remove given customEvent callback from queue
	 * @param {string} ceName
	 * @param {Function} callback
	 */
	$DDom.ceRemove = function(ceName, callback) {
		const ceEventType = bindTypeCheck(ceName);

		if (typeof callback !== "function") {
			throw new Error("$DDom::ceRemove callback not defined");
		}

		// Remove event from events space
		removeEvent(ceEvents, ceEventType, ceName, callback);

		// Remove event from events once space
		removeEvent(ceEventsOnce, ceEventType, ceName, callback);
	};

	/**
	 * Trigger event with ceName
	 * @param {string} ceName
	 * @param {*...} [ar]
	 */
	$DDom.ceTrigger = function(ceName, ar) {
		const args = Array.prototype.slice.call(arguments),
				ceTypeName = bindTypeCheck(ceName);

		doc.trigger(ceTypeName, args);
	};
})(window);

