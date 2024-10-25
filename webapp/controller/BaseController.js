sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/m/MessageBox",
    "sap/ui/Device"
], function (
    Controller,
    JSONModel,
    Fragment,
    FilterOperator,
    Filter,
    MessageBox,
    Device
) {
    "use strict";
    var _oGlobalBusyDialog = new sap.m.BusyDialog();
    return Controller.extend("com.hayat.grupseyahat.grupseyahattalebi.controller.BaseController", {

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },
        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },
        _sendQueryData: function (sPath, aFilters) {
            return new Promise((fnSuccess, fnReject) => {
                const oParameters = {
                    filters: aFilters,
                    success: fnSuccess,
                    error: fnReject
                };

                this.oDataModel.read(sPath, oParameters);
            });
        },
        _sendReadData: function (sPath) {
            return new Promise((fnSuccess, fnReject) => {
                const oParameters = {
                    success: fnSuccess,
                    error: fnReject
                };

                this.oDataModel.read(sPath, oParameters);
            });
        },
        _sendUpdateData: function (sPath, oDeepData) {
            return new Promise((fnSuccess, fnReject) => {
                const oParameters = {
                    method: "PUT",
                    success: fnSuccess,
                    error: fnReject
                };

                this.oDataModel.update(sPath, oDeepData, oParameters);
            });
        },
        _sendCreateData: function (sPath, oDeepData, oHeaders) {
            return new Promise((fnSuccess, fnReject) => {
                const oParameters = {
                    success: fnSuccess,
                    error: fnReject
                };

                this.oDataModel.create(sPath, oDeepData, oParameters);
            });
        },
        _callFunction: function (sPath, sMethodName, oUrlParameters) {
            return new Promise((fnResolve, fnReject) => {
                let oParams = {
                    method: sMethodName,
                    urlParameters: oUrlParameters,
                    success: fnResolve,
                    error: fnReject
                };

                this.oDataModel.callFunction(sPath, oParams);

            });
        },
        _showServiceError: function (e) {
            if (e.responseText) {
                try {
                    var eObj = JSON.parse(e.responseText);
                    if (eObj.error) {
                        MessageBox.error(eObj.error.message.value, {
                            actions: [sMessageBox.Action.OK]
                        });
                    }
                } catch (err) {
                    MessageBox.error(e.responseText, {
                        actions: [MessageBox.Action.OK]
                    });
                }
            } else {
                MessageBox.error(this._getText("GENERALERROROR"), {
                    actions: [MessageBox.Action.OK]
                });
            }
        },
        _getText: function (sText) {
            return this.getView().getModel("i18n").getResourceBundle().getText(sText);
        },
        _getJsonData: function (sModel) {
            return jQuery.extend(true,
                {}, this.getOwnerComponent().getModel("screenModels").getProperty(sModel));
        },
        openDialog: function (sDialogId, sFragmentName) {
            return new Promise((fnResolve, fnReject) => {
                var oView = this.getView(),
                    oDialog = this.byId(sDialogId);
                if (!oDialog) {
                    Fragment.load({
                        id: oView.getId(),
                        name: sFragmentName,
                        controller: this
                    }).then((oFragment) => {

                        oView.addDependent(oFragment);
                        oFragment.open();
                        fnResolve(oFragment);
                    });
                } else {
                    oDialog.open();
                    fnResolve(oDialog);
                }
            });
        },
        openDialogSH: function (sDialogId, oModel, sTitle, sType) {
            return new Promise((fnResolve, fnReject) => {
                var oView = this.getView(),
                    oDialog = this.byId(sDialogId),
                    oDefaultModel = {
                        "title": sTitle,
                        "shType": sType
                    }

                if (!oDialog) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "com.hayat.grupseyahat.grupseyahattalebi.fragments.SelectDialog",
                        controller: this
                    }).then((oFragment) => {

                        oView.addDependent(oFragment);
                        oFragment.setModel(new JSONModel(oModel), "SH")
                        oFragment.setModel(new JSONModel(oDefaultModel))
                        oFragment.setTitle(sTitle)
                        oFragment.open();
                        fnResolve(oFragment);
                    });
                } else {
                    oDialog.setModel(new JSONModel(oModel))
                    oDialog.open();
                    fnResolve(oDialog);
                }
            });
        },

        closeDialogSH: function (oEvent) {
            this._isSourceInFragment(oEvent.getSource()).destroy();
        },
        searchDialogSH: function (oEvent) {
            var sValue = oEvent.getParameter("value"),
                oFilters = new Filter({
                    filters: [
                    ],
                    and: false,
                }),
                oBinding = oEvent.getParameter("itemsBinding");
            if (!!sValue === true) {
                oFilters.aFilters.push(new Filter("Id", FilterOperator.Contains, sValue)),
                    oFilters.aFilters.push(new Filter("Name", FilterOperator.Contains, sValue));

                oBinding.filter([oFilters]);
            } else {
                oBinding.filter([]);
            }
        },
        confirmSHDialog: function (oEvent) {
            var sKey = oEvent.getParameter("selectedItem").getTitle(),
                sText = oEvent.getParameter("selectedItem").getDescription(),
                sType = oEvent.getSource().getModel().getProperty("/shType");
            switch (sType) {
                case 'country':
                    this.getView().getModel("Header").setProperty("/CountryCode", sKey)
                    this.getView().getModel("Header").setProperty("/CountryName", sText)
                    this.getView().getModel().setProperty("/SeyahatBolgesi", true)
                    break;
                case 'region':
                    this.getView().getModel("Header").setProperty("/RegionCode", sKey)
                    this.getView().getModel("Header").setProperty("/RegionName", sText)
                    this.getView().getModel().setProperty("/UserList", true)
                    break;
                case 'wbselement':
                    this.getView().getModel("UserList").setProperty(this._sPath + "/WbsElement", sKey)
                    this.getView().getModel("UserList").setProperty(this._sPath + "/WbsElementName", sText)
                    this.getView().getModel("UserList").refresh(true);
                    break;
            }
            oEvent.getSource().destroy();
        },
        _isSourceInFragment: function (oControl) {

            while (oControl) {
                if (oControl instanceof sap.m.Dialog || oControl instanceof sap.m.SelectDialog) {
                    return oControl;
                }
                oControl = oControl.getParent();
            }
        },
        onSearchPers: async function (oEvent) {
            var oList = oEvent.getSource().getParent().getParent().getContent()[1],
                _oListTemplate = oList.getBindingInfo("items").template;
            let sText = oEvent.getSource().getValue().trim();
            let aFilter = [];
            if (isNaN(parseInt(sText))) {
                aFilter.push(new sap.ui.model.Filter("Ename", sap.ui.model.FilterOperator.EQ, sText));
            }
            else {
                aFilter.push(new sap.ui.model.Filter("Pernr", sap.ui.model.FilterOperator.EQ, sText));
            }
            try {
                let oResponse = await this._sendQueryData("/PersonalListSet", aFilter);
                oList.unbindAggregation("items");
                oList.setModel(new sap.ui.model.json.JSONModel(oResponse.results));
                oList.bindAggregation("items", {
                    path: "/",
                    template: _oListTemplate,
                    templateShareable: true
                });
            } catch (error) {
                this._showServiceError(error);
            } finally {
                _oGlobalBusyDialog.close();
            }
        },
        onPersValueConfirm: async function (oEvent) {
            var oList = oEvent.getSource().getParent().getContent()[1],
                oDialog = oEvent.getSource().getParent();
            if (!oList.getSelectedContextPaths()[0]) {
                sap.m.MessageToast.show(this._getText("pleaseSelectPernr"));
                return;
            }
            debugger;
            let sUsername = oList.getModel().getObject(oList.getSelectedContextPaths()[0]).Username,
                sRegionCode = this.getView().getModel("Header").getProperty("/RegionCode");
            oDialog.close();
            _oGlobalBusyDialog.open();
            try {
                let oResponse = await this._sendReadData("/EmployessSet(Username='" + sUsername + "',RegionCode='" + sRegionCode + "')"),
                    oRowModel = this.getView().getModel("UserList").getProperty(this._sPath);
                for (var i in oRowModel) {
                    oRowModel[i] = oResponse[i]
                }

                this.getView().getModel("UserList").setProperty(this._sPath, oRowModel)
                debugger;
            } catch (error) {
                this._showServiceError(error);
            } finally {
                _oGlobalBusyDialog.close();
            }
        },
        onMessageButtonPress: function (oEvent) {
            var oMessagesButton = oEvent.getSource();
            this._openMessagePopover(oMessagesButton);

        },
        _checkMessages: function () {
            let oMessageManager = sap.ui.getCore().getMessageManager(),
                oMessages = oMessageManager.getMessageModel().getData(),
                aMessageTexts = oMessages.map(oItem => oItem.message);
            aMessageTexts = [...new Set(aMessageTexts)];
            if (aMessageTexts.length > 0) {
                this._waitForButtonRendering().then(function (oMessagesButton) {
                    this._openMessagePopover(oMessagesButton);
                }.bind(this));

            }
        },
        _waitForButtonRendering: function () {
            return new Promise(function (resolve) {
                let oMessagesButton = this.byId("idMessagePopover");

                // Eğer butonun DOM referansı varsa, render edilmiş demektir
                if (oMessagesButton.getDomRef()) {
                    resolve(oMessagesButton);
                } else {
                    // Buton render edildikten sonra resolve
                    oMessagesButton.addEventDelegate({
                        onAfterRendering: function () {
                            resolve(oMessagesButton);
                        }
                    });
                }
            }.bind(this));
        },
        _removeDuplicateMessages: function () {
            let oMessageManager = sap.ui.getCore().getMessageManager(),
                oMessages = oMessageManager.getMessageModel().getData(),
                aMessageTexts = oMessages.map(oItem => oItem.message),
                aMessages = [];

            aMessageTexts = [...new Set(aMessageTexts)];

            let fnFilterDuplicates = (oMessage) => {
                if (aMessageTexts.includes(oMessage.message)) {
                    aMessageTexts.splice(aMessageTexts.indexOf(oMessage.message), 1);
                    return oMessage;
                } else {
                    return false;
                }
            };

            aMessages = oMessages.filter(fnFilterDuplicates);
            oMessageManager.getMessageModel().setData(aMessages);
        },

        _openMessagePopover: function (oMessagesButton) {
            if (!this._oMessagePopover) {
                this._oMessagePopover = new sap.m.MessagePopover({
                    items: {
                        path: "message>/",
                        template: new sap.m.MessagePopoverItem({
                            description: "{message>description}",
                            type: "{message>type}",
                            title: "{message>message}"
                        })
                    }
                });
                if (!oMessagesButton) {
                    oMessagesButton = this.byId("idMessagePopover")
                }
            }
            if (!oMessagesButton) {
                oMessagesButton = this.byId("idMessagePopover")
            }
            oMessagesButton.addDependent(this._oMessagePopover);

            this._oMessagePopover.openBy(oMessagesButton);


        },

        resetMessageModel: function () {
            sap.ui.getCore().getMessageManager().removeAllMessages();
        },
        _addRow: function () {
            let JSONModel = this._getJsonData("/travelItem");
            this.getView().getModel("UserList").getData().push(JSONModel);
            this.getView().getModel("UserList").refresh(true);
        },
        _deleteRow: function () {
            let oTable = this.getView().byId("idUserScreenList"),
                aPath = oTable.getSelectedContextPaths(),
                aPathTmp = aPath.map(line => parseInt(line.substring(1)));
            aPathTmp.sort(function (a, b) {
                return b - a;
            });
            aPathTmp.forEach(line => {
                let path = "/".concat(line),
                    deleteIndex = parseInt(path.substring(path.lastIndexOf('/') + 1));
                oTable.getModel("UserList").getData().splice(deleteIndex, 1);

            });
            oTable.getModel("UserList").refresh();
            oTable.removeSelections(true);
        },
        _valueHelpGeneral: async function (oEvent, sType, sFilterParam) {
            var sModel = "",
                aFilter = [],
                sDialogId = "",
                sTitle = "";
            switch (sType) {
                case 'country':
                    sModel = "/CountriesSet"
                    sDialogId = "idCountrySH";
                    sTitle = this._getText("countrySHTitle");
                    break;
                case 'region':
                    sModel = "/RegionSet"
                    sDialogId = "idRegionSH";
                    sTitle = this._getText("regionSHTitle");
                    aFilter.push(new sap.ui.model.Filter("CountryID", sap.ui.model.FilterOperator.EQ, sFilterParam))
                    break;
                case 'wbselement':
                    this._sPath = oEvent.getSource().getBindingContext("UserList").getPath();
                    sModel = "/WbsElementSet";
                    sDialogId = "idWbsSH";
                    sTitle = this._getText("wbsElementSHTitle");
                    break;
            }

            _oGlobalBusyDialog.open();
            try {
                let oResponse = await this._sendQueryData(sModel, aFilter);
                if (oResponse.results) {
                    this.openDialogSH(sDialogId, oResponse.results, sTitle, sType)
                }
            } catch (e) {
                this._showServiceError(e);
            } finally {
                _oGlobalBusyDialog.close();
            }
        },
        _saveCreateTravel: function (bCreate) {
            var oMandatoryFields = this._getJsonData("/mandatoryFieldsCreateTravel"),
                oHeader = this.getView().getModel("Header").getData(),
                oItem = this.getView().getModel("UserList").getData(),
                sValueState,
                sManErr;
            if (bCreate) {

                for (var i in oMandatoryFields) {
                    if (!!oHeader[i] === false) {
                        sValueState = "Error";
                        sManErr = "X";
                    } else {
                        sValueState = "None";
                    }
                    this.getView().byId(oMandatoryFields[i]).setValueState(sValueState);
                }
                if (sManErr === "X") {
                    sap.m.MessageBox.error(this._getText("MANDFIELDS"));
                    return;
                }
            }
            if (oItem.length === 0) {
                sap.m.MessageBox.error(this._getText("MANDPERNR"));
                return;
            }
            sap.m.MessageBox.show(
                this._getText("createTravelTitle"), {
                icon: sap.m.MessageBox.Icon.INFORMATION,
                actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
                onClose: function (oAction) {
                    if (oAction === sap.m.MessageBox.Action.YES) {
                        this._postSave();
                    } else {
                        return;
                    }
                }.bind(this)
            })
        },
        _postSave: async function (bCreate) {
            var oDeepData = this.getView().getModel("Header").getData();
            oDeepData.TravelItemSet = this.getView().getModel("UserList").getData();
            oDeepData.MessageReturnSet = [];
            _oGlobalBusyDialog.open();
            try {
                let oResponse = await this._sendCreateData("/TravelSet", oDeepData);
                let oMessageManager = sap.ui.getCore().getMessageManager();
                var messageTypeMap = {
                    'E': sap.ui.core.MessageType.Error,
                    'S': sap.ui.core.MessageType.Success
                }
                oResponse.MessageReturnSet.results.forEach(oValues => {
                    var oMessageType = messageTypeMap[oValues.Type] || sap.ui.core.MessageType.None;

                    oMessageManager.addMessages(
                        new sap.ui.core.message.Message({
                            message: oValues.Message,
                            type: oMessageType,
                            persistent: false
                        })
                    );
                });

                var bReplace = !Device.system.phone;
                this.getRouter().navTo("list", {
                }, bReplace);



            } catch (error) {
                this._showServiceError(error)
            } finally {
                _oGlobalBusyDialog.close();
            }
        }


    });
});