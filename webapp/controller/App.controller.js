sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("com.hayat.grupseyahat.grupseyahattalebi.controller.App", {
		onInit: function () {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				postResponse: null,
				busy: true,
				delay: 0,
				cashAdvanceAuth: true,
				groupAuth: false,
				layout: "OneColumn",
				previousLayout: "",
				actionButtonsInfo: {
					midColumn: {
						fullScreen: false
					}
				}
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function () {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			// since then() has no "reject"-path attach to the MetadataFailed-Event to disable the busy indicator in case of an error
			let oModel = this.getOwnerComponent().getModel();
			oModel.metadataLoaded().then(fnSetAppNotBusy);
			oModel.attachMetadataFailed(fnSetAppNotBusy);
			oModel.attachRequestFailed(this._removeDuplicateMessages);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			// message manager
			let oMessageManager = sap.ui.getCore().getMessageManager();
			this.getOwnerComponent().setModel(oMessageManager.getMessageModel(), "message");

			// user authorization
			oModel.metadataLoaded().then(() => {
				let sPath = oModel.createKey("/UserAuthorizationSet", {
					Uname: ""
				});

				let mParameters = {
					success: (oResult) => {
						oViewModel.setProperty("/groupAuth", oResult.GroupAuth);
						oViewModel.setProperty("/cashAdvanceAuth", oResult.CashEditable);
					}
				};

				oModel.read(sPath, mParameters);
			});
		}

	});
});