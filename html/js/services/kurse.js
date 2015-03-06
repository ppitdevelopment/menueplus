'use strict';
/* Kurse service v.1 */
var KurseSvc = ppitServices.factory('Kurse', ['Auth', 'Datasource', function(Auth, Datasource) {
	//console.log("Kurse service v.1 loading...");
	// define the local namespace
	var Kurse = {};
	Auth.load();
	// timestamp of last database load
	Kurse.lastRefresh = 0;
	// last type of page data loaded
	Kurse.lastPage = 'index';
	// timelimit of cache in milliseconds
	Kurse.cacheLimit = 60000;
	// kurse resource
	/*
	Kurse.url = Auth.appUrl + '/index.php?act=kurse&get=:get&sk=:sk';
	Kurse.kurseList = $resource(Kurse.url, { get: 'index' },
			{ 'meine' : {method: 'GET', params: {'get' : 'meine'}},
				'save': {method: 'POST', params: {'get' : 'none'}}});
	*/
	// currently selected kurs
	Kurse.currentKurs = {};
	// cached Kurse resource
	Kurse.kurse = [];
	// cached MeineKurse resource
	Kurse.meineKurse = [];
	// Zahlungs Periode
	Kurse.perioden = ['N/A', 'Monatlich', '14-tägig', 'Jährlich', 'Wöchentlich', 'Pro Quartal', 'Einmalig', 'Täglich'];
	// error handling
	// error popup flag
	Kurse.errorFlag = false;
	// error message and popup text
	Kurse.fehlerMessage = "";
	// error code
	Kurse.errorCode = 0;
	
	Kurse.load = function(timestamp, handler) {
		//console.log(Auth.sessionKey);
		Auth.load();
		// check if cache timelimit has passed
		if(Kurse.kurse.length == 0 || timestamp.valueOf() - Kurse.lastRefresh > Kurse.cacheLimit) {
			//console.log("loading kurse: ", Auth.sessionKey);
			Datasource.request('kurse-index', {'sk' : Auth.sessionKey}, function(data) {
				if(angular.isDefined(data) && data.fehler == 0) {
					if(Kurse.errorFlag) Kurse.clearError();
					// prepare data for view (some parsing done in parseKurs() function)
					angular.forEach(data.kursliste, Kurse.parseKurs, data.kursliste);
					var cd = new Date();
					Kurse.lastRefresh = cd.valueOf();
					Kurse.kurse = data;
					if(handler) handler(data);
				} else {
					// error in request data
					if(angular.isDefined(data) && angular.isDefined(data.fehlermessage)) {
						Kurse.raiseError(data.fehler, data.fehlermessage);
					} else Kurse.raiseError(-4, "Incorrect data received!");
				}
			}, function(data) {
				// error connecting to server
				Kurse.raiseError(-1, "Error connecting to the server!");
				//console.log(data);
			});
			
			/*
			Kurse.kurse = Kurse.kurseList.get({'sk' : Auth.sessionKey}, function(data) {
				if(angular.isDefined(data) && data.fehler == 0) {
					if(Kurse.errorFlag) Kurse.clearError();
					// prepare data for view (some parsing done in parseKurs() function)
					angular.forEach(data.kursliste, Kurse.parseKurs, data.kursliste);
					var cd = new Date();
					Kurse.lastRefresh = cd.valueOf();
				} else {
					// error in request data
					if(angular.isDefined(data) && angular.isDefined(data.fehlermessage)) {
						Kurse.raiseError(data.fehler, data.fehlermessage);
					} else Kurse.raiseError(-4, "Incorrect data received!");
				}
			}, function(data) {
				// error connecting to server
				Kurse.raiseError(-1, "Error connecting to the server!");
				console.log(data);
			});
			*/
		} else {
			if(handler) handler(Kurse.kurse);
		}
		Kurse.lastPage = 'index';
		return Kurse.kurse;
	}

	Kurse.loadMeine = function(timestamp, handler) {
		Auth.load();
		// check if cache timelimit has passed
		if(Kurse.meineKurse.length == 0 || timestamp.valueOf() - Kurse.lastRefresh > Kurse.cacheLimit) {
			//console.log("loading-meine...");
			//console.log("loading meine kurse: ", Auth.sessionKey);
			Datasource.request('kurse-meine', {'sk' : Auth.sessionKey}, function(data) {
				if(angular.isDefined(data) && data.fehler == 0) {
					if(Kurse.errorFlag) Kurse.clearError();
					// prepare data for view (some parsing done in parseKurs() function)
					angular.forEach(data.kursliste, Kurse.parseKurs, data.kursliste);
					var cd = new Date();
					Kurse.lastRefresh = cd.valueOf();
					Kurse.meineKurse = data;
					if(handler) handler(data);
				} else {
					// error in request data
					if(angular.isDefined(data) && angular.isDefined(data.fehlermessage)) {
						Kurse.raiseError(data.fehler, data.fehlermessage);
					} else Kurse.raiseError(-4, "Incorrect data received!");
				}
			}, function(data) {
				// error connecting to server
				Kurse.raiseError(-1, "Error connecting to the server!");
				//console.log(data);
			});
		} else {
			if(handler) handler(Kurse.meineKurse);
		}
		Kurse.lastPage = 'meine';
		//return Kurse.meineKurse;
	}
	
	Kurse.changeStatus = function(statusData) {
		//console.log("Kurse.changeStatus");
		Auth.load();
		var params = {
				"sk"		: Auth.sessionKey,
				"set"		: "kurse",
				"anmeldung"	: statusData
		};
		Datasource.request('kurse-save', params, function(data) {
			//console.log("success");
			//console.log(data.kurs);
			if(angular.isDefined(data) && data.fehler == 0) {
				if(Kurse.errorFlag) Kurse.clearError();
				var editedKursList = [];
				editedKursList.push(data.kurs);
				//console.log("preparsed kurs list:", editedKursList);
				angular.forEach(editedKursList, Kurse.parseKurs, editedKursList);
				//console.log("postparsed kurs list:", editedKursList);
				var editedKurs = editedKursList[0];
				//console.log("editedKurs ", editedKurs);
				var found = false;
				// search for kurs in cached arrays
				//console.log("search for kurs in cached arrays:");
				//console.log("edited kurs id ", editedKurs.kursstammdaten.kurs_id);
				angular.forEach(Kurse.kurse.kursliste, function(value, key) {
					//console.log("selected kurs id ", value.kursstammdaten.kurs_id);
					if(!found && value.kursstammdaten.kurs_id == editedKurs.kursstammdaten.kurs_id) {
						found = true;
						//console.log(found);
						this[key] = editedKurs;
					}
				}, Kurse.kurse.kursliste);
				// if not found try to look in meinekurse array
				if(!found && Kurse.meineKurse.kursliste) angular.forEach(Kurse.meineKurse.kursliste, function(value, key) {
					if(!found && value.kursstammdaten.kurs_id == kurslist[0].kursstammdaten.kurs_id) {
						found = true;
						this[key] = editedKurs;
					}
				}, Kurse.meineKurse.kursliste);
				angular.copy(editedKurs, Kurse.currentKurs);
				// we need to refresh data as soon as possible
				Kurse.meineKurse = [];
				//console.log("end of saving");
				//console.log(Kurse.kurse.kursliste);
				//Kurse.getKurs(kurslist[0].kursstammdaten.kurse_id);
			} else {
				// error in request data
				if(angular.isDefined(data) && angular.isDefined(data.fehlermessage)) {
					Kurse.raiseError(data.fehler, data.fehlermessage);
				} else Kurse.raiseError(-4, "Incorrect data received!");
			}
		}, function(data) {
			// error connecting to server
			Kurse.raiseError(-1, "Error connecting to the server!");
			//console.log(data);
		});
	};
	
	Kurse.errorHandler = undefined;
	Kurse.registerHandler = function(handler) {
		Kurse.errorHandler = handler;
	};
	
	Kurse.raiseError = function(code, text) {
		Kurse.errorCode = code;
		Kurse.fehlerMessage = text;
		Kurse.errorFlag = true;
		//console.log("Fehler code: ", code);
		//console.log("Fehler: ", text);
		if(Kurse.errorHandler) Kurse.errorHandler();
	};
	
	Kurse.clearError = function() {
		Kurse.errorFlag = false;
		Kurse.errorCode = 0;
		Kurse.fehlerMessage = "";
		//console.log("Errors flags cleared!");		
	};

	Kurse.parseKurs = function(value,key) {
		// make a short beschreibung
		if(value.kursstammdaten.beschreibung.length > 100) this[key].kursstammdaten.beschreibung_short = value.kursstammdaten.beschreibung.slice(0,99);
		else this[key].kursstammdaten.beschreibung_short = value.kursstammdaten.beschreibung;
		// create periode label
		this[key].kursstammdaten.periode = Kurse.perioden[value.kursstammdaten.zahlungsperiode_id];
		// parse termine
		if(angular.isDefined(value.termine) && value.termine.length > 0) {
			var tempTermine =  new Array();
			angular.forEach(value.termine, function(value, index) {
				// recreate proper format of date/time object
				var newTermin = {"start_zeit" : new Date(value.start_zeit),"ende_zeit" : new Date(value.ende_zeit)};
				this.push(newTermin);
			}, tempTermine);
			this[key].termine = tempTermine;
		}
		// check anmeldedaten
		if(angular.isDefined(value.anmeldedaten)) {
			// parse status
			this[key].anmeldedaten.anmeldestatus = parseInt(value.anmeldedaten.anmeldestatus);
			// parse bemerkung
			this[key].anmeldedaten.bemerkung = (angular.isDefined(value.anmeldedaten.bemerkung))? value.anmeldedaten.bemerkung : '';
			// special price
			if(angular.isDefined(value.anmeldedaten.preis_pro_periode) && value.anmeldedaten.preis_pro_periode > 0) {
				this[key].kursstammdaten.preis_pro_periode = value.anmeldedaten.preis_pro_periode;
			}
		} else {
			this[key].anmeldedaten = {};
			this[key].anmeldedaten.anmeldestatus = 0;
			this[key].anmeldedaten.bemerkung = '';
		}
		// parse status
		switch(this[key].anmeldedaten.anmeldestatus) {
		case 10: // Angemeldet
			this[key].statusImg = 'css/images/ribbon3-o.png';
			this[key].statusClass = 'orange';
			this[key].statusTitle = 'Angemeld.';
			this[key].buttonTitle = 'Abmelden';
			this[key].buttonAction = 'deselect'; // same as class
			break;
		case 30: // Bestätigt
			this[key].statusImg = 'css/images/ribbon3-g.png';
			this[key].statusClass = 'green';
			this[key].statusTitle = 'Bestätigt';
			this[key].buttonTitle = 'Abmelden';
			this[key].buttonAction = 'deselect'; // same as class
			break;
		case 80: // Abgelehnt
			this[key].statusImg = 'css/images/ribbon3-r.png';
			this[key].statusClass = 'red';
			this[key].statusTitle = 'Abgelehnt';
			break;
		case 90: // Abgebrochen
			this[key].statusImg = 'css/images/ribbon3-r.png';
			this[key].statusClass = 'red';
			this[key].statusTitle = 'Abgebr.';
			break;
		case 0: // Undefined/initial status
			this[key].statusImg = '';
			this[key].statusClass = '';
			this[key].statusTitle = '';
			this[key].statusClass = 'status_empty';
			this[key].buttonTitle = 'Anmelden';
			this[key].buttonAction = 'select'; // same as class
			break;
		}
	};
	Kurse.getKurs = function(kursId) {
		//console.log("getKurs: ", kursId);
		var found = false;
		// try to find requested kurs in kurs list
		angular.forEach(Kurse.kurse.kursliste, function(value, key) {
			//console.log(value);
			if(kursId == value.kursstammdaten.kurs_id) {
				angular.copy(value, this);
				found = true;
			}
		}, Kurse.currentKurs);
		// if not found in kurs list
		if(!found) {
			// try to found in meine kurs list
			if(angular.isDefined(Kurse.meineKurse.kursliste)) {
				angular.forEach(Kurse.meineKurse.kursliste, function(value, key) {
					//console.log(value);
					if(kursId == value.kursstammdaten.kurs_id) {
						angular.copy(value, this);
						found = true;
					}
				}, Kurse.currentKurs);
			}
		}
		if(found) return Kurse.currentKurs;
		else return {};
	};
	Kurse.getLastPage = function() {
		return Kurse.lastPage;
	};
	Kurse.clear = function() {
		Kurse.currentKurs = {};
		Kurse.kurse = [];
		Kurse.meineKurse = [];
		Kurse.lastRefresh = 0;
		Kurse.errorFlag = false;
	};
	return Kurse;
}]);