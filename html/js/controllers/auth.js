'use strict';

/* Authorization controller */
function AuthCtrl($scope, Navigation, Auth, Settings, Connection) {
	//console.log('AuthCtrl');
	//console.log('version: ', Auth.version);
	$scope.ctrlName = "AuthCtrl";
	$scope.logoSrc = _LOGO;
	
	$scope.debug = false;
	$scope.cred = {
		username : "",
		password : ""
	};
	$scope.user = {
		username : "",
		password : ""
	};
	$scope.remember = false;
	$scope.yesno = [ {
		'label' : 'no',
		'value' : false
	}, {
		'label' : 'yes',
		'value' : true
	} ];

	$scope.reset = function() {
		$scope.user = angular.copy($scope.cred);
	};

	$scope.login = function() {
		$scope.cred = angular.copy($scope.user);
		Auth.remember = $scope.remember;
		Auth.login($scope.cred, function(data) {
			//console.log('AuthCtrl success login');
			Navigation.go($scope.userStart);
			/*
			if(angular.isDefined(data.nachrichten)) {
				Messages.setAction(function() {
					Navigation.go(Settings.getStart());
				});
				Navigation.go("error");
			} else {
				Navigation.go($scope.userStart);
			}
			*/
			$scope.$apply();
		}, function() {
			Navigation.go("error");
		});
	};

	$scope.clickCounter = 0;
	$scope.titleClick = function() {
		$scope.clickCounter++;
		if($scope.clickCounter > 4) {
			alert(_URL);
			$scope.clickCounter = 0;
		}
	};

	Connection.reset();
	Auth.load(function() {
		alert("Name: " + Connection.config.name);
		if(!!Connection.config.logo && Connection.config.logo !== "") $scope.logoSrc = Connection.config.logo;
		$scope.userStart = Settings.getStart();
		if (Auth.sessionKey) {
			//console.log("AuthCtrl.userStart: ", $scope.userStart);
			//console.log("AuthCtrl try to resume");
			if(!Settings.realResumeHandler()) Navigation.goCurrent();
		} else {
			$scope.reset();
			Navigation.setCurrent({"page" : "login"});
		}
	});

}
AuthCtrl.$inject = [ '$scope', 'Navigation', 'Auth', 'Settings', 'Connection' ];