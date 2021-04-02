sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Filter",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/Fragment",
	"sap/ui/model/Context"
], function (UI5Object, Filter, JSONModel, Fragment, Context) {
	"use strict";

	return UI5Object.extend("ZCO_AOH_PAPM_MANAGE_SEB.ext.utils.CopySEBGroup", {
		/**
		 * Constructor
		 *
		 * @param {sap.ui.core.mvc.View} press event
		 * @return 
		 * @public
		 */
		constructor: function (oView) {
			this._oView = oView;
			this._fragmentController = {
				_oView: this._oView,
				onCopy: function () {
					// Publish event 
					let oDialog = this._oView.byId("copyDialog");
					
					oDialog.close();
					this._publishEvent("systemCopy", {
						system: sSelectedKey
					});
				},
				onCancel: function () {
					let oDialog = this._oView.byId("copyDialog");
					oDialog.close();
				},
				handleChange: function (oEvent) {
					var oComboBox = oEvent.getSource(),
						sSelectedKey = oComboBox.getSelectedKey();

					// Get selected key in use parameter 
					let oDialog = this._oView.byId("systemSelectDialog");
					let aSystems = oDialog.getModel("localModel").getProperty("/systems");
					let oSystem = aSystems.filter((element) => {
						return (element.System === sSelectedKey);
					})[0];
					oDialog.getModel("localModel").setProperty("/messageStripVisible", true);
					let oMessageStrip = this._oView.byId("systemSelectionMSId");
					oMessageStrip.bindProperty("text", (oSystem.SystemInUse) ? "i18n>SelectSystemExistingLine" : "i18n>SelectSystemNewLine");
				},
				_publishEvent: function (sName, oParam) {
					var oEventBus = sap.ui.getCore().getEventBus();
					if (oEventBus) {
						oEventBus.publish("com.bosch.co.zco_aoh_seb", sName, oParam);
					}
				},
			}
		},

		/**
		 * Opens the dialog
		 *
		 * @param {array} array of items to be displayed in pop up
		 * @return 
		 * @public
		 */
		open: function (aSystems) {
			if (!this._pDialog) {
				this._pDialog = Fragment.load({
					id: this._oView.getId(),
					name: "ZCO_PAPM_SEB_Upload.ZCO_PAPM_SEB_Upload.fragments.SelectSenderSystem",
					controller: this._fragmentController
				}).then(function (oDialog) {
					let oLocalModel = new JSONModel();
					oDialog.setModel(oLocalModel, "localModel");
					oDialog.setModel(this._oView.getModel("i18n"), "i18n");
					return oDialog;
				}.bind(this));
			}

			this._pDialog.then(function (oDialog) {
				let oModel = oDialog.getModel("localModel");
				oModel.setProperty("/systems", aSystems);
				oModel.setProperty("/messageStripVisible", false);
				let oComboBox = this._oView.byId("systemComboBox");
				oComboBox.setSelectedKey("");	
				oDialog.open();
			}.bind(this));
		}
	});
});