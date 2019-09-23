'use strict';

/**
 * The main ISS Mobile App app module.
 * (c) PPIT 2013-2015
 * 
 * @type {angular.Module}
 */
var ppitapp = angular.module('ppitapp', ['ngResource', 'ngSanitize', 'ppitapp.services']);

ppitapp.config(
		[ '$routeProvider', function($routeProvider) {
			$routeProvider.when('/login', {
				templateUrl : 'login.html',
				jqmOptions : {
					transition : 'none'
				}
			}).when('/kalenda/:Type/:Shift', {
				templateUrl : 'kalenda.html',
				jqmOptions : {
					transition : 'none'
				}
			}).when('/kalendb/:Type/:Shift', {
				templateUrl : 'kalendb.html',
				jqmOptions : {
					transition : 'none'
				}
			}).when('/profile', {
				templateUrl : 'profile.html',
				jqmOptions : {
					transition : 'none'
				}
			}).when('/konto', {
				templateUrl : 'konto.html',
				jqmOptions : {
					transition : 'none'
				}
			}).when('/kurse', {
				templateUrl : 'kurse.html',
				jqmOptions : {
					transition : 'none'
				}
			}).when('/kursedetail/:kursId', {
				templateUrl : 'kursedetail.html',
				jqmOptions : {
					transition : 'none'
				}
			}).when('/start', {
				templateUrl : 'start.html',
				jqmOptions : {
					transition : 'none'
				}
			}).when('/error', {
				templateUrl : 'error.html',
				jqmOptions : {
					transition : 'none'
				}
			}).when('/ppitkontakt', {
				templateUrl : 'ppitkontakt.html',
				jqmOptions : {
					transition : 'none'
				}
			}).when('/vertretungsplan', {
				templateUrl : 'vertretungsplan.html',
				jqmOptions : {
					transition : 'none'
				}
			}).otherwise({
				redirectTo : '/login'
			});
		} ]);

