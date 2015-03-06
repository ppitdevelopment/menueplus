'use strict';
/* Kalender service v.2 */
var KalendSvc = ppitServices.factory('Kalend2', ['Auth', 'Datasource', '$window', function(Auth, Datasource, $window) {
	//console.log("Kalender service v.2 loading.");
	// define the local namespace
	var Kalender = {};
	
	/*
	 * general properties definition
	 */
	// init flag
	Kalender.started = false;
	// currently selected week
	Kalender.currentWoche = 0;
	// today date
	Kalender.today = new Date();
	// monday and sunday dates for current week
	// they should be calculated on every refresh (!!!)
	// they are used to calculate dateranges for requests
	// starting date of the current week
	Kalender.monday = new Date();
	// ending date of the current week
	Kalender.sunday = new Date();
	
	/*
	 * cache related properties
	 */
	// refresh flag
	Kalender.needRefresh = true;
	// number of weeks in both sides we need to cache
	Kalender.cacheSize = 1;
	// left border for cached data always < 0
	Kalender.leftCacheBorder = 0;
	// right border for cached data always > 0
	Kalender.rightCacheBorder = 0;
	// array of weeks
	Kalender.wochen = [];
	// left and right borders of request
	Kalender.requestStart = 0;
	Kalender.requestEnd = 0;
	// cache duration in milliseconds
	Kalender.cacheDuration = 60000;
	// current cache timestamp
	Kalender.cacheTimestamp = Kalender.today.getTime();
	//
	Kalender.cacheRefreshHandler = undefined;
	// precached array of received data
	Kalender.tageRequestResult = [];
	Kalender.detailRequestResult = [];
	
	/*
	 * event handling properties
	 */
	// error code to return to listener
	Kalender.errorCode = 0;
	// registered error handlers
	Kalender.tagErrorHandlers = [];
	Kalender.detailErrorHandlers = [];
	// success handling functions
	Kalender.tagSuccessHandlers = [];
	Kalender.detailSuccessHandlers = [];

	/*
	 * refreshing of current data depending on cacheDuration
	 */
	Kalender.onResume = function() {
		//console.log("Kalender.onResume");
		var currentDate = new Date();
		var currentTime = currentDate.getTime();
		if(currentTime - Kalender.cacheTimestamp > Kalender.cacheDuration) {
			//console.log("Kalender cache expired");
			//alert("Cache expired. Requesting new data.");
			Kalender.needRefresh = true;
			if(Kalender.cacheRefreshHandler != undefined) {
				Kalender.cacheRefreshHandler();
			} else {
				Messages.addMessage("err", undefined, "redirect error!");
			}
		}
		//alert("resume!");
	};
	
	/*
	 * initialization function - redefines all core properties
	 * in case of first run or refresh
	 */
	Kalender.init = function() {
		//console.log("Kalender2.init");
		Kalender.today = new Date();
		// starting date of the week
		Kalender.monday = new Date();
		// ending date of the week
		Kalender.sunday = new Date();
		// calculate shift in days for monday and sunday of current week
		// or next week if today is weekend
		var weekendShift = 0;
		if (Kalender.today.getDay() == 6 || Kalender.today.getDay() == 0) {
			// sunday or saturday
			weekendShift = (Kalender.today.getDay() == 0) ? 1 : 2;
		} else {
			// all other days
			weekendShift = 0 - Kalender.today.getDay() + 1;
		}
		// calculating the starting and finishing dates
		Kalender.monday.setDate(Kalender.monday.getDate() + weekendShift);
		Kalender.sunday.setDate(Kalender.sunday.getDate() + weekendShift + 6);
		// reset properties in the case of refreshing
		Kalender.tagErrorHandlers = [];
		Kalender.detailErrorHandlers = [];
		Kalender.tagSuccessHandlers = [];
		Kalender.detailSuccessHandlers = [];
		Kalender.tageRequestResult = [];
		Kalender.detailRequestResult = [];
		Kalender.wochen = [];
		Kalender.leftCacheBorder = 0;
		Kalender.rightCacheBorder = 0;
		Kalender.requestStart = 0;
		Kalender.requestEnd = 0;
		Kalender.currentWoche = 0;
		Kalender.nachricht_sekretariat = 0;
		// set flags
		Kalender.needRefresh = true;
		// add event listener for wake up of application
		// on mobile devices only once
		if(!Kalender.started)
			$window.document.addEventListener("resume", Kalender.onResume, false);
		Kalender.started = true;
	};
	
	
	/*
	 * main interface function
	 * returns requested week from cache and starts
	 * precaching of next/previous weeks
	 */
	Kalender.getWoche = function(shift) {
		//console.log('Kalender2.getWoche:', shift);
		// if we are trying to get new week - change current index
		// and start caching process, otherwise - return data from cache
		var rShift = shift;
		if(!angular.isNumber(shift)) rShift = 0; 
		if(rShift != Kalender.currentWoche || Kalender.needRefresh) {
			//console.log('Kalender2.getWoche - neue Woche!');
			// set current week index
			Kalender.currentWoche = rShift;
			// request caching
			Kalender.loadCache(rShift);
		}
		if(Kalender.wochen.length > 0) {
			// prepare resulting array
			var res = {};
			// calculate index of the reuested week in cache array
			var wIndex = rShift - Kalender.leftCacheBorder;
			//console.log('Kalender2.getWoche - wIndex:', wIndex);
			//console.log('Kalender2.getWoche - wochen[wIndex]:', Kalender.wochen[wIndex]);
			// copy requested data into resulting array
			res = angular.copy(Kalender.wochen[wIndex]);
			//console.log('Kalender2.getWoche - res:', res);
			// return resulting object
			return res;			
		} else {
			return false;
		}
	};
	
	/*
	 * main caching function
	 * here we calculating the date range to request from server
	 * and desiding if we need requesting or not
	 */
	Kalender.loadCache = function(shift) {
		//console.log('Kalender.loadCache: ', shift);
		// calculate indexes of weeks that are requested
		var leftBorder = shift - Kalender.cacheSize;
		var rightBorder = shift + Kalender.cacheSize;
		//console.log('Kalender.loadCache leftBorder:', leftBorder, ', rightBorder:', rightBorder);
		// check what are already cached
		//console.log('Kalender.loadCache preCached left border: ', Kalender.leftCacheBorder, ', right border: ', Kalender.rightCacheBorder);
		if(Kalender.needRefresh) {
			// refresh of the cache is requested
			Kalender.requestStart = Math.min(leftBorder, 0 - Kalender.cacheSize);
			Kalender.requestEnd = Math.max(rightBorder, 0 + Kalender.cacheSize);
		} else {
			// calculate the borders
			// TODO: this is very simple and ineffective way of calculating borders!
			// we should improve it later! 
			Kalender.requestStart = Math.min(leftBorder, Kalender.leftCacheBorder);
			Kalender.requestEnd = Math.max(rightBorder, Kalender.rightCacheBorder);
		}
		if((Kalender.requestStart != Kalender.leftCacheBorder) || (Kalender.requestEnd != Kalender.rightCacheBorder)) {
			// new request required!
			// calculate dates that should be loaded
			var sDate = new Date();
			var eDate = new Date();
			// calculate real dates for requested week indexes
			var sDateShift = Kalender.monday.getDate() + Kalender.requestStart * 7;
			var eDateShift = Kalender.sunday.getDate() + Kalender.requestEnd * 7;
			//sDate.setMonth(Kalender.monday.getMonth(), sDateShift);
			//eDate.setMonth(Kalender.sunday.getMonth(), eDateShift);
			sDate.setFullYear(Kalender.monday.getFullYear(), Kalender.monday.getMonth(), sDateShift);
			eDate.setFullYear(Kalender.sunday.getFullYear(), Kalender.sunday.getMonth(), eDateShift);
			//console.log('Kalender.loadCache monday:', Kalender.monday, ', sunday:', Kalender.sunday );
			//console.log('Kalender.loadCache sDateShift:', sDateShift, ', eDateShift:', eDateShift );
			//console.log('requested borders: [', Kalender.requestStart, ',', Kalender.requestEnd, ']' );
			//console.log('data requested: ', sDate, eDate );
			// request data from server!
			Kalender.request(sDate, eDate);
		} else {
			//console.log('Kalender.loadCache: requested data already cached!');
		}
	};
	
	/*
	 * function to request data from server and call proper handlers
	 * to copy received data to cache or handle errors
	 */
	Kalender.request = function(startDay, endDay) {
		//console.log('Kalender2.request');
		// calculate request url
		/*
		var url = Auth.appUrl + '/index.php?act=kalend&sk=' + Auth.sessionKey + '&sd='
				+ formatDate(startDay) + '&ed=' + formatDate(endDay);
		*/
		//console.log(url);
		var params = {
			'sk'		: Auth.sessionKey,
			'sd'		: formatDate(startDay),
			'ed'		: formatDate(endDay)
		};
		// make a request for kalender data
		Datasource.request("kalend", params, function(data) {
			// connection is ok try to parse server response
			if (data.fehler) { // server returned an error code
				Kalender.tagErrorHandler(data);
			} else if (data) {
				Kalender.needRefresh = false;
				Kalender.cacheTimestamp = Kalender.today.getTime();
				// parse and prepare for caching data
				var tageArray = new Array();
				//console.log("received: ", data);
				angular.forEach(data.kalender, function(value, index) {
					var newValue = angular.copy(value);
					// format the date
					newValue.datum = parseDate(value.datum);
					// format dates in event array
					var events = [];
					if(angular.isDefined(value.events) && value.events.length > 0) {
						angular.forEach(value.events, function(event) {
							var pEvent = angular.copy(event);
							pEvent.datum_von = parseFullDate(event.datum_von);
							pEvent.datum_bis = parseFullDate(event.datum_bis);
							var today = new Date(newValue.datum);
							if(pEvent.datum_von.toDateString() == today.toDateString()) pEvent.showTime = true;
							else pEvent.showTime = false;
							events.push(pEvent);
						});
						newValue.events = events;
					}
					// format dates in vertretungen array
					var v = [];
					if(angular.isDefined(value.vertretungsplan) && value.vertretungsplan.length > 0) {
						angular.forEach(value.vertretungsplan, function(item) {
							var newV = angular.copy(item);
							newV.datum = parseFullDate(item.datum_uhrzeit);
							v.push(newV);
						});
						newValue.vertretungsplan = v;
					}
					this.push(newValue);
				}, tageArray);
				Kalender.tageRequestResult = tageArray;
				Kalender.tagSuccessHandler();
				/*
				url = Auth.appUrl + '/index.php?act=kalend&info=details&sk='
					+ Auth.sessionKey + '&sd=' + formatDate(startDay)
					+ '&ed=' + formatDate(endDay);
				*/
				//console.log(url);
				Datasource.request('kalend-details', params, function(data) {
					//console.log("details received");
					// connection is ok try to parse server response
					if (data.fehler) { // server returned an error code
						Kalender.errorCode = data.fehler;
						Kalender.detailErrorHandler(data);
					} else if (data) {
						// parse and prepare for caching data for
						//console.log("received: ", data);
						var detailsArray = new Array();
						angular.forEach(data.kalender_details, function(value, index) {
							//console.log("parsing date: ", value);
							var newValue = angular.copy(value);
							// format the date
							newValue.datum = parseDate(value.datum);
							this.push(newValue);
						}, detailsArray);
						Kalender.detailRequestResult = detailsArray;
						Kalender.nachricht_sekretariat = data.nachricht_sekretariat;
						Kalender.detailSuccessHandler();
					} else {
						// empty response - something wrong with database
						//console.log("ups... empty data received!");
						var stubData = {
							"fehler" : 0,
							"fehlermessage" : "empty response"
						};
						Kalender.errorCode = stubData.fehler;
						Kalender.detailErrorHandler(stubData);
					}
				}, function(data) {
					// network error
					Kalender.errorCode = data.responseText;
					Kalender.detailErrorHandler(data);
				});
			} else {
				// empty response - something wrong with database
				//console.log("ups... empty data received!");
				var stubData = {
					"fehler" : 0,
					"fehlermessage" : "empty response"
				};
				Kalender.tagErrorHandler(stubData);
			}
		}, function(data) {
			// network error
			Kalender.tagErrorHandler(data);
		});
	};
	
	/*
	 * adding of error and success handlers
	 */
	Kalender.addTagErrorHandler = function(newHandler) {
		Kalender.tagErrorHandlers.push(newHandler);
	};
	
	Kalender.addTagSuccessHandler = function(newHandler) {
		Kalender.tagSuccessHandlers.push(newHandler);
	};
	
	Kalender.addDetailErrorHandler = function(newHandler) {
		Kalender.detailErrorHandlers.push(newHandler);
	};
	
	Kalender.addDetailSuccessHandler = function(newHandler) {
		Kalender.detailSuccessHandlers.push(newHandler);
	};

	/*
	 * internal error handlers
	 * it starts controllers handlers if they are defined
	 * in reverse order (older first)
	 */
	Kalender.tagErrorHandler = function(data) {
		//console.log('Kalender2.tagErrorHandler');
		var errCode = data.fehler;
		//console.log("data: ", data);
		//console.log("errCode: ", errCode);
		for(var i = Kalender.tagErrorHandlers.length; i > 0 ; i--) {
			var result = Kalender.tagErrorHandlers[i-1](errCode);
			if(result === false) break;
		}
	};
	Kalender.detailErrorHandler = function(data) {
		//console.log('Kalender2.detailErrorHandler');
		var errCode = data.fehler;
		for(var i = Kalender.detailErrorHandlers.length; i > 0 ; i--) {
			var result = Kalender.detailErrorHandlers[i-1](errCode);
			if(result === false) break;
		}
	};
	
	/*
	 * internal handlers for successfull requests
	 * caching of received data is here
	 */
	Kalender.tagSuccessHandler = function() {
		//console.log('Kalender2.tagSuccessHandler');
		// cache results first
		Kalender.cacheTagResult();
		// run registered success handlers while they return true
		// only once and in reverse order (older first)
		var l = Kalender.tagSuccessHandlers.length;
		for(var i = 0; i < l ; i++) {
			var hndlr = Kalender.tagSuccessHandlers.pop();
			var result = hndlr();
			if(result === false) break;
		}
	};
	Kalender.detailSuccessHandler = function() {
		//console.log('Kalender2.detailSuccessHandler');
		// cache results first
		Kalender.cacheDetailResult();
		// run registered success handlers while they return true
		// only once and in reverse order (older first)
		var l = Kalender.detailSuccessHandlers.length;
		for(var i = 0; i < l ; i++) {
			var hndlr = Kalender.detailSuccessHandlers.pop();
			var result = hndlr();
			if(result === false) break;
		}
		//hideError();
	};
	
	/*
	 * caching functions that copy received data to proper place in week array
	 */
	Kalender.cacheTagResult = function() {
		//console.log('Kalender2.cacheTagResult');
		//console.log('Kalender2.cacheTagResult borders: [',Kalender.leftCacheBorder,',',Kalender.rightCacheBorder,']');
		//console.log('requested borders: [', Kalender.requestStart, ',', Kalender.requestEnd, ']' );
		var wNum = Kalender.requestEnd - Kalender.requestStart + 1;
		// iterate through weeks
		for(var wIndex = 0; wIndex < wNum; wIndex++) {
			if(!Kalender.wochen[wIndex]) {
				Kalender.wochen[wIndex] = {
						'tage' : [],
						'details' : []
					};
			} else {
				Kalender.wochen[wIndex].tage = [];
			}
			// iterate through days
			for(var dIndex = 0; dIndex < 7; dIndex++) {
				Kalender.wochen[wIndex].tage.push(Kalender.tageRequestResult[wIndex*7 + dIndex]); 
			}
		}
		Kalender.leftCacheBorder = Kalender.requestStart;
		Kalender.rightCacheBorder = Kalender.requestEnd;
		//console.log('length: ',Kalender.wochen.length);
		//console.log('result: ',Kalender.wochen);
	};
	Kalender.cacheDetailResult = function() {
		//console.log('Kalender2.cacheDetailResult');
		//console.log('Kalender2.cacheDetailResult borders: [',Kalender.leftCacheBorder,',',Kalender.rightCacheBorder,']');
		//console.log('requested borders: [', Kalender.requestStart, ',', Kalender.requestEnd, ']' );
		var wNum = Kalender.requestEnd - Kalender.requestStart + 1;
		// iterate through weeks
		for(var wIndex = 0; wIndex < wNum; wIndex++) {
			if(!Kalender.wochen[wIndex]) {
				Kalender.wochen[wIndex] = {
						'tage' : [],
						'details' : []
					};
			} else {
				Kalender.wochen[wIndex].details = [];
			}
			// iterate through days
			for(var dIndex = 0; dIndex < 7; dIndex++) {
				Kalender.wochen[wIndex].details.push(Kalender.detailRequestResult[wIndex*7 + dIndex]); 
			}
		}
		Kalender.leftCacheBorder = Kalender.requestStart;
		Kalender.rightCacheBorder = Kalender.requestEnd;
		//console.log('length: ',Kalender.wochen.length);
		//console.log('result: ', Kalender.wochen);
	};
	Kalender.saveAbo = function(aboTage, success) {
		Datasource.request('kalend-abotag', {'sk' : Auth.sessionKey, 'abotage' : aboTage}, success);
	};
	Kalender.saveMenue = function(auswahl, success, failure) {
		//alert("Kalender.saveMenue");
		Datasource.request('kalend-menue', {'sk' : Auth.sessionKey, 'auswahl' : auswahl}, success, failure);
	};
	return Kalender;
}]);