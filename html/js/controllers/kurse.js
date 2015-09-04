'use strict';

/* Kurse controller */
function KurseCtrl($scope, Navigation, Auth, Kurse) {
	//console.log("KurseCtrl");
	
	$scope.mode = "index"; // index/meine
	$scope.modeTitle = "Kursanmeldung";
	
	// toogles current mode
	$scope.toggle = function(btn) {
		if(btn != $scope.mode) {
			if($scope.mode == "meine") {
				$scope.mode = "index";
				$scope.modeTitle = "Kursanmeldung";
			} else {
				$scope.mode = "meine";
				$scope.modeTitle = "Meine Kurse";
			}
			$scope.init();
		}
	};
	
	// courses list
	$scope.kurse = [];
	
	// return to start page
	$scope.start = function() {
		Navigation.go("start");
	};
	
	// go to Kurse detail page
	$scope.kurseDetail = function(id) {
		Navigation.go("kursedetail", {kursId: id});
	};
	
	$scope.errorHandler = function() {
		if(Kurse.errorFlag) {
			//console.log("error handler ",Kurse.errorCode);
			$scope.errorMsg = Kurse.fehlerMessage;
		}
	};
	
	$scope.init = function() {
		//console.log("init");
		$scope.errorMsg = "";
		Kurse.registerHandler($scope.errorHandler);
		//console.log("init");
		var timestamp = new Date();
		if($scope.mode == "meine") {
			Kurse.loadMeine(timestamp, function(data) {
				$scope.kurse = data;
			});
			 
		} else {
			Kurse.load(timestamp, function(data) {
				$scope.kurse = data;
			});
		}
		//console.log($scope.kurse);
	};
	
	Auth.load();
	if (Auth.loggedIn()) {
		if(Kurse.getLastPage() == 'meine') {
			$scope.mode = "meine";
			$scope.modeTitle = "Meine Kurse";
			$("a#kurse_meine").addClass("ui-btn-active");
		} else {
			$("a#kurse_index").addClass("ui-btn-active");
		}
		$scope.init();
		Navigation.setCurrent({"page" : "kurse"});
	} else {
		Navigation.go("login");
		//$location.url("/login");
	}
}
KurseCtrl.$inject = [ '$scope', 'Navigation', 'Auth', 'Kurse' ];