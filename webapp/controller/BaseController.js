sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Filter",
    "sap/m/MessageBox",
    "sap/ui/Device",
    "../model/formatter"
], function (Controller, JSONModel, Fragment, FilterOperator, Filter, MessageBox, Device, Formatter) {
    "use strict";

    var _oGlobalBusyDialog = new sap.m.BusyDialog();

    return Controller.extend("com.hayat.grupseyahat.grupseyahattalebi.controller.BaseController", {

        formatter: Formatter,

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

        _sendReadData: function (sPath, mUrlParameters) {
            return new Promise((fnSuccess, fnReject) => {
                const oParameters = {
                    success: fnSuccess,
                    error: fnReject,
                    urlParameters: mUrlParameters
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

        _getText: function (sText) {
            return this.getView().getModel("i18n").getResourceBundle().getText(sText);
        },

        _getJsonData: function (sModel) {
            return jQuery.extend(true, {}, this.getOwnerComponent().getModel("screenModels").getProperty(sModel));
        },

        _valueHelpGeneral: async function (oEvent, sType, sFilterParam) {
            var sModel = "",
                aFilter = [],
                sDialogId = "",
                sTitle = "";

            if (sType === "wbselement") {
                this._sPath = oEvent.getSource().getBindingContext("UserList").getPath();

                if (!this._oWbsElementSelectDialog) {
                    this._oWbsElementSelectDialog = new sap.m.SelectDialog("idWbsElementSH", {
                        title: this._getText("wbsElementSHTitle"),
                        items: {
                            path: "/WbsElementSet",
                            parameters: {
                                operationMode: sap.ui.model.odata.OperationMode.Server
                            },
                            template: new sap.m.StandardListItem({
                                info: "{Id}",
                                title: "{Posid}",
                                description: "{Name}"
                            })
                        },
                        confirm: (_oEvent) => {
                            let oUserListModel = this.getView().getModel("UserList"),
                                oSelectedItemContext = _oEvent.getParameter("selectedItem").getBindingContext().getProperty();

                            oUserListModel.setProperty(this._sPath + "/WbsElement", oSelectedItemContext.Id);
                            oUserListModel.setProperty(this._sPath + "/WbsElementName", oSelectedItemContext.Name);
                            oUserListModel.refresh(true);
                        },
                        search: (_oEvent) => {
                            let aFilter = [],
                                sValue = _oEvent.getParameter("value").replaceAll("-", "").trim(),
                                bClearButtonPressed = _oEvent.getParameter("clearButtonPressed");

                            if (!bClearButtonPressed && sValue) {
                                aFilter = [new Filter("Posid", FilterOperator.Contains, sValue)];
                            }

                            _oEvent.getParameter("itemsBinding").filter(aFilter);
                        }
                    });

                    this.getView().addDependent(this._oWbsElementSelectDialog);
                }

                this._oWbsElementSelectDialog.open();

            } else {
                switch (sType) {
                    case "country":
                        sModel = "/CountriesSet";
                        sDialogId = "idCountrySH";
                        sTitle = this._getText("countrySHTitle");
                        break;

                    case "region":
                        sModel = "/RegionSet";
                        sDialogId = "idRegionSH";
                        sTitle = this._getText("regionSHTitle");
                        aFilter.push(new Filter("CountryID", FilterOperator.EQ, sFilterParam));
                        break;

                    case "costcenter":
                        this._sPath = oEvent.getSource().getBindingContext("UserList").getPath();
                        sModel = "/CostCenterSet";
                        sDialogId = "idCostCenterSH";
                        sTitle = this._getText("costCenterSHTitle");
                        break;

                    case "internalorder":
                        this._sPath = oEvent.getSource().getBindingContext("UserList").getPath();
                        sModel = "/InternalOrdersSet";
                        sDialogId = "idInternalOrderSH";
                        sTitle = this._getText("internalOrderSHTitle");
                        break;
                }

                _oGlobalBusyDialog.open();

                try {
                    let oResponse = await this._sendQueryData(sModel, aFilter);
                    if (oResponse.results) {
                        this.openDialogSH(sDialogId, oResponse.results, sTitle, sType)
                    }

                } finally {
                    _oGlobalBusyDialog.close();
                }
            }
        },

        openPopover: function (sPopoverId, sFragmentName, oSource) {
            return new Promise(async (fnResolve, fnReject) => {
                let oView = this.getView(),
                    oPopover = this.byId(sPopoverId),
                    sContentDensityClass = this.getOwnerComponent().getContentDensityClass();

                try {
                    if (oPopover) {
                        oPopover.openBy(oSource);

                    } else {
                        let mProperties = {
                            id: oView.getId(),
                            name: sFragmentName,
                            controller: this
                        };

                        oPopover = await Fragment.load(mProperties);
                        jQuery.sap.syncStyleClass(sContentDensityClass, oView, oPopover);
                        oView.addDependent(oPopover);
                        oPopover.openBy(oSource);
                    }

                    fnResolve(oPopover);

                } catch (oException) {
                    fnReject(oException);
                }
            });
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
                    filters: [],
                    and: false,
                }),
                oBinding = oEvent.getParameter("itemsBinding");

            if (!!sValue === true) {
                oFilters.aFilters.push(new Filter("Id", FilterOperator.Contains, sValue));
                oFilters.aFilters.push(new Filter("Name", FilterOperator.Contains, sValue));
                oBinding.filter([oFilters]);
            } else {
                oBinding.filter([]);
            }
        },

        confirmSHDialog: async function (oEvent) {
            let oSource = oEvent.getSource(),
                oSelectedItem = oEvent.getParameter("selectedItem");

            let sKey = oSelectedItem.getTitle(),
                sText = oSelectedItem.getDescription(),
                sType = oSource.getModel().getProperty("/shType");

            let oHeaderModel = this.getView().getModel("Header"),
                oUserListModel = this.getView().getModel("UserList");

            switch (sType) {
                case "country":
                    oHeaderModel.setProperty("/CountryCode", sKey);
                    oHeaderModel.setProperty("/CountryName", sText);
                    break;

                case "region":
                    oHeaderModel.setProperty("/RegionCode", sKey);
                    oHeaderModel.setProperty("/RegionName", sText);

                    if (!oHeaderModel.getProperty("/Grup")) {
                        let oUserDetail = this.getView().getModel("UserList").getProperty("/0"),
                            oEmployeeDefaults = await this._getEmployeeDefaults();

                        oUserDetail.Pernr = oEmployeeDefaults.Pernr;
                        oUserDetail.FirstName = oEmployeeDefaults.FirstName;
                        oUserDetail.LastName = oEmployeeDefaults.LastName;
                        oUserDetail.CompanyCode = oEmployeeDefaults.CompanyCode;
                        oUserDetail.Plans = oEmployeeDefaults.Plans;
                        oUserDetail.PlansText = oEmployeeDefaults.PlansText;
                        oUserDetail.CostCenter = oEmployeeDefaults.CostCenter;
                        oUserDetail.CostCenterName = oEmployeeDefaults.CostCenterName;
                        oUserDetail.InternalOrder = oEmployeeDefaults.InternalOrder;
                        oUserDetail.InternalOrderName = oEmployeeDefaults.InternalOrderName;
                        this.getView().getModel("UserList").setProperty("/0", oUserDetail);
                    }

                    break;

                case "costcenter":
                    oUserListModel.setProperty(this._sPath + "/CostCenter", sKey);
                    oUserListModel.setProperty(this._sPath + "/CostCenterName", sText);
                    oUserListModel.refresh(true);
                    break;

                case "internalorder":
                    oUserListModel.setProperty(this._sPath + "/InternalOrder", sKey);
                    oUserListModel.setProperty(this._sPath + "/InternalOrderName", sText);
                    oUserListModel.refresh(true);
                    break;

                case "wbselement":
                    oUserListModel.setProperty(this._sPath + "/WbsElement", sKey);
                    oUserListModel.setProperty(this._sPath + "/WbsElementName", sText);
                    oUserListModel.refresh(true);
                    break;
            }

            oSource.destroy();
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
                aFilter.push(new Filter("Ename", FilterOperator.EQ, sText));
            } else {
                aFilter.push(new Filter("Pernr", FilterOperator.EQ, sText));
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

            let sUsername = oList.getModel().getObject(oList.getSelectedContextPaths()[0]).Username,
                sRegionCode = this.getView().getModel("Header").getProperty("/RegionCode");

            let oModel = this.getModel(),
                sEmployeePath = oModel.createKey("/EmployeeSet", {
                    Username: sUsername,
                    RegionCode: sRegionCode
                });

            oDialog.close();
            _oGlobalBusyDialog.open();

            try {
                let oResponse = await this._sendReadData(sEmployeePath),
                    oRowModel = this.getView().getModel("UserList").getProperty(this._sPath);

                for (var i in oRowModel) {
                    oRowModel[i] = oResponse[i];
                }

                this.getView().getModel("UserList").setProperty(this._sPath, oRowModel);

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
                this._waitForButtonRendering().then((oMessagesButton) => {
                    this._openMessagePopover(oMessagesButton);
                });
            }
        },

        _waitForButtonRendering: function () {
            return new Promise((resolve) => {
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
            });
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

        _addRow: function (sModelName, sJSONProperty) {
            let JSONModel = this._getJsonData(sJSONProperty);
            this.getView().getModel(sModelName).getData().push(JSONModel);
            this.getView().getModel(sModelName).refresh(true);
        },

        _deleteRow: function (sModelName, sTableId) {
            let oTable = this.getView().byId(sTableId),
                aPath = oTable.getSelectedContextPaths(),
                aPathTmp = aPath.map(line => parseInt(line.substring(1)));

            aPathTmp.sort(function (a, b) {
                return b - a;
            });

            aPathTmp.forEach(line => {
                let path = "/".concat(line),
                    deleteIndex = parseInt(path.substring(path.lastIndexOf("/") + 1));

                let bNonEditable = oTable.getSelectedContexts().find(oContext => oContext.getPath() === path).getProperty("NonEditable");
                if (!bNonEditable) {
                    oTable.getModel(sModelName).getData().splice(deleteIndex, 1);
                }
            });

            oTable.getModel(sModelName).refresh();
            oTable.removeSelections(true);
        },

        _saveCreateTravel: function (bCreate) {
            var oMandatoryFields = this._getJsonData("/mandatoryFieldsCreateTravel"),
                bNewRequest = this._getJsonData("/isNewRequest"),
                oHeader = this.getView().getModel("Header").getData(),
                aItem = this.getView().getModel("UserList").getData(),
                aAttachmentList = this.getView().getModel("AttachmentList").getData(),
                aPendingUploadList = this.getView().getModel("PendingUploadList").getData(),
                sValueState = "",
                bError = false;

            try {
                // zorunlu alan kontrolleri
                for (var i in oMandatoryFields) {
                    if (!!oHeader[i] === false) {
                        sValueState = "Error";
                        bError = true;
                    } else {
                        sValueState = "None";
                    }

                    this.getView().byId(oMandatoryFields[i]).setValueState(sValueState);
                }

                if (bError) {
                    throw new Error(this._getText("MANDFIELDS"));
                }

                // proje seçim kontrolü
                if (oHeader.TripActivity === "G" && !oHeader.Zzproje) {
                    this.getView().byId("idZzproje").setValueState(sValueState);
                    throw new Error(this._getText("MANDFIELDS"));
                }

                if (bNewRequest && oHeader.Grup && aItem.length === 0) {
                    throw new Error(this._getText("MANDFIELDS"));
                }

                // yurtdışı seyahatleri pasaport, vize, uçuş ve otel bilgileri kontrolleri
                if (oHeader.CountryCode !== "TR") {
                    aItem.forEach(oItem => {
                        if (!oItem.ZzpasaportNo || !oItem.ZzpasaportNo || !oItem.ZzpasaportTur || !oItem.ZzpasaportTarih || !oItem.ZzvizeIhtiyac || !oItem.ZzucusIhtiyac || !oItem.ZzotelIhtiyac) {
                            throw new Error(this._getText("MANDPASSVISAINFO"));
                        }

                        // pasaport doküman kontrolü
                        let bCheckPassport = aAttachmentList.find(oAttachment => oAttachment.Pernr === oItem.Pernr && oAttachment.Type === "P");
                        if (!bCheckPassport) {
                            bCheckPassport = aPendingUploadList.find(oAttachment => oAttachment.Pernr === oItem.Pernr && oAttachment.Type === "P");
                            if (!bCheckPassport) {
                                throw new Error(this._getText("MANDPASSDOC"));
                            }
                        }

                        // vize doküman kontrolü
                        if (oItem.ZzvizeIhtiyac === "4") {
                            let bCheckVisa = aAttachmentList.find(oAttachment => oAttachment.Pernr === oItem.Pernr && oAttachment.Type === "V");
                            if (!bCheckVisa) {
                                bCheckVisa = aPendingUploadList.find(oAttachment => oAttachment.Pernr === oItem.Pernr && oAttachment.Type === "V");
                                if (!bCheckVisa) {
                                    throw new Error(this._getText("MANDVISADOC"));
                                }
                            }
                        }
                    });
                }

            } catch (oError) {
                MessageBox.error(oError.message);
                return;
            }

            MessageBox.confirm(this._getText("createTravelTitle"), {
                onClose: (oAction) => {
                    if (oAction === MessageBox.Action.OK) {
                        this._postSave(bCreate);
                    }
                }
            });
        },

        _postSave: async function (bCreate) {
            let oDeepData = this.getView().getModel("Header").getData();
            oDeepData.MESSAGERETURNSET = [];
            oDeepData.TRAVELITEMSET = this.getView().getModel("UserList").getData();
            oDeepData.TRAVELITEMSET.forEach(oTravelItem => {
                delete oTravelItem.NonEditable;
                oTravelItem.ESTIMATEDCOSTSET = this.getView().getModel("EstimatedCostList").getData();
                oTravelItem.ESTIMATEDCOSTSET.forEach(oEstimatedCost => {
                    oEstimatedCost.Value = (+oEstimatedCost.Value).toFixed(2);
                });
            });

            _oGlobalBusyDialog.open();

            try {
                let bHasError = false,
                    oResponse = await this._sendCreateData("/TravelSet", oDeepData),
                    oMessageManager = sap.ui.getCore().getMessageManager(),
                    mMessageType = {
                        E: sap.ui.core.MessageType.Error,
                        S: sap.ui.core.MessageType.Success,
                        W: sap.ui.core.MessageType.Warning
                    };

                oResponse.MESSAGERETURNSET.results.forEach(oValues => {
                    var sMessageType = mMessageType[oValues.Type] || sap.ui.core.MessageType.None;

                    oMessageManager.addMessages(
                        new sap.ui.core.message.Message({
                            message: oValues.Message,
                            type: sMessageType,
                            persistent: false
                        })
                    );

                    if (sMessageType === sap.ui.core.MessageType.Error) {
                        bHasError = true;
                    }
                });

                if (oDeepData.Grup || !bHasError) {
                    this.getModel("appView").setProperty("/postResponse", oResponse);
                    this.byId("idUploadCollection").upload();

                    let bReplace = !Device.system.phone;
                    this.getRouter().navTo("list", {}, bReplace);
                }

            } finally {
                _oGlobalBusyDialog.close();
                this._checkMessages();
            }
        },

        _getEmployeeDefaults: function () {
            let oModel = this.getModel(),
                oHeaderModel = this.getModel("Header");

            let sPath = oModel.createKey("/EmployeeSet", {
                Username: "",
                RegionCode: oHeaderModel.getProperty("/RegionCode")
            });

            return this._sendReadData(sPath);
        }

    });
});