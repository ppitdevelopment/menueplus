'use strict';
/* SERVICES */
var ppitServices = angular.module('ppitapp.services', []);
/*
 * Connection service. Checking for available url - old people & projects or new pair solution
 * falls back to dev url if both failed
 * returns "reject" if network is not available
 */
var ConnectionSvc = ppitServices.factory('Connection', ['$q', '$http', function($q, $http) {
	console.log("Connection start:", $q);
	var Connection = {
		loaded		: false,
		connected	: false,
		_urls		: [
			"https://m.pairsolutions.de",
			"https://m.people-projects-it.com",
			"https://m.ber.menuplus.de"
		],
		deferred	: undefined,
		serverUrl	: "",
		config		: undefined
	};
	Connection.getUrl = function() {
		return Connection.serverUrl;
	};
	Connection.isConnected = function() {
		console.log("Connection defer:", Connection.deferred);
		if(!Connection.loaded) {
			var startUrls = Connection._urls.slice();
			$.mobile.loading('show');
			Connection.tryToConnect(startUrls);
			Connection.loaded = true;
		}
		return Connection.deferred.promise;
	};
	Connection.tryToConnect = function (urls) {
		var url = urls.shift();
		$http.get(url + "/config.json").
		success(function (data) {
			//console.log("tryToConnect success:", data);
			Connection.serverUrl = url;
			_URL = url;
			Connection.connected = true;
			$.mobile.loading('hide');
			Connection.config = data;
			Connection.deferred.resolve(url);
		}).
		error(function () {
			//console.log("tryToConnect failed:", data);
			if ((urls.length > 0) && !Connection.connected) Connection.tryToConnect(urls);
			else {
				Connection.connected = false;
				$.mobile.loading('hide');
				Connection.deferred.reject("App kann nicht mit dem Server verbunden werden. Bitte überprüfen Sie Ihre Internetverbindung.");
			}
		});
	};
	Connection.deferred = $q.defer();
	return Connection;
}]);
/*
 * Application settings storage
 * and start page helper
 */
var SettingsSvc = ppitServices.factory('Settings',
		['Navigation', 'Auth', '$rootScope', '$window',
		 function(Navigation, Auth, $rootScope, $window) {
	//console.log("Settings service start");
	var Settings = {};
	// customer id is hardcoded now - will be upgraded to real values
	// in later versions
	Settings.customerID = 1;
	Settings.getCustomerID = function() {
		return Settings.customerID;
	};
	// sleep duration in milliseconds
	Settings.sleepDuration = 60000;
	// current sleep timestamp
	Settings.sleepTimestamp = 0;
	Settings.getSleepTime = function() {
		var sleep = Settings.load("sleep");
		var d = new Date();
		if(sleep === null) sleep = d.getTime();
		return sleep;
	};
	Settings.setSleepTime = function() {
		var d = new Date();
		Settings.save("sleep", d.getTime());
	};
	// sleep handler
	Settings.sleepHandler = function() {
		if(_PLATFORM == "ios") {
			$window.setTimeout(function() { // iOS wrapper
				Settings.setSleepTime();
			}, 0);
		} else {
			Settings.setSleepTime();
		}
	};
	
	Settings.realResumeHandler = function() {
		//console.log("Settings.resumeHandler");
		var d = new Date();
		if(d.getTime() - Settings.getSleepTime() > Settings.sleepDuration) {
			//console.log("timeout!");
			//alert("Settings.resumeHandler: timeout expired");
			Auth.relogin(function() {
				/*
				var p = Navigation.current.page;
				var currentPage = angular.isDefined(p)? p : "";
				var startPage = Settings.getStart();
				if(currentPage != startPage) {
					Navigation.go(startPage);
					$rootScope.$apply();
				}
				*/
				//alert("relogin success");
				var startPage = Settings.getStart();
				Navigation.go(startPage);
				$rootScope.$apply();
			});
			return true;
		} else {
			//alert("no timeout");
			return false;
		}
	};
	// resume handler
	Settings.resumeHandler = function() {
		//alert("Settings.resumeHandler!");
		if(_PLATFORM == "ios") {
			$window.setTimeout(function() { // iOS wrapper
				Settings.realResumeHandler();
			}, 0);
		} else {
			Settings.realResumeHandler();
		}
	};

	/*
	 * Current date saving/loading functions
	 */
	Settings.setDate = function(d) {
		//console.log("Settings.setDate: ",d);
		Settings.save("datum", d);
	};
	
	Settings.getDate = function() {
		var d = Settings.load("datum");
		if(d === null) {
			//console.log("date is empty");
			d = Settings.getToday();
		}
		return d;
	};
	
	Settings.getToday = function() {
		var dt = new Date();
		var d = dt.toISOString();
		d = d.slice(0,10);
		return d;
	};
	
	/*
	 * Start page user settings saving/loading
	 */
	Settings.setStart = function(p) {
		Settings.save("start", p);		
	};
	
	Settings.getStart = function() {
		var st = Settings.load("start");
		// if the value is not saved
		if(st === null) {
			// default start page - "start"
			st = "start";
		}
		return st;
	};
	
	// initialization of local storage
	Settings.ls = window.localStorage;
	if (!Settings.ls) {
		//console.log('Settings service: local storage not available.');
		//showError("Achtung: lokale Speicherung ist nicht verfügbar!");
	}
	
	// internal saving/loading functions
	Settings.save = function(k,v) {
		Settings.ls.setItem(k, v);
	};
	
	Settings.load = function(k) {
		return Settings.ls.getItem(k);
	};
	$window.document.addEventListener("deviceready", function() {
		$window.document.addEventListener("pause", Settings.sleepHandler, false);
		$window.document.addEventListener("resume", Settings.resumeHandler, false);
	}, false);
	return Settings;
}]);

