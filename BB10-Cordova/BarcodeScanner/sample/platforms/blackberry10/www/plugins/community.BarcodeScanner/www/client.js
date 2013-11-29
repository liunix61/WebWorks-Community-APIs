cordova.define("community.BarcodeScanner.client", function(require, exports, module) {/*
* Copyright 2013 Research In Motion Limited.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

(function(cordova) {
	var _ID = "community.BarcodeScanner";
	var exec = cordova.require("cordova/exec");

	var reading, canvas, timeout, fs, latestFrame = null;
	var fsSize = 1024 * 1024;
	var codefoundCallback, errorfoundCallback;
	var sleepPrevented = false;
	var canvas = null;

	function BarcodeScanner() {}

	// BarcodeScanner.prototype.startRead = function (codeFound, errorFound, canvasID, successStart) {
	BarcodeScanner.prototype.startRead = function (succ, fail, args, env) {
		if (reading) return "Stop Scanning before scanning again";
		
		var canvasID  = args;

		var frameAvailableFn = frameAvailable;
		var success = function (data, response) {
			var arData = data.split(" "),
				receivedEvent = arData[0]

			console.log("CLIENT STARTREAD SUCCESS")
			console.log(receivedEvent)
			if(receivedEvent == "community.barcodescanner.frameavailable.native") {
				var frameData = JSON.parse(arData[1])
				console.log(frameData)
				frameAvailableFn(frameData)
			}
			else if(receivedEvent == "community.barcodescanner.started.native") {
				document.getElementById("appContainer").style.display = "none"
				canvas = document.getElementById(canvasID);
			}
		},
		failure = function (data, response) {
			console.log("CLIENT STARTREAD FAIL")
			console.log(data)
			console.log(response)
		};
		exec(success, failure, _ID, "startRead", null);

		// window.webworks.event.once(_ID, "community.BarcodeScanner.started", successStart);
		// }
		// if ( canvasID !== null ) {
		// 	console.log("2222")
		// 	// window.webworks.event.add(_ID, "community.BarcodeScanner.frameavailable", frameAvailable);
		// }
		// if ( typeof(errorFound) == "function" ) {
		// 	console.log("3333")
		// 	errorfoundCallback = errorFound;
		// 	// window.webworks.event.once(_ID, "community.BarcodeScanner.errorfound", errorfoundCallback);
		// }
		// if ( typeof(codeFound) == "function" ) {
		// 	console.log("4444")
		// 	codefoundCallback = codeFound;
		// 	// window.webworks.event.once(_ID, "community.BarcodeScanner.codefound", codefoundCallback);
		// }
		blackberry.io.sandbox = false;
		reading = true;
		// Turn on prevent sleep, if it's in the app
		if (typeof community !== "undefined" && typeof community.preventsleep !== "undefined") {
			if (!community.preventsleep.isSleepPrevented) {
				community.preventsleep.setPreventSleep(true);
				sleepPrevented = true;
			}
		}
		// return window.webworks.execAsync(_ID, "startRead", null);
	};

	BarcodeScanner.prototype.stopRead = function (successfulEnd, errorFound) {
		if ( typeof(errorfoundCallback) == "function" ) {
			// window.webworks.event.remove(_ID, "community.BarcodeScanner.errorfound", errorfoundCallback);
		}
		if ( typeof(errorFound) == "function" ) {
			errorfoundCallback = errorFound;
			// window.webworks.event.once(_ID, "community.BarcodeScanner.errorfound", errorfoundCallback);
		}
		if ( typeof(successfulEnd) == "function" ) {
			// window.webworks.event.once(_ID, "community.BarcodeScanner.ended", successfulEnd);
		}
		if ( canvas !== null ) {
			// window.webworks.event.remove(_ID, "community.BarcodeScanner.frameavailable", frameAvailable);
		}
		if ( typeof(codefoundCallback) == "function" ) {
			// window.webworks.event.remove(_ID, "community.BarcodeScanner.codefound", codefoundCallback);
		}
		reading = false;
		// Return sleep setting to original if changed.
		if (community && community.preventsleep) {
			if (sleepPrevented === true) {
				community.preventsleep.setPreventSleep(false);
				sleepPrevented = false;
			}
		}
		return window.webworks.execAsync(_ID, "stopRead", null);
	};

	function readFile(filename) {
		console.log("READ FILE")
		window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

		window.requestFileSystem(
			window.TEMPORARY, 
			fsSize, 
			function (fs) {
				console.log("filename:: " + filename)
				fs.root.getFile(
					filename, 
					{create: false}, 
					function (fileEntry) {
						console.log("fileEntry:: " + fileEntry)
						fileEntry.file(
							function (file) {
								console.log("file:: " + file)
								var reader = new FileReader();
								reader.onloadend = function (e) {
									var ctx = canvas.getContext("2d");
									console.log(canvas)
									console.log(ctx)
									var img = new Image();
									img.onload = function() {
										ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
										URL.revokeObjectURL(img.src);
										img.src = null;
									};
									img.src = e.target.result;
								};

								reader.readAsDataURL(file);
							},
							errorHandler
						);
					},
					errorHandler
				);
			}
		);
	};

	function errorHandler(e) {
		var msg = '';

		switch (e.code) {
			case FileError.QUOTA_EXCEEDED_ERR:
			msg = 'QUOTA_EXCEEDED_ERR';
			break;
			case FileError.NOT_FOUND_ERR:
			msg = 'NOT_FOUND_ERR';
			break;
			case FileError.SECURITY_ERR:
			msg = 'SECURITY_ERR';
			break;
			case FileError.INVALID_MODIFICATION_ERR:
			msg = 'INVALID_MODIFICATION_ERR';
			break;
			case FileError.INVALID_STATE_ERR:
			msg = 'INVALID_STATE_ERR';
			break;
			default:
			msg = 'Unknown Error';
			break;
		}

		console.log(e)
		console.log(msg)
	}

	function frameAvailable(data){
		console.log("FRAME AVAILABLE")
		console.log(data)
		latestFrame = data.frame;
		timeout = setTimeout(readFile, 4, latestFrame);
	}

	cordova.addConstructor(function() {
		if(!window.plugins) window.plugins = {};
		window.plugins.barcodeScanner = new BarcodeScanner();
	});

})(window.cordova || window.Cordova);
});
