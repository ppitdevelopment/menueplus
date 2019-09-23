'use strict';

/* Messages page controller */
function MessageCtrl($scope, Navigation, Messages, Auth) {
	$scope.action = function() {
		//console.log("$scope.action()");
		Messages.messages = [];
		Navigation.goBack();
	}
	$scope.restart = function() {
		Messages.messages = [];
		Auth.clear();
		Navigation.go("login");
	};
	$scope.init = function() {
		$scope.messages = {
				messages	: Messages.messages,
				actions		: undefined
		};
		$scope.title = (angular.isDefined(Messages.messages) && Messages.messages.length > 0)? Messages.messages[0].title : "Nachrichten";
		$scope.actionType = Messages.actionType;
	};
	$scope.init();
}
MessageCtrl.$inject = [ '$scope', 'Navigation', 'Messages', 'Auth'];