/* db/server requests handling service */
var DatasourceSvc = ppitServices.factory('Datasource', ['$http', 'Messages', 'Navigation', 'Auth', function($http, Messages, Navigation, Auth) {
	var DS = {};
	DS.serverURL = _URL + '/index.php';
	DS.resource = {
			'kalend': {
				method	: 'GET',
				params	: {
					'act'		: 'kalend',
					'sk'		: '@sk',
					'sd'		: '@sd',
					'ed'		: '@ed'
				}
			},
			'kalend-details': {
				method	: 'GET',
				params	: {
					'act'		: 'kalend',
					'info'		: 'details',
					'sk'		: '@sk',
					'sd'		: '@sd',
					'ed'		: '@ed'
				}
			},
			'kalend-abotag': {
				method	: 'POST',
				params	: {
					'act'		: 'kalend',
					'save'		: 'abotage',
					'sk'		: '@sk'
				}
			},
			'kalend-menue': {
				method	: 'POST',
				params	: {
					'act'		: 'kalend',
					'save'		: 'menue',
					'sk'		: '@sk'
				}
			},
			'kurse-index': {
				method	: 'GET',
				params	: {
					'act'		: 'kurse',
					'get'		: 'index',
					'sk'		: '@sk'
				}
			},
			'kurse-meine': {
				method	: 'GET',
				params	: {
					'act'		: 'kurse',
					'get'		: 'meine',
					'sk'		: '@sk'
				}
			},
			'kurse-save': {
				method	: 'POST',
				params	: {
					'act'		: 'kurse',
					'get'		: 'none',
					'sk'		: '@sk'
				}
			},
			'profile-index': {
				method	: 'GET',
				params	: {
					'act'		: 'profile',
					'sk'		: '@sk'
				}
			},
			'profile-delete': {
				method	: 'GET',
				params	: {
					'act'		: 'profile',
					'do'		: 'delete',
					'sk'		: '@sk'
				}
			},
			'profile-pwd': {
				method	: 'POST',
				params	: {
					'act'		: 'profile',
					'do'		: 'pwd',
					'sk'		: '@sk'
				}
			},
			'konto': {
				method	: 'GET',
				params	: {
					'act'		: 'konto',
					'sk'		: '@sk',
					'sd'		: '@sd',
					'ed'		: '@ed'
				}
			},
			'vertretungsplan': {
				method	: 'GET',
				params	: {
					'act'		: 'vertretungsplan',
					'sk'		: '@sk'
				}
			}
	};
	DS.requestStatus = undefined;
	DS.request = function(method, params, successHandler, failureHandler) {
		$.mobile.loading('show');
		//console.log("DS.request");
		var config = {
				method	: DS.resource[method].method
		};
		// overwrite sessionKey
		if(angular.isDefined(DS.resource[method].params.sk)) {
			DS.resource[method].params.sk = Auth.sessionKey;
			//console.log("session Key overwrite: ", Auth.sessionKey);
		}
		// compile url
		var url = DS.serverURL;
		var getParams = [];
		angular.forEach(DS.resource[method].params, function(value, key) {
			//console.log(key + ': ' + value);
			var urlPart = key + "=";
			var valueStr = value + '';
			if(valueStr.charAt(0) == '@') urlPart += params[valueStr.slice(1)];
			else urlPart += valueStr;
			//console.log(urlPart);
			getParams.push(urlPart);
		});
		var getParamsStr = getParams.join('&');
		if(getParams.length > 0) url += '?' + getParamsStr;
		//console.log("url:", url);
		config.url = url;
		// prepare POST params
		if(DS.resource[method].method == 'POST') {
			config.data = $.param(params);
			config.headers = {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'};
		}
		$http(config).success(function(data, status, headers, config) {
			//console.log("DS.request success", data, status, headers, config);
			$.mobile.loading('hide');
			if(angular.isDefined(data)) {
				if(angular.isDefined(data.fehler) && data.fehler != 0) {
					//if(method == 'kalend-menue') alert("DS.success Fehler:" + data.fehler);
					if(data.fehler == -2) {
						// we should try to make another login if credentials are saved or redirect to lgin page if they are not
						var reloginParams = [method, params, successHandler, failureHandler];
						Auth.relogin(DS.request, reloginParams);
					} else {
						//if(data.fehler )
						if(failureHandler) failureHandler(data);
						if(angular.isDefined(data.fehlermessage)) {
							Messages.addMessage("err", "Fehler", data.fehlermessage);
						} else {
							Messages.addMessage("err", "Fehler", "Unbekannte Fehler");
						}
					}
				} else {
					//if(method == 'kalend-menue') alert("DS.success -> successHandler");
					if(successHandler) successHandler(data);
				}
			} else {
				Messages.addMessage("err", "Fehler", "Empty server response");
			}
		}).error(function(data, status, headers, config) {
			$.mobile.loading('hide');
			//console.log("DS.request failure", data, status, headers, config);
			if(failureHandler) failureHandler(data);
			DS.handleError(status, data);
		});
	};
	DS.handleError = function(status, data) {
		DS.requestStatus = status;
		//$("#wartungPopup").popup();
		if(status == 503) {
			// WARTUNG MODUS
			//console.log("WARTUNG MODUS detected!");
			Messages.addMessage("wait");
		} else {
			Messages.addMessage("wait", "Verbindungsfehler", "App kann nicht mit " + _URL + " verbunden werden. Bitte überprüfen Sie Ihre Internetverbindung.");
		}
		Navigation.go("error");
	};
	return DS;
}]);

/* Messages service - storage for error messages and news from server */
var MessagesSvc = ppitServices.factory('Messages', [function() {
	//console.log("Messages service");
	var M = {};
	M.messages = [];
	M.messageTypes = ["err", "wait", "info", "warnung"];
	M.baseMessages = {
			"err"	: {
				"action": "ok",
				"title"	: "Fehler",
				"text"	: "Fehler",
				"image"	: "css/images/warn.png"
			},
			"auth"	: {
				"action": "refresh",
				"title"	: "Fehler",
				"text"	: "Fehler",
				"image"	: "css/images/warn.png"
			},
			"wait"	: {
				"action": "refresh",
				"title"	: "Wartung",
				"text"	: "Derzeit aktualisieren wir für Sie unser System. Deshalb steht dieser Dienst vorübergehend nicht zur Verfügung. Wir danken für Ihr Verständnis und bitten Sie es später noch einmal zu versuchen.",
				"image"	: "css/images/wartung.png"
			},
			"info"	: {
				"action": "ok",
				"title"	: "Info",
				"text"	: "",
				"image"	: "css/images/info_big.png"
			},
			"warnung"	: {
				"action": "ok",
				"title"	: "Warnung",
				"text"	: "",
				"image"	: "css/images/warn.png"
			}
	};
	M.actionType = "ok"; // "ok"/"refresh"
	M.actionHandler = undefined;
	M.setAction = function(handler) {
		M.actionHandler = handler;
	};
	M.addMessage = function(type, title, text) {
		var alreadyErr = false;
		angular.forEach(M.messages, function(mItem) {
			if(mItem.type == type) alreadyErr = true;
		});
		if(!(type == 'wait' && alreadyErr)) {
			var msg = angular.copy(M.baseMessages[type]);
			msg.id = M.messages.length;
			msg.type = type;
			if(angular.isDefined(title)) msg.title = title;
			if(angular.isDefined(text)) msg.text = text;
			M.messages.push(msg);
			M.actionType = msg.action;
		}
	};
	M.clear = function() {
		M.messages = [];
		M.actionType = "ok"; // "ok"/"refresh"
	}
	return M;
}]);

/* Auth service */
var AuthSvc = ppitServices.factory('Auth', ['$http', 'Messages', 'Navigation', 'Connection', function($http, Messages, Navigation, Connection) {
	//console.log('Auth service start');
	var AuthService = {};
	// user credentials
	AuthService.cred = {
		username : "",
		password : ""
	};
	AuthService.resource = {
			'login': {
				method	: 'POST',// hardcoded in login()
				params	: {
					'act'		: 'auth',
					'platform'	: _PLATFORM,
					'version'	: _VERSION
				}
			},
			'logout': {
				method	: 'POST',// hardcoded in logout()
				params	: {
					'act'		: 'auth',
					'logout'	: 'yes',
					'sk'		: '@sk'
				}
			}
	};
	AuthService.request = function(config, successHandler, failHandler) {
		$.mobile.loading('show');
		$http(config).success(function(data, status, headers, config) {
			$.mobile.loading('hide');
			if(angular.isDefined(data)) {
				if(angular.isDefined(data.fehler) && data.fehler != 0) {
					//console.log("Fehler: ", data);
					if(angular.isDefined(data.fehlermessage)) {
						Messages.addMessage("err", "Fehler", data.fehlermessage);
					} else {
						Messages.addMessage("err", "Fehler", "Unbekannte Fehler: " + data.fehler);
					}
					if(failHandler) failHandler(data);
				} else {
					if(successHandler) successHandler(data);
				}
			} else {
				Messages.addMessage("err", "Fehler", "Empty server response");
			}
		}).error(function(data, status, headers, config) {
			$.mobile.loading('hide');
			if(status == 503) {
				// WARTUNG MODUS
				//console.log("WARTUNG MODUS detected!");
				Messages.addMessage("wait");
			} else {
				Messages.addMessage("wait", "Verbindungsfehler", "App kann nicht mit " + _URL + " verbunden werden. Bitte überprüfen Sie Ihre Internetverbindung.");
			}
			Navigation.go("error");
			if(failHandler) failHandler(data);
		});
	};
	// user session key
	AuthService.sessionKey = "";
	// login status of current user
	AuthService.loggedIn = function() {
		return (AuthService.sessionKey != "");
	};
	// should we remember credentials or not?
	AuthService.remember = false;
	// credentials saved?
	AuthService.saved = false;
	// buttons available on start page
	// if AuthService.pages.konto == true - then konto page is available
	AuthService.pages = {};
	// additional rights
	AuthService.rights = {};
	// news loaded from server
	AuthService.news = undefined;
	// site url
	// main authorization function
	AuthService.login = function(cred, doneHandler, failHandler) {
		var url = AuthService.serverURL;
		var getParams = [];
		angular.forEach(AuthService.resource.login.params, function(value, key) {
			//console.log(key + ': ' + value);
			var urlPart = key + "=" + value;
			//console.log(urlPart);
			getParams.push(urlPart);
		});
		var getParamsStr = getParams.join('&');
		if(getParams.length > 0) url += '?' + getParamsStr;
		//console.log("url:", url);
		//console.log('login-cred:',cred);
		var config = {
				method	: 'POST',
				url		: url,
				data	: $.param(cred),
				headers	: {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}
		};
		AuthService.request(config, function(data) {
			if (data != "") {
				if (data.result.status == "ok") {
					// login request successfull
					//console.log('hiding page');
					AuthService.sessionKey = data.result.key;
					AuthService.pages = data.pages;
					AuthService.rights = data.rechte;
					AuthService.kontakt = data.kontakt;
					AuthService.anzahl_vertretungen = data.anzahl_vertretungen;
					setCookie('sk',AuthService.sessionKey,null,'/');
					AuthService.save(cred);
					//document.cookie = "sk=" + AuthService.sessionKey;
					//console.log( 'Auth service ok ', doneHandler);
					//$cookies.sk = AuthService.sessionKey;
					AuthService.news = undefined;
					Messages.clear();
					var news = data.nachrichten;
					if(angular.isDefined(news)) {
						AuthService.news = news;
						angular.forEach(news, function(meldung, type) {
							Messages.addMessage(type, undefined, meldung);
						});
					}
					if (doneHandler) doneHandler(data);
				} else {
					//console.log( "false login: ", data );
					if(data.result.status == 0) {
						Messages.addMessage("auth", undefined, "Benutzername oder Passwort falsch!");
					} else if(data.result.status < 0){
						Messages.addMessage("err", undefined, data.fehlermessage);
					} else if(data.result.status > 0) {
						Messages.addMessage("auth", undefined, "Benutzername oder Passwort falsch! Sie müssen " + data.result.status + " Sekunden warten");
					}
					if (failHandler)
						failHandler(data);
				}
			} else {
				//console.log("login empty response",	data);
				Messages.addMessage("err", undefined, "Login empty answer");
				if (failHandler)
					failHandler(data);
			}
		}, failHandler);
	};
	
	// saving credentials for further usage
	AuthService.save = function(cred) {
		if(AuthService.remember) AuthService.cred = cred;
		//console.log('AuthService.save: start.');
		var ls = window.localStorage;
		if (ls) {
			if(AuthService.remember)
				ls.setItem("cred", angular.toJson(cred));
			ls.setItem("pages", angular.toJson(AuthService.pages));
			ls.setItem("rights", angular.toJson(AuthService.rights));
			ls.setItem("kontakt", angular.toJson(AuthService.kontakt));
			ls.setItem("anzahl_vertretungen", angular.toJson(AuthService.anzahl_vertretungen));
			ls.setItem("sk", AuthService.sessionKey);
			AuthService.saved = true;
		} else {
			//console.log('AuthService.save: local storage not available.');
			Messages.addMessage("err", undefined, "Warning: local storage not available!");
			//showError("Warning: local storage not available!");
		}
	};
	
	// try to load previously saved credentials

	AuthService._load = function(handler) {
		var ls = window.localStorage;
		if (ls) {
			AuthService.cred = angular.fromJson(ls.getItem("cred"));
			AuthService.pages = angular.fromJson(ls.getItem("pages"));
			AuthService.rights = angular.fromJson(ls.getItem("rights"));
			AuthService.kontakt = angular.fromJson(ls.getItem("kontakt"));
			AuthService.anzahl_vertretungen = angular.fromJson(ls.getItem("anzahl_vertretungen"));
			//console.log('cred=', AuthService.cred);
			AuthService.sessionKey = ls.getItem("sk");
			//console.log('sk=', AuthService.sessionKey);
			//console.log("cookies: ",document.cookie);
			//document.cookie = "sk=" + AuthService.sessionKey;
			if (AuthService.sessionKey) {
				setCookie('sk',AuthService.sessionKey,null,'/');
				AuthService.saved = true;
			} else {
				AuthService.saved = false;
				//console.log('AuthService.load: session key empty.');
			}
		} else {
			//console.log('AuthService.load: local storage not available.');
			Messages.addMessage("err", undefined, "Warning: local storage not available!");
			//showError("Warning: local storage not available!");
		}
		if(!!handler) handler();
	};
	// wrapper for checking for url and internet access
	AuthService.load = function(handler) {
		console.log('AuthService.load called');
		Connection.isConnected().then(function(url) {
			console.log("AuthService.load success:", url);
			AuthService.serverURL = url + '/index.php';
			AuthService._load(handler);
		}, function(message) {
			console.log("AuthService.load failed:", message);
			Messages.addMessage("wait", "Verbindungsfehler", message);
			AuthService.sessionKey = "";
			//if(!!handler) handler();
		});
	};
	
	// logout function
	AuthService.logout = function(redirectFunc) {
		//console.log("AuthService.logout");
		var params = {"sk":AuthService.sessionKey};
		// compile url
		var url = AuthService.serverURL;
		var getParams = [];
		angular.forEach(AuthService.resource.logout.params, function(value, key) {
			//console.log(key + ': ' + value);
			var urlPart = key + "=";
			var valueStr = value + '';
			if(valueStr.charAt(0) == '@') urlPart += params[valueStr.slice(1)];
			else urlPart += valueStr;
			getParams.push(urlPart);
		});
		var getParamsStr = getParams.join('&');
		if(getParams.length > 0) url += '?' + getParamsStr;
		//console.log("url:", url);
		var config = {
			method	: 'POST',
			url		: url	
		};
		AuthService.request(config, function(data) {
			AuthService.clear();
			if(redirectFunc) redirectFunc();
		}, function(data) {
			AuthService.clear();
			if(redirectFunc) redirectFunc();
		});
	};
	
	// clear all data from Auth and clear local storage if available
	AuthService.clear = function() {
		//console.log('AuthService.clear.');
		//document.cookie = "";
		AuthService.cred = {
			username : "",
			password : ""
		};
		setCookie('sk',"",null,'/');
		AuthService.sessionKey = "";
		AuthService.saved = false;
		var ls = window.localStorage;
		if(ls) {
			//ls.removeItem("cred");
			ls.removeItem("sk");
		}
	};
	
	AuthService.reloginCallers = [];
	AuthService.reloginInPorgress = false;
	
	AuthService.relogin = function(callerFunc, callerParams) {
		AuthService.reloginCallers.push({
			"f" : callerFunc,
			"p"	: callerParams
		});
		if(!AuthService.reloginInPorgress) {
			var cred = undefined;
			if(AuthService.remember) {
				// if credentials is remembered
				cred = AuthService.cred;
			} else {
				// try to load them from local storage
				AuthService.load();
				if(angular.isDefined(AuthService.cred) && AuthService.cred !== null) cred = AuthService.cred;
			}
			if(angular.isDefined(cred)) {
				AuthService.reloginInPorgress = true;
				// try to login
				AuthService.login(cred, function(data) {
					AuthService.save(cred);
					if(angular.isDefined(AuthService.reloginCallers)) {
						while (AuthService.reloginCallers.length) {
							// get handler
							var o = AuthService.reloginCallers.shift();
							// run it with set of parameters as array
							o.f.apply(this, o.p);
						}
					}
					//if(angular.isDefined(callerFunc)) callerFunc.apply(this, callerParams);
					/*
					angular.forEach(AuthService.reloginCallers, function(callerObject) {
						callerObject.f.apply(this, callerObject.p);
					});
					AuthService.reloginCallers = [];
					*/
					AuthService.reloginInPorgress = false;
				}, function(data) {
					AuthService.reloginInPorgress = false;
					AuthService.reloginCallers = [];
					AuthService.clear();
					Navigation.go("error");
				});
			} else {
				AuthService.reloginCallers = [];
				Messages.addMessage("err", undefined, "Session expired.");
				AuthService.clear();
				Navigation.go("login");
			}
		}
	};
	return AuthService;
}]);
