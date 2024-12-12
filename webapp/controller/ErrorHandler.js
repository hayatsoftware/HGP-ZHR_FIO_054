sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageBox"
], function (UI5Object, MessageBox) {
    "use strict";

    return UI5Object.extend("com.hayat.grupseyahat.grupseyahattalebi.controller.ErrorHandler", {

        /**
         * Handles application errors by automatically attaching to the model events and displaying errors when needed.
         * @class
         * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
         * @public
         * @alias com.hayat.grupseyahat.grupseyahattalebi.controller.ErrorHandler
         */
        constructor: function (oComponent) {
            this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
            this._oComponent = oComponent;
            this._oModel = oComponent.getModel();
            this._bMessageOpen = false;

            this._oModel.attachMetadataFailed(function (oEvent) {
                var oParams = oEvent.getParameters();
                this._showServiceError(oParams.response);
            }, this);

            this._oModel.attachRequestFailed(function (oEvent) {
                var oParams = oEvent.getParameters();
                this._showServiceError(oParams.response);
            }, this);
        },

        /**
         * Shows a {@link sap.m.MessageBox} when a service call has failed.
         * Only the first error message will be display.
         * @param {string} sDetails a technical error to be displayed on request
         * @private
         */
        _showServiceError: function (sDetails) {
            let sErrorText = "";

            if (this._bMessageOpen) {
                return;
            }

            try {
                let oError = JSON.parse(sDetails.responseText).error;
                sErrorText = oError?.innererror?.errordetails?.find((oInnerError) => oInnerError.code === "")?.message;

                if (!sErrorText) {
                    sErrorText = oError.message.value;
                }

            } catch (error) {
                let oDOMParser = new DOMParser(),
                    oDocument = oDOMParser.parseFromString(sDetails.responseText, "application/xml");

                sErrorText = oDocument.querySelector("message").getInnerHTML();
            }

            this._bMessageOpen = true;
            MessageBox.error(sErrorText, {
                id: "serviceErrorMessageBox",
                details: sDetails,
                styleClass: this._oComponent.getContentDensityClass(),
                actions: [MessageBox.Action.CLOSE],
                onClose: function () {
                    this._bMessageOpen = false;
                }.bind(this)
            });
        }

    });
});