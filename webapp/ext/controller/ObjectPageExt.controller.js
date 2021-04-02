sap.ui.define([
	"ZCO_AOH_PAPM_MANAGE_SEB/ext/utils/SmartValueHelp",
	"sap/m/MessageBox"
], function (SmartValueHelp, MessageBox) {
	"use strict";

	sap.ui.controller("ZCO_AOH_PAPM_MANAGE_SEB.ext.controller.ObjectPageExt", {
		onInit: function (oEvent) {
			this.extensionAPI.attachPageDataLoaded(this._objectPageLoaded.bind(this));
			this._senderValueHelpAttached = false;
			this._receiverValueHelpAttached = false;
		},

		_attachSenderValueHelp: function () {
			if (!this._senderValueHelpAttached) {
				let oInput = this.getView().byId("ITM02::SenderCostObject::Field-input"); 
				oInput.setShowValueHelp(true);
				oInput.attachValueHelpRequest(function (oEvt) {
					let sSenderCostObjectType = this.getView().getBindingContext().getObject().SenderCostObjectType;
					if ((!sSenderCostObjectType)) {
						let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
						let sMessage = oResourceBundle.getText("ValueHelpErrorSender"); 
						MessageBox.error(sMessage);
					} else {
						this._valueHelpRequest("ITM02::SenderCostObject::Field-input", "", oInput, "SenderCostObjectType", false);
					} 
				}.bind(this));
				this._senderValueHelpAttached = true;

			}
		},
		
		_attachReceiverValueHelp: function () {
			if (!this._receiverValueHelpAttached) {
				let oInput = this.getView().byId("ITM03::ReceiverCostObject::Field-input");
				oInput.setShowValueHelp(true);
				oInput.attachValueHelpRequest(function (oEvt) {
					let sReceiverSystem = this.getView().getBindingContext().getObject().ReceiverSystem;
					let sCompanyCode = this.getView().getBindingContext().getObject().ReceiverCompanyCode;
					let sReceiverCostObjectType = this.getView().getBindingContext().getObject().ReceiverCostObjectType;
					if ((!sReceiverSystem) || (!sCompanyCode) || (!sReceiverCostObjectType)) {
						let oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
						let sMessage = oResourceBundle.getText("ValueHelpErrorReceiver"); 
						MessageBox.error(sMessage);
					} else {
						this._valueHelpRequest("ITM03::ReceiverCostObject::Field-input", "", oInput, "ReceiverCostObjectType", true, {
							ReceiverSystem: sReceiverSystem, // Will be filled before calling 
							CompanyCode: sCompanyCode
						}, ["ReceiverSystem", "CompanyCode"]);
					} 
				}.bind(this));
				this._receiverValueHelpAttached = true;
			}
		},
		
		_reworkValueHelps: function(){
			this._receiverValueHelpAttached = false;
			this._senderValueHelpAttached = false;
			this._attachValueHelps();
		},

		_objectPageLoaded: function (oEvent) {
			// Sender 
			this._attachValueHelps();
			// Attach property cange handlers
			// Once property change call is finished, we want to refresh the ui
			// To make certain changes visible
			// Probably it is not working by the default 
			this.getView().getModel().attachPropertyChange(this._propertyChange.bind(this));
		},
		
		_attachValueHelps: function(){
			if (this.getView().byId("ITM02::SenderCostObject::Field-input")) {
				this._attachSenderValueHelp();
			} else if (this.getView().byId("ITM02::SenderCostObject::Field")){
				this.getView().byId("ITM02::SenderCostObject::Field").attachInnerControlsCreated(this._attachSenderValueHelp.bind(this));
			}
			// Receiver
			if (this.getView().byId("ITM03::ReceiverCostObject::Field-input")) {
				this._attachReceiverValueHelp();
			} else if (this.getView().byId("ITM03::ReceiverCostObject::Field")){
				this.getView().byId("ITM03::ReceiverCostObject::Field").attachInnerControlsCreated(this._attachReceiverValueHelp.bind(this));
			}
		},
		
		_propertyChange: function(oEvent){
			let sParameter = oEvent.getParameter('path');
			switch (sParameter) {
				case "ReceiverCompanyCode":
				case "ReceiverCostObject":
				case "SenderValuationApproach":
					this._refreshModelWithContext("ZCO_AOH_C_SEB_ITM");
					break;
				default: 
			}
		},
		
		_refreshModelWithContext: function(sContext){
			var oModel = this.getView().getModel();
			var oView = this.getView(); 
			// oView.setBusy(true);
			oModel.attachEventOnce("requestCompleted", function(oEvent){
				// oModel.attachEventOnce("requestCompleted", function(oEvent){
					// this._reworkValueHelps();
				// }.bind(this));
				oModel.refresh();
				// oView.setBusy(false);
			}.bind(this));
		},

		_valueHelpRequest: function (sControlId, sModelName, oControl, sSteeringAttribute, bForeginSystemCall, oDefaultValues,
			aDisabledFields) {
			this.getView().setBusy(true);
			let sCostObjType = this.getView().getBindingContext().getObject()[sSteeringAttribute];
			let sReturnField = "";
			let sEntityName = "";
			switch (sCostObjType) {
			case "CCTR":
				sReturnField = "CostCenter";
				sEntityName = (bForeginSystemCall) ? "ZCO_AOH_CC_RMT_VH" : "ZCO_AOH_CC_VH";
				break;
			case "WBSE":
				sReturnField = "WBSElement";
				sEntityName = (bForeginSystemCall) ? "ZCO_AOH_WBS_RMT_VH" : "ZCO_AOH_WBS_VH";
				break;
			case "IORD":
				sReturnField = "InternalOrder";
				sEntityName = (bForeginSystemCall) ? "ZCO_AOH_IO_RMT_VH" : "ZCO_AOH_IO_VH";
				break;
			case "NACT":
				sReturnField = "NetworkActivity";
				sEntityName = (bForeginSystemCall) ? "ZCO_AOH_NA_RMT_VH" : "ZCO_AOH_NA_VH";
				break;
			};

			var oValueHelp = new SmartValueHelp(oControl, {
				returnField: sReturnField
			}, {
				hideBasicSearch: true
			});
			var oModel = (sModelName) ? this.getOwnerComponent().getModel(sModelName) : this.getOwnerComponent().getModel();
			oValueHelp.init(this.getView().byId(sControlId), oModel,
				sEntityName, {}, oDefaultValues, aDisabledFields);
			this.getView().setBusy(false);
			oValueHelp.open();
		}
	});
});