sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/Device",
], function (BaseController, JSONModel, Filter, FilterOperator, Device) {
    "use strict";

    var _oGlobalBusyDialog = new sap.m.BusyDialog();

    return BaseController.extend("com.hayat.grupseyahat.grupseyahattalebi.controller.List", {
        /**
         * @override
         */
        onInit: function () {
            // Control state model
            var oList = this.byId("list"),
                oViewModel = this._createViewModel(),
                // Put down list's original value for busy indicator delay,
                // so it can be restored later on. Busy handling on the list is
                // taken care of by the list itself.
                iOriginalBusyDelay = oList.getBusyIndicatorDelay();


            this._oList = oList;

            // keeps the filter and search state
            this._oListFilterState = {
                aFilter: [],
                aSearch: []
            };
            this._oListTemp = this._oList.getBindingInfo("items").template;
            this._oList.unbindAggregation("items");
            this.setModel(oViewModel, "listView");
            // Make sure, busy indication is showing immediately so there is no
            // break after the busy indication for loading the view's meta data is
            // ended (see promise 'oWhenMetadataIsLoaded' in AppController)
            oList.attachEventOnce("updateFinished", function () {
                // Restore original busy indicator delay for the list
                oViewModel.setProperty("/delay", iOriginalBusyDelay);
            });

            this.getRouter().getRoute("list").attachPatternMatched(this._onMasterMatched, this);
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */
        /**
         * After list data is available, this handler method updates the
         * list counter
         * @param {sap.ui.base.Event} oEvent the update finished event
         * @public
         */
        onUpdateFinished: function (oEvent) {
            // update the list object counter after new data is loaded
            var bReplace = !Device.system.phone;
            /*   this._updateListItemCount(oEvent.getParameter("total")); */
            var firstItem = this._oList.getSelectedItem();
            if (firstItem) {
                this._oList.setSelectedItem(firstItem);
                this.getRouter().navTo("detail", {
                    Reinr: firstItem.getBindingContext().getProperty("Reinr"),
                    GrupSeyahatNo: firstItem.getBindingContext().getProperty("GrupSeyahatNo")
                }, bReplace);
            } else {
                this.getModel("appView").setProperty("/layout", "OneColumn");
            }
        },

        /**
         * Event handler for the list search field. Applies current
         * filter value and triggers a new search. If the search field's
         * 'refresh' button has been pressed, no new search is triggered
         * and the list binding is refresh instead.
         * @param {sap.ui.base.Event} oEvent the search event
         * @public
         */
        onSearch: function (oEvent) {
            if (oEvent.getParameters().refreshButtonPressed) {
                // Search field's 'refresh' button has been pressed.
                // This is visible if you select any list item.
                // In this case no new search is triggered, we only
                // refresh the list binding.
                this.onRefresh();
                return;
            }

            var sQuery = oEvent.getParameter("query");

            if (sQuery) {
                var array = [new Filter("CountryName", FilterOperator.Contains, sQuery),
                new Filter("RegionName", FilterOperator.Contains, sQuery),
                new Filter("TripActivityName", FilterOperator.Contains, sQuery),
                new Filter("Purpose", FilterOperator.Contains, sQuery)];
                this._oListFilterState.aSearch = [new Filter(array, false)];
            } else {
                this._oListFilterState.aSearch = [];
            }
            this._applyFilterSearch();

        },

        /**
         * Event handler for refresh event. Keeps filter, sort
         * and group settings and refreshes the list binding.
         * @public
         */
        onRefresh: function () {
            this._readList();
        },

        onCreateNewTravel: function (bGroup) {
            let oScreenModel = this.getModel("screenModels");
            oScreenModel.setProperty("/isGroupTravel", bGroup);

            var bReplace = !Device.system.phone;
            this.getRouter().navTo("createTravel", bReplace);
        },

        _onMasterMatched: function () {
            this.oDataModel = this.getOwnerComponent().getModel();
            this.getModel("appView").setProperty("/layout", "OneColumn");
            this._checkMessages();
            this._readList();
        },

        _readList: async function () {
            _oGlobalBusyDialog.open();
            try {
                let oResponse = await this._sendQueryData("/TravelSet", []);
                this._oList.unbindAggregation("items");
                this._oList.setModel(new JSONModel(oResponse.results));
                this._oList.bindAggregation("items", {
                    path: "/",
                    template: this._oListTemp,
                    templateShareable: true
                });
                var sTitle = this.getResourceBundle().getText("listTitleCount", [oResponse.results.length]);
                this.getModel("listView").setProperty("/title", sTitle);
                this.getModel("listView").setProperty("/count", oResponse.results.length);

            } finally {
                _oGlobalBusyDialog.close();
            }
        },

        onSelectionChange: function (oEvent) {
            var oList = oEvent.getSource(),
                bSelected = oEvent.getParameter("selected");

            // skip navigation when deselecting an item in multi selection mode
            if (!(oList.getMode() === "MultiSelect" && !bSelected)) {
                // get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
                this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
            }
        },

        _showDetail: function (oItem) {
            var bReplace = !Device.system.phone;
            // set the layout property of FCL control to show two columns
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
            this.getRouter().navTo("detail", {
                Reinr: oItem.getBindingContext().getProperty("Reinr"),
                GrupSeyahatNo: oItem.getBindingContext().getProperty("GrupSeyahatNo")
            }, bReplace);
        },

        _createViewModel: function () {
            return new JSONModel({
                isFilterBarVisible: false,
                filterBarLabel: "",
                delay: 0,
                title: this.getResourceBundle().getText("listTitleCount", [0]),
                noDataText: this.getResourceBundle().getText("listListNoDataText"),
                sortBy: "TalepEden",
                groupBy: "None",
                selectedIndex: 0
            });
        }
    });
});