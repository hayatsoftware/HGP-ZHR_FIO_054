sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/PDFViewer",
	"sap/m/UploadCollectionParameter",
	"sap/m/ObjectAttribute"
], function (BaseController, JSONModel, PDFViewer, UploadCollectionParameter, ObjectAttribute) {
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
			this._aPendingUploaderParameters = [];

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
			this._uploadCollectionDragAndDropDisable();
			this._getData(sReinr, sGrupSeyahatNo);
		},

		_onCreateTravelObjectMatched: function () {
			this._bNewRequest = true;
			this._aPendingUploaderParameters = [];

			let oScreenModel = this.getModel("screenModels");
			oScreenModel.setProperty("/generalEditable", true);
			oScreenModel.setProperty("/isNewRequest", true);

			let oAppViewModel = this.getModel("appView");
			oAppViewModel.setProperty("/actionButtonsInfo/midColumn/fullScreen", true);
			oAppViewModel.setProperty("/previousLayout", "TwoColumnsMidExpanded");
			oAppViewModel.setProperty("/layout", "MidColumnFullScreen")

			let sTitleKey = oScreenModel.getProperty("/isGroupTravel") ? "newGroupTravelRequest" : "newTravelRequest";
			this._setTitle(sTitleKey);
			this._uploadCollectionDragAndDropDisable();
			this.resetMessageModel();
			this._getHeaderData();
			this._getItemData();
		},
		_uploadCollectionDragAndDropDisable: function () {
			let oUploadCollection = this.byId("idUploadCollection");
			 
			oUploadCollection.addDelegate({
				ondragenter: function (oEvent) {
					oEvent.stopPropagation()
				},
				ondragover: function (oEvent) {
					oEvent.stopPropagation()
				},
				ondrop: function (oEvent) {
					oEvent.stopPropagation()
				}
			}, true);
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
				this.ZzGrup = oEmployeeDefaults.ZzGrup;

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
			this.getView().setModel(new JSONModel([]), "AttachmentList");
		},

		_getData: async function (sReinr, sGrupSeyahatNo) {
			var sPath = this.oDataModel.createKey("/TravelSet", {
				Reinr: sReinr,
				GrupSeyahatNo: sGrupSeyahatNo
			});

			var mUrlParameters = {
				$expand: "TRAVELITEMSET/ESTIMATEDCOSTSET,TRAVELITEMSET/ATTACHMENTSET"
			};

			try {
				_oGlobalBusyDialog.open();
				var oTravelRequest = await this._sendReadData(sPath, mUrlParameters),
					aEstimatedCostList = [],
					aAttachmentList = [];

				oTravelRequest.TRAVELITEMSET.results.forEach(oTravelItem => {
					oTravelItem.NonEditable = true;
					oTravelItem.ESTIMATEDCOSTSET.results.forEach(oCost => {
						aEstimatedCostList.push(oCost);
					});

					oTravelItem.ATTACHMENTSET.results.forEach(oAttachment => {
						aAttachmentList.push(oAttachment);
					});
				});

				this.getView().setModel(new JSONModel(oTravelRequest), "Header");
				this.getView().setModel(new JSONModel(oTravelRequest.TRAVELITEMSET.results), "UserList");
				this.getView().setModel(new JSONModel(aEstimatedCostList), "EstimatedCostList");
				this.getView().setModel(new JSONModel(aAttachmentList), "AttachmentList");

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
			this.getView().setModel(new JSONModel(this._aPendingUploaderParameters), "PendingUploadList");

			//var oResourceBundle = this.getResourceBundle();
			// Bugünün tarihini al
			//const today = new Date();
			// Karşılaştırılacak tarih (31 Mart 2025)
			//const compareDate = new Date('2025-03-31');
			// if (today < compareDate) {
			// 	if (this.getModel("Header").getProperty('/TripActivity') !== 'G' && this.ZzGrup == '01') {

			// 		sap.m.MessageBox.confirm(oResourceBundle.getText("paymentInfo"), {
			// 			title: "Confirm",                                    // default
			// 			onClose: null,                                       // default
			// 			styleClass: "",                                      // default
			// 			actions: [sap.m.MessageBox.Action.OK],         // default
			// 			emphasizedAction: sap.m.MessageBox.Action.OK,        // default
			// 			initialFocus: null,                                  // default
			// 			textDirection: sap.ui.core.TextDirection.Inherit,    // default
			// 			dependentOn: null,
			// 			onClose: function (oAction) {
			// 				if (oAction === sap.m.MessageBox.Action.OK) {
			// 					this.resetMessageModel();
			// 					this._saveCreateTravel(this._bNewRequest);
			// 				}
			// 			}.bind(this)
			// 		});

			// 		// return;
			// 	} else {
					this.resetMessageModel();
					this._saveCreateTravel(this._bNewRequest);
			//	}

			// }


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
		},

		/* ============================================================= */
		/* Doküman işlemleri											 */
		/* ============================================================= */
		onUploadChange: function (oEvent) {
			let oScreenModel = this.getModel("screenModels"),
				oHeader = this.getModel("Header").getData(),
				aUserList = this.getModel("UserList").getData();

			oScreenModel.setProperty("/selectedDocument/PernrEditable", oHeader.Grup);
			oScreenModel.setProperty("/selectedDocument/Pernr", oHeader.Grup ? "" : aUserList[0].Pernr);
			oScreenModel.setProperty("/selectedDocument/Type", "");

			this._oUploader = oEvent.getSource()._oFileUploader;
			this.openDialog("documentInfoDialog", "com.hayat.grupseyahat.grupseyahattalebi.fragments.DocumentInfoDialog");
		},

		onBeforeUploadStarts: function (oEvent) {
			let oRequestParam = oEvent.getParameters().getHeaderParameter().find(_oParam => _oParam.getName().includes("requestId"));
			let oFileUploader = oEvent.getSource()._aFileUploadersForPendingUpload.find(_oUploader => {
				return _oUploader.getHeaderParameters().find(_oParam => _oParam.getName() === oRequestParam.getName() && _oParam.getValue() === oRequestParam.getValue());
			});

			let oHeaderParameter = this._aPendingUploaderParameters.find(_oParam => _oParam.Id === oFileUploader.getId()),
				oAppModel = this.getModel("appView");

			oHeaderParameter.Reinr = oAppModel.getProperty("/postResponse/TRAVELITEMSET/results").find(_oItem => _oItem.Pernr === oHeaderParameter.Pernr).Reinr;

			let oModel = this.getModel();
			oModel.refreshSecurityToken();
			let sCSRF = oModel.getHeaders()["x-csrf-token"];

			let oCSRFTokenParameter = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: sCSRF
			});

			let oFilenameParameter = new UploadCollectionParameter({
				name: "slug",
				value: btoa(encodeURIComponent(oEvent.getParameter("fileName")))
			});

			let oTravelNumberParameter = new UploadCollectionParameter({
				name: "reinr",
				value: oHeaderParameter.Reinr
			});

			let oPersonnelNumberParameter = new UploadCollectionParameter({
				name: "pernr",
				value: oHeaderParameter.Pernr
			});

			let oDocumentTypeParameter = new UploadCollectionParameter({
				name: "type",
				value: oHeaderParameter.Type
			});

			oEvent.getParameters().addHeaderParameter(oCSRFTokenParameter);
			oEvent.getParameters().addHeaderParameter(oFilenameParameter);
			oEvent.getParameters().addHeaderParameter(oTravelNumberParameter);
			oEvent.getParameters().addHeaderParameter(oPersonnelNumberParameter);
			oEvent.getParameters().addHeaderParameter(oDocumentTypeParameter);
		},

		onUploadComplete: function () {
			let oAppModel = this.getModel("appView");
			oAppModel.setProperty("/postResponse", null);
		},

		onCloseDialogDocumentInfo: function () {
			let oSelectedDocument = this._getJsonData("/selectedDocument");

			if (!oSelectedDocument.Pernr || !oSelectedDocument.Type) {
				this.openDialog("documentInfoDialog", "com.hayat.grupseyahat.grupseyahattalebi.fragments.DocumentInfoDialog");
			}
		},

		onSaveDocumentInfo: function (oEvent) {
			let oSelectedDocument = this._getJsonData("/selectedDocument");

			if (oSelectedDocument.Pernr && oSelectedDocument.Type) {
				this._aPendingUploaderParameters.push({
					Id: this._oUploader.getId(),
					Pernr: oSelectedDocument.Pernr,
					Type: oSelectedDocument.Type
				});

				let oModel = this.getModel(),
					aUploadCollectionItems = this.byId("idUploadCollection").getItems(),
					aUserList = this.getModel("UserList").getData(),
					oResourceBundle = this.getResourceBundle();

				let oUploadedItem = aUploadCollectionItems.find(oItem => oItem.getAssociation("fileUploader") === this._oUploader.getId()),
					oSelectedPersonnel = aUserList.find(oUser => oUser.Pernr === oSelectedDocument.Pernr),
					sAttachmentTypeBindingPath = oModel.createKey("/AttachmentTypeSet", {
						Id: oSelectedDocument.Type
					});

				oUploadedItem.addAttribute(
					new ObjectAttribute({
						title: oResourceBundle.getText("PERSONNEL"),
						text: oSelectedPersonnel.FirstName + " " + oSelectedPersonnel.LastName
					}));

				oUploadedItem.addAttribute(
					new ObjectAttribute({
						title: oResourceBundle.getText("documentType"),
						text: oModel.getProperty(sAttachmentTypeBindingPath + "/Name")
					}));
			}

			oEvent.getSource().getParent().close();
		}

	});
});