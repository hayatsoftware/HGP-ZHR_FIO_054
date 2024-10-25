sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel"
  ],
  function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("com.hayat.grupseyahat.grupseyahattalebi.controller.App", {
      onInit: function () {
        var oViewModel,
          fnSetAppNotBusy,
          iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

        oViewModel = new JSONModel({
          busy: true,
          delay: 0,
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
        this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
        this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);
        this.getOwnerComponent().getModel().attachRequestFailed(this._removeDuplicateMessages);

        // apply content density mode to root view
        this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
        let oMessageManager = sap.ui.getCore().getMessageManager();

        this.getOwnerComponent().setModel(oMessageManager.getMessageModel(), "message");
      }
    });
  }
);
