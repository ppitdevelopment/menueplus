'use strict';

/* PPIT Kontakt controller */
function PpitKontaktCtrl($scope, Navigation, Auth, Settings, Datasource) {
	//console.log('PpitKontaktCtrl');
	$scope.ctrlName = "PpitKontaktCtrl";
	$scope.info = undefined;
	$scope.timeoutId = undefined;
	$scope.loaded = false;
	// go to start page
	$scope.start = function() {
		Navigation.go("start");
	};
	$scope.click = function(btn) {
		//console.log('PpitKontaktCtrl.click', buttons);
		if(angular.isDefined(btn)) {
			$scope.timeoutId = window.setTimeout(function() {
				window.clearTimeout($scope.timeoutId);
				var buttons = $('a.ui-btn');
				$(buttons).removeClass("ui-btn-active");
				//console.log("href:", btn);
				//window.location.href = btn;
				window.open(btn, '_system');
			}, 10);
		}
	};
	$scope.init = function() {
		//console.log('PpitKontaktCtrl.init');
		var kontaktInfo = {};
		if(angular.isDefined(Auth.kontakt.ppit_telefon)) {
			angular.forEach(Auth.kontakt, function(value, key) {
				if(angular.isDefined(value) && value.length > 0) {
					if(key.indexOf('mail') > -1) {
						kontaktInfo[key] = 'mailto:' + value.trim();
					}
					if(key.indexOf('telefon') > -1) {
						kontaktInfo[key] = 'tel:' + value.trim();
					}
				}
			});
			console.log(kontaktInfo);
			$scope.info = kontaktInfo;
			$scope.loaded = true;
		}
	};
	Auth.load();
	if (Auth.loggedIn()) {
		// main code here
		$scope.init();
		Navigation.setCurrent({"page" : "ppitkontakt"});
	} else {
		Navigation.go("login");
	}
}
PpitKontaktCtrl.$inject = [ '$scope', 'Navigation', 'Auth', 'Settings', 'Datasource' ];