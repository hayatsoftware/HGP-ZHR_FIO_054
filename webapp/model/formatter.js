sap.ui.define([
    "sap/ui/core/ValueState"
], function (ValueState) {
    "use strict";

    return {

        genericTagStatus: function (sStatus) {
            let mValueState = {
                "1": ValueState.Success,
                "2": ValueState.Information
            };

            return mValueState[sStatus] || ValueState.None;
        }

    };
});