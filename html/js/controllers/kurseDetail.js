'use strict';

/* Kurse detail page controller */
function KurseDetailCtrl($scope, Navigation, Auth, Kurse, $routeParams) {
	// refresh timeout id
	$scope.timeoutId = 0;
	// waiting for data interval id
	$scope.intervalId = 0;
	// id of kurse
	$scope.kursId = 0;
	// kurse object
	$scope.kurs = {};
	// submit button flag
	$scope.submitShow = function() {
		var check = angular.isDefined($scope.kurs.buttonAction) && $scope.kurs.buttonAction.length > 0 && Kurse.getLastPage() != 'meine';
		//console.log("check = ", check);
		return check;
	};
	// submit dialog show flag
	$scope.kurseSubmitDialog = false;
	// bemerkung model
	$scope.inputBemerkung = "";

	// back button action
	$scope.back = function() {
		Navigation.goBack();
		//$history.goBack();
	};
	
	$scope.start = function() {
		Navigation.go("start");
		//$location.path("/start");
	};
	
	// submit button handler
	$scope.submit = function(action) {
		//console.log('submit ',action);
		if(action == "select") {
			$scope.kurseSubmitDialog = true;
		} else {
			$scope.statusChange('00');
			$("a#kurse_submit").removeClass("ui-btn-active");
		}
	};
	// close dialog button handler
	$scope.closeDialog = function() {
		$("a#kurse_submit").removeClass("ui-btn-active");
		$scope.kurseSubmitDialog = false;
		$scope.inputBemerkung = "";
	};
	
	// anmelden/abmelden status change handler
	$scope.statusChange = function(status) {
		//console.log('change status ',status);
		var bemerkung = (status == "10") ? $scope.inputBemerkung : "";
		//console.log("bemerkung = ", bemerkung);
		var kursInfo = { "kurs_id" : $scope.kurs.kursstammdaten.kurs_id, "anmeldestatus" : status, "bemerkung" : bemerkung };
		//console.log("trying to save...");
		//console.log(kursInfo);
		Kurse.changeStatus(kursInfo);
		// close dialog after submitting if it's opened
		if($scope.kurseSubmitDialog) $scope.kurseSubmitDialog = false;
		$scope.$apply();
		$scope.timeoutId = window.setTimeout(function() {
			window.clearTimeout($scope.timeoutId);
			$("a#kurse_submit").removeClass("ui-btn-active");
			$scope.kurs = Kurse.getKurs($scope.kursId);
			//console.log($scope.kurs);
		}, 10);
	};
	
	$scope.errorHandler = function() {
		if(Kurse.errorFlag) {
			$scope.errorMsg = Kurse.fehlerMessage;
			Kurse.clear();
		}
	};
	
	// init function
	$scope.init = function() {
		$scope.errorMsg = "";
		Kurse.registerHandler($scope.errorHandler);
		var kursId = $routeParams.kursId;
		Navigation.setCurrent({"page" : "kursedetail", "params" : { "kursId" : kursId}});
		$scope.kursId = kursId;
		//console.log(kursId);
		var kursData = Kurse.getKurs(kursId);
		//console.log("kursData: ", kursData);
		if(!angular.equals(kursData,{})) {
			//console.log("NON empty kurs");
			$scope.kurs = kursData;
		} else {
			//console.log("empty kurs");
			var timestamp = new Date();
			Kurse.loadMeine(timestamp);
			$scope.intervalId = window.setInterval(function() {
				//console.log("timeout getKurs");
				var kursDataNew = Kurse.getKurs($routeParams.kursId);
				if(!angular.equals(kursDataNew,{})) {
					$scope.intervalId = window.clearInterval($scope.intervalId);
					$scope.kurs = kursDataNew;
					$scope.$apply();
					//console.log($scope.kurs);
				}
			}, 100);
		}
	};
	
	Auth.load();
	if (Auth.loggedIn()) {
		$scope.init();
	} else {
		Navigation.go("login");
		//$location.url("/login");
	}
}
KurseDetailCtrl.$inject = [ '$scope', 'Navigation', 'Auth', 'Kurse', '$routeParams'];