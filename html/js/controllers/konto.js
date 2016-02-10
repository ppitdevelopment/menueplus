'use strict';

/* Konto controller */
function KontoCtrl($scope, Navigation, Auth, Settings, Datasource) {
	//console.log('KontoCtrl');
	$scope.ctrlName = "KontoCtrl";
	$scope.buchungen = new Array();
	// go to start page
	$scope.start = function() {
		Navigation.go("start");
		//$location.path("/start");
	};
	$scope.startDate = "";
	$scope.endDate = "";
	$scope.selectedStartDate = "";
	$scope.selectedEndDate = "";
	$scope.startGuthaben = 0;
	$scope.endGuthaben = 0;
	$scope.aktuellSaldo = 0;
	$scope.debug = "init";
	$scope.isLoaded = false;
	
	$scope.init = function() {
		//console.log('KontoCtrl.init');
		var sDate = new Date();
		sDate.setDate(1);
		$scope.startDate = formatDate(sDate);
		var eDate = new Date();
		//eDate.setMonth(eDate.getMonth()+1,0);
		$scope.endDate = formatDate(eDate);
		$scope.selectedStartDate = $scope.startDate;
		$scope.selectedEndDate = $scope.endDate;
		$("input#startDate").mobiscroll().date({
	        theme: 'jqm',
	        lang: 'de',
	        mode: 'scroller',
	        animate: 'none',
	        startYear: sDate.getFullYear() - 1,
	        endYear: sDate.getFullYear(),
	        maxDate: eDate,
	        onSelect: function(valueText, inst) {
	        	var sDate = createDate(parseDate(valueText));
	        	var eDate = createDate(parseDate($("input#endDate").val()));
	        	if(sDate > eDate) {
	        		$("input#endDate").mobiscroll('setDate', sDate, true);
	        	}
	        	$scope.load();
	        }
	    });
		$("input#startDate").mobiscroll('setDate',sDate);
		$("input#endDate").mobiscroll().date({
	        theme: 'jqm',
	        lang: 'de',
	        mode: 'scroller',
	        animate: 'none',
	        startYear: sDate.getFullYear() - 1,
	        endYear: sDate.getFullYear(),
	        maxDate: eDate,
	        onSelect: function(valueText, inst) {
	        	var eDate = createDate(parseDate(valueText));
	        	var sDate = createDate(parseDate($("input#startDate").val()));
	        	if(sDate > eDate) {
	        		$("input#startDate").mobiscroll('setDate', eDate, true);
	        	}
	        	$scope.load();
	        }
	    });
		$("input#endDate").mobiscroll('setDate',eDate);
		$scope.load();
	};
	
	$scope.load = function() {
		//console.log('KontoCtrl.load');
		$scope.isLoaded = false;
		var params = {
				'sk'	: Auth.sessionKey,
				'sd'	: $scope.selectedStartDate,
				'ed'	: $scope.selectedEndDate
		};
		//console.log(params);
		Datasource.request('konto', params, function(data) {
			//console.log("details received");
			$scope.debug = "details received";
			if (data) {
				// data handling
				//console.log("new konto data received.");
				//console.log(data);
				$scope.buchungen = angular.copy(data.buchungen);
				if(data.buchungen.length > 0) {
					var last = 0;
					for(var obj in data.buchungen) {
						last++;
					}
					//console.log("length=" + last);
					var startBuchung = data.buchungen[last-1];
					var endBuchung = data.buchungen[0];
					//console.log('buchungen:');
					//console.log(startBuchung);
					//console.log(endBuchung);
					$scope.startGuthaben = startBuchung.saldo - startBuchung.betrag; 
					$scope.endGuthaben =  endBuchung.saldo;
				}
				$scope.aktuellSaldo = data.saldoAktuell;
				$scope.startDate = $scope.selectedStartDate;
				$scope.endDate = $scope.selectedEndDate;
				$scope.debug = "success: " + angular.toJson(data);
				$scope.isLoaded = true;
				$scope.$apply();
				//console.log($scope.buchungen);
				$("a#load").removeClass("ui-btn-active");
			}
		});
	};
	
	Auth.load(function() {
		if (Auth.loggedIn()) {
			// main code here
			$scope.init();
			Navigation.setCurrent({"page" : "konto"});
		} else {
			Navigation.go("login");
			//$location.url("/login");
		}
	});

}
KontoCtrl.$inject = [ '$scope', 'Navigation', 'Auth', 'Settings', 'Datasource' ];