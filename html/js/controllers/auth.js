'use strict';

/* Authorization controller */
function AuthCtrl($scope, Navigation, Auth, Settings) {
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
	
	Auth.load(function() {
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
AuthCtrl.$inject = [ '$scope', 'Navigation', 'Auth', 'Settings' ];