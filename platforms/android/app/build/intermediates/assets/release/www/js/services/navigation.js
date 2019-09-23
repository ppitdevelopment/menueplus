'use strict';
/* Navigation service v.1.1 */
var NavigationSvc = ppitServices.factory('Navigation', ['$location', '$window', '$rootScope', 'Messages', function($location, $window, $rootScope, Messages) {
	//console.log("Navigation service");
	var Nav = {};
	// current page
	Nav.current = undefined;
	// history storage
	Nav.history = [];
	// calculation of next calendar page
	Nav.kalenderParse = function(params) {
		var newType = "";
		if(angular.isDefined(params) && params.type == 'a') {
			newType = 'b';
		} else {
			newType = 'a';
		}
		var newShift = (angular.isDefined(params) && angular.isDefined(params.shift)) ? params.shift : 0;
		var newPath = newType + "/" + newType + "/" + newShift;
		//console.log("kalenderParse result: ", newPath);
		return newPath; 
	};
	//
	Nav.kursedetailParse = function(params) {
		var newPath = "/" + params.kursId;
		//console.log("kursedetailParse result: ", newPath);
		return newPath;
	};
	// calculate main part of url
	Nav.urlParse = function(page) {
		var url = "";
		switch(page) {
		case "kalender": // legacy support
			//paramTeil = this.kalenderParse(params);
			url = '/kalend';
			break;
		case "kalend":
			//paramTeil = this.kalenderParse(params);
			url = '/kalend';
			break;
		case "profile":
			url = '/profile';
			break;
		case "kursedetail":
			//paramTeil = this.kursedetailParse(params);
			url = '/kursedetail';
			break;
		case "kurse":
			url = '/kurse';
			break;
		case "konto":
			url = '/konto';
			break;
		case "start":
			url = '/start';
			break;
		case "error":
			url = '/error';
			break;
		case "ppitkontakt":
			url = '/ppitkontakt';
			break;
		case "vertretungsplan":
			url = '/vertretungsplan';
			break;
		default:
			url = '/login';
		}
		//console.log("Nav.urlParse result: ", url);
		return url;
	};
	Nav.setCurrent = function(newPage) {
		if(!angular.isDefined(this.current)) {
			this.current = newPage;
		} else {
			if(angular.isDefined(newPage.page) && this.current.page != newPage.page) {
				this.current = newPage;
			}
		}
		$window.localStorage.setItem("nav.current", angular.toJson(this.current));
	};
	Nav.prepareUrl = function(page, params) {
		// core page url selection
		var url = this.urlParse(page);
		var paramTeil = "";
		switch(page) {
		case "kalender": // legacy support
			paramTeil = this.kalenderParse(params);
			break;
		case "kalend":
			paramTeil = this.kalenderParse(params);
			break;
		case "kursedetail":
			paramTeil = this.kursedetailParse(params);
			break;
		default:
			paramTeil = "";
		}
		return url + paramTeil;
	};
	// main navigation function
	Nav.go = function(page, params, isBack) {
		var isMsg = Messages.messages.length > 0;
		var newUrl = Nav.prepareUrl(page, params);
		if(!isBack && angular.isDefined(this.current)) this.history.push(angular.copy(this.current));
		//alert("Nav.go: " + isMsg);
		if(!isBack && isMsg) {
			var skippedPage = {"page": page, "params": params};
			this.history.push(skippedPage);
			$location.path("error");
		} else {
			this.current = {"page": page, "params": params};
			//console.log("Nav.go result: ", newUrl);
			$location.path(newUrl);
		}
	};
	Nav.goCurrent = function() {
		var p;
		if(angular.isDefined(this.current)) {
			p = this.current;
		} else {
			var c = $window.localStorage.getItem("nav.current");
			if(c === null) {
				p = {"page":"start"};
			} else {
				p = angular.fromJson(c);
			}
		}
		var newUrl = Nav.prepareUrl(p.page, p.params);
		//console.log("goCurrent: ", newUrl);
		$location.path(newUrl);
	};
	// "go back" function
	Nav.goBack = function(hard) {
		// software "back" functionality
		//console.log("Nav.goBack history: ", this.history);
		var newUrl = {page: 'start'};
		if(this.history.length > 0) {
			newUrl = this.history.pop();
		}
		//console.log("Nav.goBack go: ", newUrl);
		//alert("Nav.goBack "+newUrl.page);
		this.go(newUrl.page, newUrl.params, true);
	};
	// hardware back button functionality
	Nav.backHard = function(e) {
		e.preventDefault();
		if(angular.isDefined(Nav.current) && (Nav.current.page == 'start' || Nav.current.page == 'login')) {
	        navigator.app.exitApp();
		} else {
			Nav.go('start');
			$rootScope.$apply();
		}
	};
	$window.document.addEventListener("deviceready", function() {
		$window.document.addEventListener("backbutton", Nav.backHard, false);
	}, false);
	return Nav;
}]);