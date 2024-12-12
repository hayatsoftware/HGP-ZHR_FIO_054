sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
], function (BaseController, JSONModel) {
	"use strict";

	var _oGlobalBusyDialog = new sap.m.BusyDialog();

	return BaseController.extend("com.hayat.grupseyahat.grupseyahattalebi.controller.Detail", {

		_bNewRequest: false,

		onInit: function () {
			this.oDataModel = this.getOwnerComponent().getModel();
			this.getRouter().getRoute("detail").attachPatternMatched(this._onDetailObjectMatched, this);
			this.getRouter().getRoute("createTravel").attachPatternMatched(this._onCreateTravelObjectMatched, this);
		},

		toggleEdit: function () {
			let oScreenModel = this.getModel("screenModels"),
				bEditable = oScreenModel.getProperty("/screenEditableVisible/GeneralEditable");

			oScreenModel.setProperty("/screenEditableVisible/GeneralEditable", !bEditable);
		},

		_onDetailObjectMatched: function (oEvent) {
			this._bNewRequest = false;
			var sReinr = oEvent.getParameter("arguments").Reinr,
				sGrupSeyahatNo = oEvent.getParameter("arguments").GrupSeyahatNo,
				bGroupTravel = !!+sGrupSeyahatNo;

			let oScreenModel = this.getModel("screenModels");
			oScreenModel.setProperty("/screenEditableVisible/GeneralEditable", false);
			oScreenModel.setProperty("/isGroupTravel", bGroupTravel);

			let sTitleKey = bGroupTravel ? "groupTravelRequest" : "travelRequest";
			this._setTitle(sTitleKey);

			this.resetMessageModel();
			this._getData(sReinr, sGrupSeyahatNo);
			this._getItemData();
		},

		_onCreateTravelObjectMatched: function () {
			this._bNewRequest = true;
			let oScreenModel = this.getModel("screenModels");
			oScreenModel.setProperty("/screenEditableVisible/GeneralEditable", true);

			let oAppViewModel = this.getModel("appView");
			oAppViewModel.setProperty("/actionButtonsInfo/midColumn/fullScreen", true);
			oAppViewModel.setProperty("/previousLayout", "TwoColumnsMidExpanded");
			oAppViewModel.setProperty("/layout", "MidColumnFullScreen")

			let sTitleKey = oScreenModel.getProperty("/isGroupTravel") ? "newGroupTravelRequest" : "newTravelRequest";
			this._setTitle(sTitleKey);

			this.resetMessageModel();
			this._getHeaderData();
			this._getItemData();
		},

		_getHeaderData: async function () {
			let oScreenModel = this.getModel("screenModels"),
				oTravelHeader = this._getJsonData("/travelHeader");

			oTravelHeader.Grup = oScreenModel.getProperty("/isGroupTravel");
			this.getView().setModel(new JSONModel(oTravelHeader), "Header");
		},

		_getItemData: async function () {
			let oScreenModel = this.getModel("screenModels"),
				bGroupTravel = oScreenModel.getProperty("/isGroupTravel"),
				aUserList = [],
				aUserCurrentList = [],
				aEstimatedCostList = [];

			if (this._bNewRequest && !bGroupTravel) {
				let oEmployeeDefaults = await this._getEmployeeDefaults();
				aUserList.push({
					Pernr: oEmployeeDefaults.Pernr,
					FirstName: oEmployeeDefaults.FirstName,
					LastName: oEmployeeDefaults.LastName,
					Plans: oEmployeeDefaults.Plans,
					PlansText: oEmployeeDefaults.PlansText,
					CostCenter: oEmployeeDefaults.CostCenter,
					CostCenterName: oEmployeeDefaults.CostCenterName,
					InternalOrder: oEmployeeDefaults.InternalOrder,
					InternalOrderName: oEmployeeDefaults.InternalOrderName
				});
			}

			this.getView().setModel(new JSONModel(aUserList), "UserList");
			this.getView().setModel(new JSONModel(aUserCurrentList), "UserCurrentList");
			this.getView().setModel(new JSONModel(aEstimatedCostList), "EstimatedCostList");
		},

		_getData: async function (sReinr, sGrupSeyahatNo) {
			var sPath = this.oDataModel.createKey("/TravelSet", {
				Reinr: sReinr,
				GrupSeyahatNo: sGrupSeyahatNo
			});

			var mUrlParameters = {
				$expand: "TRAVELITEMSET/ESTIMATEDCOSTSET"
			};

			try {
				_oGlobalBusyDialog.open();
				var oTravelRequest = await this._sendReadData(sPath, mUrlParameters);
				this.getView().setModel(new JSONModel(oTravelRequest), "Header");
				this.getView().setModel(new JSONModel(oTravelRequest.TRAVELITEMSET.results), "UserCurrentList");

				let aEstimatedCostList = [];
				oTravelRequest.TRAVELITEMSET.results.forEach(oTravelItem => {
					oTravelItem.ESTIMATEDCOSTSET.results.forEach(oCost => {
						aEstimatedCostList.push(oCost);
					});
				});

				this.getView().setModel(new JSONModel(aEstimatedCostList), "EstimatedCostList");

			} finally {
				_oGlobalBusyDialog.close();
			}
		},

		_setTitle: function (sI18nKey) {
			let oScreenModel = this.getModel("screenModels"),
				oResourceBundle = this.getResourceBundle();

			oScreenModel.setProperty("/screenEditableVisible/DetailTitle", oResourceBundle.getText(sI18nKey));
		},

		toggleFullScreen: function () {
			var oAppViewModel = this.getModel("appView"),
				bFullScreen = oAppViewModel.getProperty("/actionButtonsInfo/midColumn/fullScreen");

			if (!bFullScreen) {
				oAppViewModel.setProperty("/previousLayout", oAppViewModel.getProperty("/layout"));
				oAppViewModel.setProperty("/layout", "MidColumnFullScreen")
			} else {
				oAppViewModel.setProperty("/layout", oAppViewModel.getProperty("/previousLayout"))
			}

			oAppViewModel.setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
		},

		onCloseDetailPress: function () {
			var oAppViewModel = this.getModel("appView");
			oAppViewModel.setProperty("/actionButtonsInfo/midColumn/fullScreen", false);

			this.toggleEdit();
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("list");
		},

		onAddRow: function (sModelName, sJSONProperty) {
			this._addRow(sModelName, sJSONProperty);
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
			this._saveCreateTravel(this._bNewRequest);
		}

	});
});