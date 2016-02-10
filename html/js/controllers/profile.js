'use strict';

/* Profile controller */
function ProfileCtrl(Teilnehmer, $scope, Navigation, Auth, Settings, Messages) {
	//console.log('ProfileCtrl');
	$scope.ctrlName = "ProfileCtrl";
	$scope.photoEditable = false;
	$scope.pages = [];
	
	$scope.user = {};
	$scope.user.userFullName = "Bitte warten...";
	$scope.user.userPic = "css/images/default.png";
	$scope.user.gender = 0;
	
	$scope.pwd = {};
	$scope.pwd.pwd1 = "";
	$scope.pwd.pwd2 = "";
	$scope.pwd.error = "";

	// go to start page
	$scope.start = function() {
		Navigation.go("start");
		//$location.path("/start");
	};
	
	$scope.closePopup = function() {
		$("a#options").removeClass("ui-btn-active");
		$("a#password").removeClass("ui-btn-active");
		$("#passwordEdit").popup("close");
		$("#optionsEdit").popup("close");
	};
	
	// opens "Options" dialog
	$scope.editOptions = function() {
		$("#optionsEdit").popup("open");
		//console.log("popup");
	};

	// opens "Password" dialog
	$scope.editPassword = function() {
		$scope.pwd.pwd1 = "";
		$scope.pwd.pwd2 = "";
		$scope.pwd.error = "";
		$("#passwordEdit").popup("open");
		//console.log("popup");
	};
	
	// saves new Password
	$scope.savePassword = function() {
		if($scope.pwd.pwd1 != "" && $scope.pwd.pwd1 != $scope.pwd.pwd2) {
			$scope.pwd.error = "Bitte denselben Wert wiederholen.";
			$scope.$apply();
		}
		if($scope.pwd.pwd1 != "" && $scope.pwd.pwd1 == $scope.pwd.pwd2) {
			//console.log(Auth.authUrl + "&act=profile&sk=" + Auth.sessionKey);
			Teilnehmer.savePassword($scope.pwd.pwd1, function(data) {
				//console.log("savePassword: ", data);
				// check if there is error code
				if(data.fehler != 0) {
					//console.log("Setting errortext: ", data.fehlermessage);
					$scope.pwd.error = data.fehlermessage;
					$scope.$apply();
				} else {
					// success
					$scope.pwd.error = "";
					if(Auth.remember) Auth.cred.password = $scope.pwd.pwd1;
					Auth.save();
					$("#passwordEdit").popup("close");
				}
			});
		}
		$("a#password").removeClass("ui-btn-active");
	};
	
	// check if option is selected and saves it
	$scope.saveOptions = function() {
		Settings.setStart($scope.startSeite);
		//console.log("$scope.saveOptions" , Settings.getStart());
		$("#optionsEdit").popup("close");
		$("a#options").removeClass("ui-btn-active");
	};
	
	$scope.loadProfile = function() {
		//console.log('loadProfile()');
		Teilnehmer.getProfile(function(data) {
			//console.log("loadProfile: ", data);
			if(data.fehler == 0) {
				// successfully loaded data
				$scope.user.userFullName = data.teilnehmer.vorname + " " + data.teilnehmer.name;
				$scope.user.gender = data.teilnehmer.geschlecht_id;
				if(data.teilnehmer.bild_id == "") {
					if(data.teilnehmer.geschlecht_id == 1) {
						$scope.user.userPic = "css/images/schoolgirl.png";
					} else {
						$scope.user.userPic = "css/images/schoolboy.png";
					}
				} else {
					$scope.user.userPic = _URL + '/img/cache/customer' + Settings.getCustomerID() + '/' + data.teilnehmer.bild_id + '.jpg?v=' + Math.floor((Math.random()*10)+1) + '&sk=' + Auth.sessionKey;
					/*
					$.get($scope.user.userPic, function(data) {
						alert('image request result: ' + data);
					});*/
				}
				$scope.$apply();
			}
		});
	};
	
	$scope.fotoMenu = function() {
		//console.log("fotoMenu click: isEditable: ", $scope.photoEditable);
		if($scope.photoEditable && _PLATFORM !== "android") $("#fotoSelect").popup("open");
	};
	
	$scope.removeFoto = function() {
		var btn = $("#fotoSelect a#fotodelete").get(0);
		$(btn).removeClass("ui-btn-active");
		//console.log(btn);
		$("#fotoSelect").popup("close");
		Teilnehmer.deleteFoto(function(data) {
			// success handler
			//console.log(data);
			// success in removing image
			//var img = document.getElementById('profile-pic');
			if($scope.user.gender == 1) {
				$scope.user.userPic = "css/images/schoolgirl.png";
			} else {
				$scope.user.userPic = "css/images/schoolboy.png";
			}
			$scope.$apply();
			//alert(data.message);
		});
	};
	
	$scope.uploadFoto = function(type) {
		var popover = {};
		try {
			popover = new navigator.camera.CameraPopoverOptions(300,300,100,100,Camera.PopoverArrowDirection.ARROW_ANY);
		} catch(e) {}
		try {
			var options = {
					// options
					quality : 80,
					destinationType : navigator.camera.DestinationType.FILE_URI,
					allowEdit : true,
					encodingType: navigator.camera.EncodingType.JPEG,
					targetWidth: 400,
					targetHeight: 400,
					mediaType: navigator.camera.MediaType.PICTURE,
					correctOrientation: true,
					popoverOptions: popover,
					saveToPhotoAlbum: false,
				}; 
			switch(type) {
			case 1: // back camera
				options.sourceType = navigator.camera.PictureSourceType.CAMERA;
				$("a#camera").removeClass("ui-btn-active");
				break;
			case 2: // foto album
				options.sourceType = navigator.camera.PictureSourceType.PHOTOLIBRARY;
				$("a#fotolib").removeClass("ui-btn-active");
				break;
			}
			var dialog = navigator.camera.getPicture(function(imageURI) {
				// success handler
				var options = new FileUploadOptions();
				options.params = {};
				options.params.sk = Auth.sessionKey;
				//options.params.upload = "bild";
				options.fileKey = "bild";
				options.fileName = imageURI.substr(imageURI.lastIndexOf('/')+1);
				options.mimeType = "image/jpeg";
				options.chunkedMode = false; 
				var ft = new FileTransfer();
				$.mobile.loading('show');
				ft.upload(imageURI, encodeURI(_URL + "/index.php?act=profile&do=upload"), function(response) {
					var result = angular.fromJson(response.response);
					if(result.fehler != 0) {
						//alert(result.fehlermessage);
						Message.addMessage("err","Stammdaten Fehler", result.fehlermessage);
					} else {
						var img = document.getElementById('profile-pic');
						var isDefault = img.src.lastIndexOf('school');
						if(isDefault > 0) {
							// we need to make a full refresh to get bild_id
							$scope.loadProfile();
						} else {
							// we have an id and it is possible to refresh only image src
							var hasV = img.src.lastIndexOf('?');
							var oldSrc = img.src;
							if(hasV > 0) oldSrc = img.src.substr(0,img.src.lastIndexOf('?'));
							//alert(oldSrc);
							img.src = imageURI;
							var newImgSrc = oldSrc + "?v=" + Math.floor((Math.random()*10)+1) + '&sk=' + Auth.sessionKey;
							//alert(newImgSrc);
							img.src = newImgSrc;
							$scope.user.userPic = newImgSrc;
							$scope.$apply();
						}
					}
					$.mobile.loading('hide');
				}, function(error) {
					var message = "";
					switch(error.code) {
					case FileTransferError.FILE_NOT_FOUND_ERR:
						message = "File " + error.source + " not found";
						break;
					case FileTransferError.INVALID_URL_ERR:
						message = "Invalid URL: " + error.target;
						break;
					case FileTransferError.CONNECTION_ERR:
						message = "Connection failure";
						break;
					case FileTransferError.ABORT_ERR:
						message = "Connection aborted";
						break;
					}
					$.mobile.loading('hide');
					Message.addMessage("err","Stammdaten Fehler", "Fehler: " + message + ".");
				}, options, true);
				// iOS: alert should be wrapped to avoid bug
				/*
				setTimeout(function() { 
					alert('Success: '+imageURI);
				}, 0);
				*/			
			}, function(message) {
				// error handler
				// iOS: alert should be wrapped to avoid bug
				$scope.timeoutId = setTimeout(function() {
					Message.addMessage("err","Stammdaten Fehler", "Fehler: " + message + ".");
					//alert('Fehler: ' + message);
				}, 0);
				$.mobile.loading('hide');
			}, options);
		} catch(e) {
			$scope.timeoutId = setTimeout(function() { 
				//alert('Fehler: ' + e.message);
				Message.addMessage("err","Stammdaten Fehler", "Fehler: " + e.message + ".");
			}, 0);			
		} finally {
			$("#fotoSelect").popup("close");
		}
	};
	
	Auth.load(function() {
		if (Auth.loggedIn()) {
			//$scope.pages = Auth.pages;
			$scope.pages = [];
			for(var page in Auth.pages) {
				var title = "";
				var name = "null";
				switch(Auth.pages[page]) {
					case "willkommen":
						name = "start";
						title = "Start";
						break;
					case "calendar":
						name = "kalend";
						title = "Kalender";
						break;
					case "konto":
						name = "konto";
						title = "Kontoauszug";
						break;
					case "stammdaten":
						name = "profile";
						title = "Stammdaten";
						break;
					case "kurse":
						name = "kurse";
						title = "Kurse";
						break;
					default:
						name = "null";
						break;
				}
				if(name != "null") $scope.pages.push({ "name" : name, "title" : title});
			};
			// start page to go after login screen
			$scope.startSeite = Settings.getStart();
			$scope.photoEditable = (angular.isDefined(Auth.rights) && angular.isDefined(Auth.rights.profilfoto_aendern))? Auth.rights.profilfoto_aendern == 1 : false;
			//console.log("ProfileCtrl: ", $scope.startSeite);
			$scope.loadProfile();
			Navigation.setCurrent({"page" : "profile"});
		} else {
			Navigation.go("login");
			//$location.url("/login");
		}
	});
}
ProfileCtrl.$inject = [ 'Teilnehmer', '$scope', 'Navigation', 'Auth', 'Settings', 'Messages' ];