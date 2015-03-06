'use strict';

/* Vertretungsplan controller */
function VertretungsplanCtrl($scope, Navigation, Auth, Settings, Datasource) {
	//console.log('VertretungsplanCtrl');
	$scope.ctrlName = "VertretungsplanCtrl";
	$scope.vertretungen = new Array();
	$scope.isLoaded = false;
	// go to start page
	$scope.start = function() {
		Navigation.go("start");
	};
	// back button action
	$scope.back = function() {
		Navigation.goBack();
	};
	// parse Vertretung info
	$scope.parse = function(item) {
		var vertretungObject = {
			"statusClass"	: "",
			"statusImg"		: "",
			"statusTitle"	: (item.vertretungsart.length > 10) ? item.vertretungsart.slice(0,6) + "..." : item.vertretungsart
		};
		switch(item.vertretungsart_id) {
		case 2:
			vertretungObject.statusImg = 'css/images/ribbon3-o.png';
			vertretungObject.statusClass = 'orange';
			break;
		case 3:
			vertretungObject.statusImg = 'css/images/ribbon3-g.png';
			vertretungObject.statusClass = 'green';
			break;
		case 1:
			vertretungObject.statusImg = 'css/images/ribbon3-r.png';
			vertretungObject.statusClass = 'red';
			break;
		default:
			vertretungObject.statusImg = 'css/images/ribbon3-r.png';
			vertretungObject.statusClass = 'red';
			break;
		}
		angular.extend(vertretungObject, item);
		vertretungObject.datum = parseFullDate(item.datum_uhrzeit);
		//console.log("datum:", d);
		return vertretungObject;
	};
	$scope.init = function() {
		//console.log('PpitKontaktCtrl.init');
		$scope.isLoaded = false;
		var params = {
			'sk'	: Auth.sessionKey
		};
		Datasource.request('vertretungsplan', params, function(data) {
			var parsedData = [];
			angular.forEach(data.vertretungen, function(item) {
				parsedData.push($scope.parse(item));
			});
			$scope.vertretungen = parsedData;
			$scope.isLoaded = true;
			//console.log("vertretungsplan:", parsedData);
			$scope.$apply();
		});
	};
	Auth.load();
	if (Auth.loggedIn()) {
		// main code here
		$scope.init();
		Navigation.setCurrent({"page" : "vertretungsplan"});
	} else {
		Navigation.go("login");
	}
}
VertretungsplanCtrl.$inject = [ '$scope', 'Navigation', 'Auth', 'Settings', 'Datasource' ];