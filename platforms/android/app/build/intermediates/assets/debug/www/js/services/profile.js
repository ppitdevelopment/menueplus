'use strict';
/* Teilnehmer(Profile) service v.1 */
var ProfileSvc = ppitServices.factory('Teilnehmer', ['Auth', 'Datasource', function(Auth, Datasource) {
	//console.log("Teilnehmer service");
	var Tn = {};
	// profile data container
	Tn.profile = undefined;
	// loading flag
	Tn.loading = false;
	// cached data timeout in milliseconds
	Tn.timeout = 60000;
	// timestamp of last load
	Tn.lastLoad = undefined;
	// force refresh flag and setter
	Tn.expired = false;
	Tn.refresh = function() {
		//console.log("Teilnehmer refresh!");
		Tn.expired = true;
	};
	// returns true if cache is expired and needs refresh
	Tn.cacheExpired = function() {
		var d = new Date();
		// Tn.lastLoad === undefined means that there were no loading of profile data yet
		// d.getTime() - Tn.lastLoad > Tn.timeout - means that timeout for profile data storage is expired
		var f1 = angular.isUndefined(Tn.lastLoad);
		//console.log("f1:", f1);
		var f2 = Tn.expired;
		//console.log("f2:", f2);
		var f3 = (d.getTime() - Tn.lastLoad > Tn.timeout);
		//console.log("f3:", f3);
		return (f1 || f2 || f3);
	};
	// success & error handlers
	Tn.sHandlers = [];
	Tn.eHandlers = [];
	Tn.clearHandlers = function() {
		Tn.sHandlers = [];
		Tn.eHandlers = [];
	};
	Tn.runHandlers = function(handlers, data) {
		angular.forEach(handlers, function(handler) {
			handler(data);
		});
	};
	Tn.parseTeilnehmerData = function(data) {
		// some parsing can be done here
		return data;
	};
	// clear cached data
	Tn.clearProfileData = function() {
		Tn.profile = undefined;
		Tn.loading = false;
	};
	Tn.load = function() {
		Tn.loading = true;
		Datasource.request('profile-index', {'sk' : Auth.sessionKey}, function(data) {
			// success handler
			Tn.loading = false;
			if(angular.isDefined(data)) {
				if(data.fehler == 0) {
					// prepare data for view
					Tn.profile = Tn.parseTeilnehmerData(data);
					// set timestamp of last load
					var d = new Date();
					Tn.lastLoad = d.getTime();
					Tn.expired = false;
					// run registered success handlers
					Tn.runHandlers(Tn.sHandlers, data);
				} else {
					// run registered error handlers
					Tn.runHandlers(Tn.eHandlers, data);
				}
			} else {
				// run registered error handlers
				Tn.runHandlers(Tn.eHandlers, data);
			}
			// clear all handlers after successfull request
			Tn.clearHandlers();
		}, function(data) {
			Tn.loading = false;
			// error - network/server problems
			// run registered error handlers
			Tn.runHandlers(Tn.eHandlers, data);
			// clear all handlers after request processed
			Tn.clearHandlers();
		});
	};
	Tn.getProfile = function(sHandler, eHandler) {
		//console.log("Teilnehmer.getProfile");
		// register success handler
		if(angular.isDefined(sHandler)) {
			Tn.sHandlers.push(sHandler);
		}
		// register error handler
		if(angular.isDefined(eHandler)) {
			Tn.eHandlers.push(eHandler);
		}
		// check if data is already loaded
		// and not expired
		if(angular.isDefined(Tn.profile) && Tn.profile.fehler == 0 && !Tn.cacheExpired()) {
			Tn.runHandlers(Tn.sHandlers, Tn.profile);
			Tn.clearHandlers();
			return Tn.profile;
		} else {
			// prevent loading if process is already started
			if(!Tn.loading) {
				// clear cached data
				Tn.clearProfileData();
				// start loading procedure
				Tn.load();
			}
			return Tn.profile;
		}
	};
	Tn.savePassword = function(pwd, sHandler, eHandler) {
		Datasource.request('profile-pwd', {'sk' : Auth.sessionKey, 'pwd' : pwd}, sHandler, eHandler);
	};
	Tn.deleteFoto = function(sHandler, eHandler) {
		Datasource.request('profile-delete', {'sk' : Auth.sessionKey}, sHandler, eHandler);
	};
	//Tn.getProfile();
	return Tn;
}]);