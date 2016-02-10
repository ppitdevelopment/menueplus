'use strict';

/* Kalendar kontroller multipage version (v.3) */
function KalenderCtrl3(Navigation, Teilnehmer, $scope, Kalend2, Auth, $routeParams, Settings, $filter) {
	$scope.ctrlName = "KalenderCtrl3";
	//console.log('KalenderCtrl3');
	// current week index
	$scope.shift = parseInt($routeParams.Shift);
	// template page
	$scope.type = $routeParams.Type;
	// structure for current week with two fields:
	// tage - days-info for current week
	// details - angebot-info for current week
	$scope.kalend = { 'tage' : [], 'details' : [] };
	// flag shows that all data for current week is loaded
	$scope.dataReady = false;
	// menue element for currently selected menue
	$scope.selectedMenue = {};
	$scope.selectedMenue.menue = {};
	// image src for currently selected menue
	$scope.selectedMenue.selectedMenueImage = "css/images/essen.png";
	$scope.selectedMenue.selectedMenueClass = "menue-default";
	// parameters of selected menue to send to DB
	$scope.selectedMenue.selectedMenueId = 0;
	$scope.selectedMenue.selectedMenueDate = "";
	// nachricht für menü
	$scope.selectedMenue.menueNachricht = "";
	// empty element for unselecting menu item
	$scope.emptyMenue = {
			"menue_nr" : -1,
			"bild_id" : "",
			"menue_text": "vom Essen abmelden",
			"preis" : 0,
			"ausgewaehlt" : true,
			"allergie_konflikte" : [],
			"ersatzkomponenten": [],
			"zusatzstoffe" : []
	};
	// base url for external images
	//$scope.appUrl = Auth.appUrl;
	$scope.appUrl = _URL;
	// urls for navigation buttons - deprecated
	//$scope.prevUrl = $scope.nextUrl = $scope.aktUrl = "/kalend";
	// selected date wich should be saved for further use
	$scope.selectedDate = Settings.getDate();
	// timeout id
	$scope.timeoutId = undefined;
	$scope.anmeldungText = "Hiermit melde ich mich jeden %tags%, bis auf Widerruf, dauerhaft verbindlich und kostenpflichtig („Abo“) zum Essen an.";
	$scope.abmeldungText = "Hiermit widerrufe ich meine dauerhafte Anmeldung („Abo“) zum Essen am %tags%.";
	$scope.aboText = "";
	$scope.aboTag = 0;
	$scope.aboChange = function(tagIdx) {
		//console.log("aboChange: ", tagIdx);
		$scope.aboTag = tagIdx;
		//console.log("current: ", $scope.abotage);
		//console.log("old: ", $scope.abotageOld);
		Settings.setDate($scope.selectedDate);
		var datum = $scope.kalend.tage[tagIdx].datum;
		var tagName = $filter('date')(datum, 'EEEE');
		var isAnmeldung = $scope.abotage[tagIdx];
		$scope.aboText = (isAnmeldung) ? $scope.anmeldungText : $scope.abmeldungText;
		$scope.aboText = $scope.aboText.replace('%tags%', tagName);
		$("#abotagPopup").popup("open",{'positionTo':'window'});
	};
	$scope.aboModalClose = function() {
		Kalend2.needRefresh = true;
		$scope.dataReady = false;
		$("#abotagPopup").popup("close");
		$scope.init();
	};
	$scope.aboCancel = function() {
		//console.log("cancel abotag: ", $scope.aboTag);
		//console.log("current: ", $scope.abotage[$scope.aboTag]);
		//console.log("old: ", $scope.abotageOld[$scope.aboTag]);
		//$scope.abotage[$scope.aboTag] = $scope.abotageOld[$scope.aboTag];
		// previous line does not work at least in some Android versions :(
		// forced refresh of profile data
		Teilnehmer.refresh();
		$scope.aboModalClose();
	};
	$scope.aboOk = function() {
		var abotageVal = 0;
		angular.forEach($scope.abotage, function(val, key) {
			abotageVal += (val) ? Math.pow(2, key) : 0;
		});
		Kalend2.saveAbo(abotageVal, function(data) {
			// success handling
			//console.log('success: ',data);
			if(data.fehler) {
				$scope.abotage[$scope.aboTag] = $scope.abotageOld[$scope.aboTag];
				if(data.fehler == -2) {
					$scope.aboText = data.fehlermessage;
					Teilnehmer.clearProfileData();
					$scope.aboModalClose();
				} else {
					$scope.aboText = data.fehlermessage;
					//console.log('error: ', data.fehlermessage);
				}
			} else {
				// success
				$scope.abotageOld[$scope.aboTag] = $scope.abotage[$scope.aboTag];
				Teilnehmer.clearProfileData();
				$scope.aboModalClose();
			}
		});
		//$scope.abotage[$scope.aboTag] = !$scope.abotage[$scope.aboTag];
	};
	/*
	 * initialization function
	 */
	$scope.init = function() {
		//console.log("KalenderCtrl3.init");
		// authorization check
		Auth.load(function() {
			//console.log("Date selected:", $scope.selectedDate);
			$scope.abotage = [false,false,false,false,false,false,false];
			$scope.abotageOld = [false,false,false,false,false,false,false];
			$scope.aboTyp = 0;
			var profile = Teilnehmer.getProfile(function(data) {
				// success
				//console.log("getProfile success: ", data.teilnehmer);
				var abotageValue = data.teilnehmer.abotage;
				var newAbotage = [false,false,false,false,false,false,false];
				angular.forEach(newAbotage, function(value, key) {
					var isAbotag = abotageValue & Math.pow(2, key);
					if(isAbotag) {
						this[key] = true;
					}
				}, newAbotage);
				$scope.abotage = angular.copy(newAbotage);
				$scope.abotageOld = angular.copy(newAbotage);
				$scope.aboTyp = data.teilnehmer.essenabotyp;
				//console.log("Abotag init: ", newAbotage);
				//if(Kalend2.started && !Kalend2.needRefresh) $.mobile.loading('hide');
				$scope.$apply();
			}, function(data) {
				// error
				//console.log("error: ", data);
				Navigation.go("error");
			});
			// properties init
			var wShift = parseInt($routeParams.Shift);
			$scope.shift = wShift;
			$scope.type = $routeParams.Type;
			Navigation.setCurrent({"page" : "kalend", "params" : { "type" : $scope.type, "shift" : wShift}});
			//$scope.kalend = { 'tage' : [], 'details' : [] };
			//$scope.dataReady = false;
			$scope.selectedMenue = {};
			$scope.selectedMenue.menue = {};
			$scope.selectedMenue.selectedMenueImage = "css/images/essen.png";
			$scope.selectedMenue.selectedMenueId = 0;
			$scope.selectedMenue.selectedMenueDate = "";
			$scope.selectedMenue.menueNachricht = "";
			$scope.selectedMenue.selectedMenueClass = "menue-default";
			//$scope.appUrl = Auth.serverURL;
			if (Auth.sessionKey) {
				$scope.sessionKey = Auth.sessionKey;
				if(!Kalend2.started || Kalend2.needRefresh) {
					// set up redirect handler if it is not set yet
					if(Kalend2.cacheRefreshHandler == undefined)
						Kalend2.cacheRefreshHandler = function() {
							//alert("previous path: " + $location.path());
							//console.log("Kalend2: ",Kalend2);
							//$location.path("/login");
							//console.log("shift: ",wShift);
							Kalend2.init();
							//$scope.$apply();
						};
					Kalend2.init();
					//if(!Kalend2.started) {
					Kalend2.addTagSuccessHandler($scope.successTagHandler);
					Kalend2.addDetailSuccessHandler($scope.successDetailHandler);
					Kalend2.addTagErrorHandler($scope.errorHandler);
					Kalend2.addDetailErrorHandler($scope.errorHandler);
					//};
					Kalend2.getWoche(wShift);
				} else {
					//console.log('KalenderCtrl3.init second run. shift: ',wShift);
					var wResult = Kalend2.getWoche(wShift);
					//var dResult = Kalender.getDetailedWoche($scope.shift);
					//console.log('KalenderCtrl3.init second run. kalend: ', wResult);
					$scope.kalend = wResult;
					/*
					 if(Kalender.dataIsEmpty()) {
					 //console.log('KalenderCtrl2.init empty data found. Reinitialization!');
					 Kalender.clearCache();
					 Kalender.init();
					 Kalender.addErrorHandler($scope.errorHandler);
					 Kalender.addSuccessHandler($scope.successHandler);
					 } else {
					 $scope.tage = wResult;
					 $scope.angebote = dResult;
					 }*/
				}
			} else {
				//console.log('KalenderCtrl2.init auth error!');
				Navigation.go('login');
				//$location.path("/login");
			}
			$scope.$apply();
		});
	};
	
	/*
	 * functions for kalender data handling
	 */
	$scope.successTagHandler = function() {
		//console.log("successTagHandler");
		var res = Kalend2.getWoche($scope.shift);
		if(res) {
			$scope.kalend = res;
			$scope.dataReady = true;
			$scope.$apply();
			//console.log("data received: ", $scope.kalend);			
		}
	};
	$scope.successDetailHandler = function() {
		//console.log("successDetailHandler");
		var res = Kalend2.getWoche($scope.shift);
		if(res) {
			$scope.kalend = res;
			//console.log("data received: ", res);
			$scope.dataReady = true;
			if($scope.kalend.details && $scope.kalend.details.length > 0 && $scope.kalend.details.detail_kostenarten)
				$scope.selectedMenue.menue = angular.copy($scope.kalend.details[0].detail_kostenarten[0].kostenarten[0].menues[0]);
			$scope.$apply();
		}
	};
	// error handler for Kalender
	$scope.errorHandler = function(errCode) {
		Settings.setDate($scope.selectedDate);
		//console.log("$scope.errorHandler: ", errCode);
		if(errCode == -2) { // authorization error
			if(Auth.saved) {
				Auth.login(Auth.cred, function() {
					// success handler
					Auth.save();
					//console.log('Auth success. reinitializing');
					Kalend2.needRefresh = true;
					$scope.dataReady = false;
					$scope.timeoutId = window.setTimeout($scope.init, 100);
					//$scope.init();
				}, function() {
					// error handler
					Auth.clear();
					Kalend2.needRefresh = true;
					//console.log('Auth fail. redirecting to login page...');
					Navigation.go('login');
					//$location.path("/login");
					$scope.$apply();
				});
			} else {
				//console.log('Session expired. Credentials not saved. Redirecting to login page...');
				Auth.clear();
				Kalend2.needRefresh = true;
				Navigation.go('login');
				//$location.path('/login');
				$scope.$apply();
			}
		} else if(errCode == 2) { // database server error
			//console.log("KalenderCtrl2.errorHandler server error redirect");
			//showError("Authorization expired. Reconnecting...");
			//Navigation.go("error");
			Navigation.go('kalend',{shift: $scope.shift});
			//var reloadUrl = $scope.aktUrl.slice(0,-1) + $scope.shift;
			//$location.path(reloadUrl);
			$scope.$apply();
			//$scope.timeoutId = setTimeout($scope.redirectUrl(reloadUrl), 1000);
		} else {
			//console.log("KalenderCtrl2.errorHandler unknown error.");
			//showError("Database error. Call People & Projects IT for answers.");
			Navigation.go("error");
			Kalend2.needRefresh = true;
			//$scope.dataReady = false;
			//$scope.timeoutId = window.setTimeout($scope.init, 10000);
		}
		//$.mobile.loading('hide');
		//$scope.$apply();
		//return false;
	};
	
	/*
	 * functions for navigation buttons
	 */
	// go to previous week
	$scope.prevWoche = function() {
		Settings.setDate($scope.selectedDate);
		//var url = $scope.prevUrl;
		//console.log('redirecting to: ', url);
		/*
		$location.routeOverride({
			jqmOptions : {
				reverse : true
			}
		});*/
		window.clearTimeout($scope.timeoutId);
		Navigation.go('kalend',{shift: $scope.shift - 1, type: $scope.type});
		//$location.path(url);
	};
	
	// go to next week
	$scope.nextWoche = function() {
		Settings.setDate($scope.selectedDate);
		//var url = $scope.nextUrl;
		//console.log('redirecting to: ', url);
		window.clearTimeout($scope.timeoutId);
		Navigation.go('kalend',{shift: $scope.shift + 1, type: $scope.type});
		//$location.path(url);
	};
	
	// go to actual week
	$scope.aktWoche = function() {
		Settings.setDate(Settings.getToday());
		//var url = $scope.aktUrl;
		//console.log('redirecting to: ', url);
		window.clearTimeout($scope.timeoutId);
		Navigation.go('kalend',{shift: 0, type: $scope.type});
		//$location.path(url);
	};
	
	// go to start page
	$scope.start = function() {
		Settings.setDate($scope.selectedDate);
		window.clearTimeout($scope.timeoutId);
		Navigation.go('start');
		//$location.path("/start");
	};
	
	// go to vertretungsplan page
	$scope.vertretungsplan = function() {
		Settings.setDate($scope.selectedDate);
		window.clearTimeout($scope.timeoutId);
		Navigation.go('vertretungsplan');
	};
	
	// go to kurs details page
	$scope.kurseDetails = function(id) {
		Settings.setDate($scope.selectedDate);
		window.clearTimeout($scope.timeoutId);
		Navigation.go('kursedetail', {kursId : id});
	};

	/*
	 * functions for template generation
	 */
	// check if the given date is today date
	// or if the date was previously selected by user
	$scope.isToday = function(d) {
		//console.log("isToday? ", d);
		//var td = new Date($scope.selectedDate);
		var savedDate = Settings.getDate();
		var td = new Date();
		if(savedDate) td = createDate(savedDate);
		var rd = createDate(d);
		//console.log(td.toDateString() == rd.toDateString());
		return td.toDateString() == rd.toDateString();
	};
	// check if in the day structure "angebote" and "events" arrays are empty
	$scope.isEmptyDay = function(t) {
		var al = t.angebote.length;
		var el = t.events.length;
		return al+el == 0;
	};
	// this function should return "true" if user has selected menu for this day
	$scope.isAngemeldet = function(tag) {
		var res = false;
		for(var i = 0; i < tag.angebote.length; i++) {
			var angebot = tag.angebote[i];
			// select only "Essensgeld" detail_kostenart ids
			if(angebot.detail_kostenart_id == "5946B518504DCEF79B6D74589C54D4D3") {
				if(angebot.angemeldet == 1) res = true;
			}
		}
		return res;
	};
	// this function should return "true" if Abotag is selected for this day
	$scope.isAbotag = function(tagIdx) {
		var d = createDate($scope.kalend.tage[tagIdx].datum);
		var td = new Date(); // today
		//console.log("datum: ", d, " today:", td);
		return ($scope.abotageOld[tagIdx]) && (d >= td);
	};
	// this function should return "true" if user has courses for this day
	$scope.hasCourses = function(tag) {
		var res = false;
		for(var i = 0; i < tag.angebote.length; i++) {
			var angebot = tag.angebote[i];
			// select all except "Essensgeld" detail_kostenart ids
			if(angebot.detail_kostenart_id != "5946B518504DCEF79B6D74589C54D4D3") res = true;
		}
		return res;
	};
	// returns "true" if there are any menues selectable for this day
	$scope.hasMenues = function(tag) {
		var res = false;
		for(var i = 0; i < tag.angebote.length; i++) {
			var angebot = tag.angebote[i];
			// select all "Essensgeld" detail_kostenart ids
			if(angebot.detail_kostenart_id == "5946B518504DCEF79B6D74589C54D4D3") res = true;
		}
		return res;
	};
	// returns "true" if there are any events for this day
	$scope.hasEvents = function(t) {
		var al = t.events.length;
		return al > 0;
	};
	// returns image src for selected menue
	$scope.getImageSrc = function(menue) {
		var iSrc = (menue.bild_id == '' || menue.bild_id == undefined)? 'css/images/essen.png' : _URL + '/img/cache/customer' + Settings.getCustomerID() + '/' + menue.bild_id + '.jpg?sk=' + Auth.sessionKey;
		//console.log('image src:',iSrc);
		return iSrc;
	};
	// returns human friendly name of "detail kostenart"
	$scope.getDetailTitle = function(tag, detail) {
		//console.log(tag);
		//console.log(detail);
		switch(detail) {
		case "5946B518504DCEF79B6D74589C54D4D3":
			return "Essen";
			break;
		case "1F40F57378133B73054B09A391A4FF7E":
			return "Kurse";
			break;
		}
		return detail + " - Unknown";
	};
	$scope.isAbotageEnabled = function(tag, detail) {
		//console.log("isAbotageEnabled tag:", tag);
		return (detail.detail_kostenartart_id == "5946B518504DCEF79B6D74589C54D4D3") && (detail.kostenarten[0].aenderbar == "1") && ($scope.aboTyp == 0);
	};

	/*
	 * functions for menues selection and saving it to DB
	 */
	$scope.selectMenue = function(tagIdx,detailIdx,angebotIdx,index) {
		console.log("selectMenue");
		//alert("$scope.selectedDate: " + $scope.selectedDate);
		Settings.setDate($scope.selectedDate);
		var l = $scope.kalend.details[tagIdx].detail_kostenarten[detailIdx].kostenarten[angebotIdx].menues.length;
		for(var i = 0; i<l; i++) {
			if(i != index) $scope.kalend.details[tagIdx].detail_kostenarten[detailIdx].kostenarten[angebotIdx].menues[i].ausgewaehlt = "0";
		}
		if(index < l) {
			$scope.kalend.details[tagIdx].detail_kostenarten[detailIdx].kostenarten[angebotIdx].menues[index].ausgewaehlt = "1";
			$scope.selectedMenue.menue = angular.copy($scope.kalend.details[tagIdx].detail_kostenarten[detailIdx].kostenarten[angebotIdx].menues[index]);
			$scope.selectedMenue.selectedMenueImage = $scope.getImageSrc($scope.kalend.details[tagIdx].detail_kostenarten[detailIdx].kostenarten[angebotIdx].menues[index]);
			if($scope.kalend.details[tagIdx].detail_kostenarten[detailIdx].kostenarten[angebotIdx].menues[index].bild_id != "") {
				$scope.selectedMenue.selectedMenueClass = "menue-pic";
			} else {
				$scope.selectedMenue.selectedMenueClass = "menue-default";
			}
		} else {
			$scope.selectedMenue.menue = angular.copy($scope.emptyMenue);
			$scope.selectedMenue.selectedMenueImage = "css/images/essen.png";
			$scope.selectedMenue.selectedMenueClass = "menue-default";
		}
		$scope.selectedMenue.selectedMenueId = $scope.kalend.details[tagIdx].detail_kostenarten[detailIdx].kostenarten[angebotIdx].kostenart_id;
		//$scope.selectedMenue.selectedMenueDate = formatDate(new Date($scope.kalend.details[tagIdx].datum));
		//console.log($scope.selectedDate);
		var d = createDate($scope.selectedDate);
		//alert("createDate($scope.selectedDate): " + d);
		$scope.selectedMenue.selectedMenueDate = formatDate(d);
		//alert("$scope.selectedMenue.selectedMenueDate: " + $scope.selectedMenue.selectedMenueDate);
		console.log("selectMenue", $scope.selectedMenue);
		$scope.menueNachricht = "";
		$scope.nachricht_sekretariat = Kalend2.nachricht_sekretariat;
		$("#postResult").html("");
		$("#menuePopup").popup("open",{'positionTo':'window'});
	};
	$scope.menueCancel = function() {
		//console.log("new cancel");
		$("#menuePopup").popup("close");
		$scope.cleanMenueDialog();
		Kalend2.needRefresh = true;
		$scope.dataReady = false;
		$scope.init();
	};
	$scope.menueOk = function() {
		//console.log('menue selected!');
		$("#postResult").html("");
		// prepare auswahl structure
		var auswahl = {'kostenart_id':'','nachricht':'','essen':{}};
		auswahl.kostenart_id = angular.copy($scope.selectedMenue.selectedMenueId);
		auswahl.nachricht = angular.copy($scope.selectedMenue.menueNachricht);
		auswahl.essen = {'datum' : '','menue_nr':0,'komponenten':[]};
		auswahl.essen.menue_nr = 1 * $scope.selectedMenue.menue.menue_nr;
		auswahl.essen.datum = $scope.selectedMenue.selectedMenueDate;
		auswahl.essen.komponenten = [];
		if(angular.isDefined($scope.selectedMenue.menue.ersatzkomponenten)) {
			var l = $scope.selectedMenue.menue.ersatzkomponenten.length;
			if(l > 0) {
				for(var i = 0; i < l; i++) {
					if($scope.selectedMenue.menue.ersatzkomponenten[i].ausgewaehlt == true || $scope.selectedMenue.menue.ersatzkomponenten[i].ausgewaehlt == 1) {
						auswahl.essen.komponenten.push($scope.selectedMenue.menue.ersatzkomponenten[i].speise_id);
					}
				}
			}
		}
		//alert(angular.toJson(auswahl));
		//console.log("menue selected: ", auswahl);
		Kalend2.saveMenue(auswahl, function(data) {
			// success handling
			//console.log('success: ',data);
			if(angular.isDefined(data.fehler) && data.fehler != 0) {
				//Kalender.clearCache();
				$("#postResult").html(data.fehlermessage);
				//console.log('error: ', data.fehlermessage);
			} else {
				// success
				$("#menuePopup").popup("close");
				$scope.cleanMenueDialog();
				Kalend2.needRefresh = true;
				$scope.dataReady = false;
				$scope.init();
			}
		}, function(data) {
			if(angular.isDefined(data.fehlermessage) && data.fehlermessage != "") {
				$("#postResult").html(data.fehlermessage);
				console.error('error: ', data.fehlermessage);
			}
		});
		//$scope.$apply();
	};
	
	$scope.cleanMenueDialog = function() {
		$scope.selectedMenue = {};
		$scope.selectedMenue.menue = {};
		$scope.selectedMenue.selectedMenueImage = "css/images/essen.png";
		$scope.selectedMenue.selectedMenueId = 0;
		$scope.selectedMenue.selectedMenueDate = "";
		$scope.selectedMenue.menueNachricht = "";
		$scope.selectedMenue.selectedMenueClass = "menue-pic";
	};
	
	/*$scope.redirectPage = function(url) {
		console.log("redirectPage: ", url);
		$location.path(url);
		$scope.$apply();
	};*/
	
	/*
	 * Date selection handler
	 * function must save last selected date to settings storage
	 */
	$scope.datumSelect = function(e, d) {
		//console.log("datumSelect 4: ", d);
		$scope.selectedDate = d;
		//console.log("datumSelect saved: ", $scope.selectedDate);
		// here should be this call:
		//Settings.setDate(d);
		// but it do not work properly
		// so this way it works:
		//window.localStorage.setItem("datum", d);
		//console.log("Date in Settings: ", Settings.getDate());
	};

	// run init functions once per page loading
	$scope.init();
}
KalenderCtrl3.$inject = ['Navigation', 'Teilnehmer', '$scope', 'Kalend2', 'Auth', '$routeParams', 'Settings', '$filter'];