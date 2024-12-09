sap.ui.define([
	"./BaseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
], function (
	BaseController,
	Filter,
	FilterOperator,
	JSONModel
) {
	"use strict";
	var _oGlobalBusyDialog = new sap.m.BusyDialog();
	return BaseController.extend("com.hayat.grupseyahat.grupseyahattalebi.controller.Detail", {

		onInit: function () {
			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function (oEvent) {
			this.oDataModel = this.getOwnerComponent().getModel();
			var sGrupSeyahatNo = oEvent.getParameter("arguments").objectId;
			this.getView().setModel(new JSONModel([]), "UserList");
			this.resetMessageModel();
			this._getData(sGrupSeyahatNo);

		},
		_getData: async function (sGrupSeyahatNo) {
			var aPromise = [],
				aFilter = [new Filter("GrupSeyahatNo", FilterOperator.EQ, sGrupSeyahatNo)];
			_oGlobalBusyDialog.open();
			try {
				aPromise.push(this._sendReadData("/TravelSet('" + sGrupSeyahatNo + "')"));
				aPromise.push(this._sendQueryData("/TravelItemSet", aFilter));

				const [resultHeader, resultItem] = await Promise.all(aPromise);
				this.getView().setModel(new JSONModel(resultHeader), "Header");
				this.getView().setModel(new JSONModel(resultItem.results), "UserCurrentList");
			} catch (e) {
				this._showServiceError(e);
			} finally {
				_oGlobalBusyDialog.close();
			}


		},
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen")
			} else {
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"))
			}
		},
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("list");
		},

		onAddRow: function () {
			this._addRow();
		},
		onDeleteRow: function () {
			this._deleteRow();
		},
		onUserSearchHelp: function (oEvent) {
			this._sPath = oEvent.getSource().getBindingContext("UserList").getPath();
			this.openDialog("selectDialogPersonal", "com.hayat.grupseyahat.grupseyahattalebi.fragments.Personal_SH");
		},
		onValueHelpGeneral: async function (oEvent, sType, sFilterParam) {
			this._valueHelpGeneral(oEvent, sType, sFilterParam);
		},
		onSaveCreateTravel: function () {
			this._saveCreateTravel(false);
		}

	});
});