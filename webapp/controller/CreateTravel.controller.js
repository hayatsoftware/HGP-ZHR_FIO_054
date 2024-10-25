sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    function (BaseController,
        JSONModel, Device) {
        "use strict";
        var _oGlobalBusyDialog = new sap.m.BusyDialog();
        return BaseController.extend("com.hayat.grupseyahat.grupseyahattalebi.controller.CreateTravel", {
            onInit: function () {

                this.getRouter().getRoute("CreateTravel").attachPatternMatched(this._onObjectMatched, this);

            },
            onBack: function () {
                var bReplace = !Device.system.phone;
                this.getRouter().navTo("list", {
                }, bReplace);
            },
            _onObjectMatched: function (oEvent) {
                this.oDataModel = this.getOwnerComponent().getModel();
                this._initialOperation();
            },
            _initialOperation: function () {
                this.resetMessageModel();
                this._getHeaderData();
                this._getItemData();

            },
            _getHeaderData: async function () {
                this.getView().setModel(new JSONModel(this._getJsonData("/travelHeader")), "Header");
                this.getView().setModel(new JSONModel(this._getJsonData("/screenEditableVisible")));
                _oGlobalBusyDialog.open();
                try {
                    let oResponse = await this._sendQueryData("/TripActivitiesSet");
                    this.getView().setModel(new JSONModel(oResponse.results), "TripActivities")
                } catch (error) {
                    this._showServiceError(error);
                } finally {
                    _oGlobalBusyDialog.close();
                }
            },
            _getItemData: function () {
                this.getView().setModel(new JSONModel([]), "UserList");
                /*  this.getView().byId("idUserScreenList").getModel("UserList").refresh(true); */
            },
            onValueHelpGeneral: async function (oEvent, sType, sFilterParam) {
                 this._valueHelpGeneral(oEvent, sType, sFilterParam);
            },
            onUserSearchHelp: function (oEvent) {
                this._sPath = oEvent.getSource().getBindingContext("UserList").getPath();
                this.openDialog("selectDialogPersonal", "com.hayat.grupseyahat.grupseyahattalebi.fragments.Personal_SH");
            },
            onAddRow: function () {
                this._addRow();
            },
            onDeleteRow: function () {
                this._deleteRow();
            },
            onSaveCreateTravel: function () {
                 this._saveCreateTravel(true);
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
        });
    });
