/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comhayatgrupseyahat/grup_seyahat_talebi/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
