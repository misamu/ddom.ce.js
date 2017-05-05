(function(/*Window*/window) {
	if (window.$DDom === null) {
		throw new Error('$DDom::ce - $DDom has not been defined');
	}

	/**
	 * @type {DDom}
	 */
	var doc = window.$DDom(document);

	if (!doc.DDom) {
		throw new Error('$DDom::ce - $DDom is not instance of DDom');
	}

	/**
	 * Extend $DDom with the customEvent stuff
	 * @type {$DDom}
	 */
	var ce = window.$DDom;

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
	var ceEvents = {};

	/**
	 * @see ceEvents
	 * @type {Object.<Object.<Object.<Array>>>}
	 */
	var ceEventsOnce = {};

	/**
	 * Bind ce events first level
	 * @param {string} ceEventType
	 */
	function bindType(ceEventType) {
		// Set namespace for ceEvents and ceEventsOnce
		ceEvents[ceEventType] = {};
		ceEventsOnce[ceEventType] = {};

		// Bind event listener to type
		doc.eventBind(ceEventType, function(ceEvents, ceEventsOnce, event, element) {
			var events = ceEvents[this] || {},
				eventsOnce = ceEventsOnce[this] || {},
				ceName = event.detail[0],
				args = event.detail,
				x;

			// Replace first element ceName with Event object
			args[0] = event;

			// After triggering once delete the item
			if (typeof eventsOnce[ceName] === 'object') {
				for(x = 0; x < eventsOnce[ceName].length; x++) {
					eventsOnce[ceName][x].apply(null, args);
				}

				delete eventsOnce[ceName];
			}

			// Bound to be triggered events
			if (typeof events[ceName] === 'object') {
				for(x = 0; x < events[ceName].length; x++) {
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
		var index = ceName.indexOf('-');

		var ceEventType = (index === -1) ? 'DDomCE' : ceName.substring(0, index);

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
		var index;

		var handler = eventSpace[ceEventType][ceName] || [];

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
	 * @param {string} ceName
	 * @param {Function} callback
	 * @param {boolean} [fifo=true] by default first in first out but can be changed to lifo (last in first out)
	 */
	$DDom.ceBind = function(ceName, callback, fifo) {
		var ceEventType = bindTypeCheck(ceName);

		if (typeof callback !== "function") {
			throw new Error("$DDom::ceBind callback not defined");
		}

		var handler = ceEvents[ceEventType][ceName] = ceEvents[ceEventType][ceName] || [];

		// CustomEvents work in FIFO if not defined otherwise
		if (fifo === false) {
			handler.unshift(callback);
		} else {
			handler.push(callback);
		}
	};

	/**
	 * Bind custom event callback to queue
	 * @param {string} ceName
	 * @param {Function} callback
	 * @param {boolean} [fifo=true] by default first in first out but can be changed to lifo (last in first out)
	 */
	$DDom.ceBindOnce = function(ceName, callback, fifo) {
		var ceEventType = bindTypeCheck(ceName);

		if (typeof callback !== "function") {
			throw new Error("$DDom::ceBindOnce callback not defined");
		}

		var handler = ceEventsOnce[ceEventType][ceName] = ceEventsOnce[ceEventType][ceName] || [];

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
		var ceEventType = bindTypeCheck(ceName);

		if (typeof callback !== "function") {
			throw new Error("$DDom::ceBindUnique callback not defined");
		}

		var handler = ceEvents[ceEventType][ceName] = ceEvents[ceEventType][ceName] || [];

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
		var ceEventType = bindTypeCheck(ceName);

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
		var args = Array.prototype.slice.call(arguments);

		var ceTypeName = bindTypeCheck(ceName);

		doc.trigger(ceTypeName, args);
	};
}(window));

