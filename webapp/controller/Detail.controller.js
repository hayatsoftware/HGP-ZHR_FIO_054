sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/PDFViewer"
], function (BaseController, JSONModel, PDFViewer) {
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
				bEditable = oScreenModel.getProperty("/generalEditable");

			oScreenModel.setProperty("/generalEditable", !bEditable);
		},

		_onDetailObjectMatched: function (oEvent) {
			this._bNewRequest = false;
			var sReinr = oEvent.getParameter("arguments").Reinr,
				sGrupSeyahatNo = oEvent.getParameter("arguments").GrupSeyahatNo,
				bGroupTravel = !!+sGrupSeyahatNo;

			let oScreenModel = this.getModel("screenModels");
			oScreenModel.setProperty("/generalEditable", false);
			oScreenModel.setProperty("/isNewRequest", false);
			oScreenModel.setProperty("/isGroupTravel", bGroupTravel);

			let sTitleKey = bGroupTravel ? "groupTravelRequest" : "travelRequest";
			this._setTitle(sTitleKey);

			this.resetMessageModel();
			this._getData(sReinr, sGrupSeyahatNo);
		},

		_onCreateTravelObjectMatched: function () {
			this._bNewRequest = true;
			let oScreenModel = this.getModel("screenModels");
			oScreenModel.setProperty("/generalEditable", true);
			oScreenModel.setProperty("/isNewRequest", true);

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
				var oTravelRequest = await this._sendReadData(sPath, mUrlParameters),
					aEstimatedCostList = [];

				oTravelRequest.TRAVELITEMSET.results.forEach(oTravelItem => {
					oTravelItem.NonEditable = true;
					oTravelItem.ESTIMATEDCOSTSET.results.forEach(oCost => {
						aEstimatedCostList.push(oCost);
					});
				});

				this.getView().setModel(new JSONModel(oTravelRequest), "Header");
				this.getView().setModel(new JSONModel(oTravelRequest.TRAVELITEMSET.results), "UserList");
				this.getView().setModel(new JSONModel(aEstimatedCostList), "EstimatedCostList");

			} finally {
				_oGlobalBusyDialog.close();
			}
		},

		_setTitle: function (sI18nKey) {
			let oScreenModel = this.getModel("screenModels"),
				oResourceBundle = this.getResourceBundle();

			oScreenModel.setProperty("/detailPageTitle", oResourceBundle.getText(sI18nKey));
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

		onDeleteRow: function (sModelName, sTableId) {
			this._deleteRow(sModelName, sTableId);
		},

		onUserSearchHelp: function (oEvent) {
			this._sPath = oEvent.getSource().getBindingContext("UserList").getPath();
			this.openDialog("selectDialogPersonal", "com.hayat.grupseyahat.grupseyahattalebi.fragments.Personal_SH");
		},

		onValueHelpGeneral: async function (oEvent, sType, sFilterParam) {
			this._valueHelpGeneral(oEvent, sType, sFilterParam);
		},

		onSaveCreateTravel: function () {
			this.resetMessageModel();
			this._saveCreateTravel(this._bNewRequest);
		},

		onAdditionalInfoTagPress: async function (oEvent, sSelectedTag) {
			let oScreenModel = this.getModel("screenModels"),
				oAdditionalInfo = this._getJsonData("/additionalInfo"),
				oResourceBundle = this.getResourceBundle(),
				mBindingProperties = {
					model: "UserList",
					path: oEvent.getSource().getBindingContext("UserList").getPath()
				};

			const mIconSrc = {
				"passport": "sap-icon://business-card",
				"visa": "sap-icon://notes",
				"flight": "sap-icon://flight",
				"hotel": "sap-icon://building"
			};

			oAdditionalInfo.selectedTag = sSelectedTag;
			oAdditionalInfo.title = oResourceBundle.getText(sSelectedTag + "Info");
			oAdditionalInfo.iconSrc = mIconSrc[sSelectedTag];
			oScreenModel.setProperty("/additionalInfo", oAdditionalInfo);

			let oPopover = await this.openPopover("idAdditionalInfoPopover", "com.hayat.grupseyahat.grupseyahattalebi.fragments.AdditionalInfoPopover", oEvent.getSource());
			oPopover.bindElement(mBindingProperties);
		},

		onRequirementSelectionChange: function (oEvent) {
			let oSelectedItem = oEvent.getParameter("selectedItem"),
				oBindingKey = oEvent.getSource().getBinding("selectedKey"),
				sBindingPath = oBindingKey.getContext().getPath() + "/" + oBindingKey.getPath() + "Text";

			oBindingKey.getModel().setProperty(sBindingPath, oSelectedItem ? oSelectedItem.getText() : "");
		},

		onPrint: function () {
			let oModel = this.getModel(),
				sRequestNumber = this.getModel("Header").getProperty("/Reinr");

			let sPath = oModel.createKey("/TravelFormSet", {
				Reinr: sRequestNumber
			});

			let oPDFViewer = new PDFViewer({
				isTrustedSource: true,
				source: oModel.sServiceUrl + sPath + "/$value",
				title: +sRequestNumber
			});

			oPDFViewer.open();
		}

	});
});