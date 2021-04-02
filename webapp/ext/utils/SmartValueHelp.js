sap.ui.define(["sap/ui/base/Object",
		"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
		"sap/ui/comp/filterbar/FilterGroupItem",
		"sap/m/SearchField",
		"sap/ui/comp/filterbar/FilterBar",
		"sap/ui/core/format/DateFormat",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/comp/odata/MetadataAnalyser"
	],

	function (UI5Object, ValueHelpDialog, FilterGroupItem, SearchField, FilterBar, DateFormat, Filter, FilterOperator, MetadataAnalyser) {

		"use strict";

		var oSmartValueHelper = UI5Object.extend("ZCO_PAPM_SEB_Upload.ZCO_PAPM_SEB_Upload.utils.SmartValueHelp", {

			_oControl: null,
			_oServiceMetadata: null,
			_oModel: null,
			_sEntityType: null,
			_addTypeSuffix: true,
			_oValueHelpDialog: null,
			_oValueHelpConfig: null,
			_oFilterBarConfig: null,
			_oColumnModel: null,
			_oFilterBar: null,

			constructor: function (oControl, oValueHelpConfig, oFilterBarConfig) {
				this._oControl = oControl;

				this._oValueHelpConfig = {
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					stretch: sap.ui.Device.system.phone,
					returnField: ""
				};
				if (oValueHelpConfig) {
					$.extend(this._oValueHelpConfig, oValueHelpConfig);
					//Object.assign(this._oValueHelpConfig, oValueHelpConfig);	
				}
				this._oFilterBarConfig = {
					advancedMode: true,
					filterBarExpanded: true,
					showGoOnFB: !sap.ui.Device.system.phone,
					hideBasicSearch: false
				};
				if (oFilterBarConfig) {
					$.extend(this._oFilterBarConfig, oFilterBarConfig);
					//Object.assign(this._oFilterBarConfig, oFilterBarConfig);	
				}
			}

		});

		oSmartValueHelper.prototype._setModel = function (oModel) {
			this._oModel = oModel;
			if (oModel) {
				this._setServiceMetadata(oModel.getServiceMetadata());
			}
		};

		oSmartValueHelper.prototype._setServiceMetadata = function (oServiceMetadata) {
			this._oServiceMetadata = oServiceMetadata;
		};

		oSmartValueHelper.prototype._setEntityType = function (sEntityType) {
			this._sEntityType = sEntityType;
		};

		oSmartValueHelper.prototype._getEntityType = function () {
			var aEntityTypeArray = this._oServiceMetadata.dataServices.schema[0].entityType;
			var afilteredEntityArray = $.grep(aEntityTypeArray, function (element, index) {
				var sEntityType = this._addTypeSuffix ? this._sEntityType.toLowerCase() + "type" : this._sEntityType.toLowerCase();
				return element.name.toLowerCase() === sEntityType;
			}.bind(this));

			if (afilteredEntityArray && afilteredEntityArray.length === 1) {
				return afilteredEntityArray[0];
			}
			return false;
		};

		oSmartValueHelper.prototype._getProperties = function (oEntity) {
			if (!oEntity) {
				oEntity = this._getEntityType();
			}
			return oEntity.property;
		};

		oSmartValueHelper.prototype._getColumns = function (oEntity) {
			if (!oEntity) {
				oEntity = this._getEntityType();
			}
			var aProperties = this._getProperties();
			var aColumns = [];

			//this._oMetadataAnalyser = new MetadataAnalyser(this._oModel); 
			//this._oLineItemAnnotation = this._oMetadataAnalyser.getLineItemAnnotation(this._getEntityType().namespace+"."+this._getEntityType().name, null);

			if (aProperties) {
				for (var j = 0; j < aProperties.length; j++) {
					if (this._oValueHelpConfig.columns) {
						var bFound = false;
						var z = 0;
						while (!bFound && (z < this._oValueHelpConfig.columns.length)) {
							bFound = this._oValueHelpConfig.columns[z] === aProperties[j].name;
							z++;
						}
						if (bFound) {
							aColumns.push({
								label: this._getExtensionLabel(aProperties[j].extensions),
								template: aProperties[j].name
							});
						}
					} else {
						aColumns.push({
							label: this._getExtensionLabel(aProperties[j].extensions),
							template: aProperties[j].name
						});
					}
				}
			}

			return aColumns;
		};

		oSmartValueHelper.prototype._getFilterGroupItems = function () {
			var aProperties = this._getProperties();
			var aFilterGroupItems = [];
			for (var i = 0; i < aProperties.length; i++) {
				aFilterGroupItems.push(
					new FilterGroupItem({
						groupTitle: "t1",
						groupName: "g1",
						name: aProperties[i].name,
						label: this._getExtensionLabel(aProperties[i].extensions),
						control: new sap.m.Input({
							id: "VH_" + aProperties[i].name
						})
					})
				);
			}
			return aFilterGroupItems;
		};

		oSmartValueHelper.prototype._getExtensionLabel = function (aExtension) {
			var aPropertyLabel = $.grep(aExtension, function (element, index) {
				return element.name.toLowerCase() === "label";
			}.bind(this));

			if (aPropertyLabel && aPropertyLabel.length === 1) {
				return aPropertyLabel[0].value;
			}
			return "";
		};

		oSmartValueHelper.prototype._getTitle = function (oEntity) {
			if (!oEntity) {
				oEntity = this._getEntityType();
			}
			return this._getExtensionLabel(oEntity.extensions);
		};

		/**
		 * Binds the table taking current filters and parameters into account
		 * @private
		 */
		/*
		oSmartValueHelper.prototype._rebindTable = function() {
			var aFilters, mParameters, mBindingParams, oTable, aEntitySetFields, oSorter;
			aFilters = this._oFilterBar.getFilters();
			mParameters = this._oFilterBar.getParameters() || {};
			if (this.aSelect && this.aSelect.length) {
				mParameters["select"] = this.aSelect.toString();
			}
	
			// Check first if property can be sorted
			if (this.sKey && this._oMetadataAnalyser) {
				aEntitySetFields = this._oMetadataAnalyser.getFieldsByEntitySetName(this.sValueListEntitySetName);
				for (var i = 0; i < aEntitySetFields.length; i++) {
					if (aEntitySetFields[i].name === this.sKey && aEntitySetFields[i].sortable !== false) {
						oSorter = new sap.ui.model.Sorter(this.sKey);
						break;
					}
				}
			}
	
			mBindingParams = {
				path: "/" + this.sValueListEntitySetName,
				filters: aFilters,
				parameters: mParameters,
				sorter: oSorter,
				events: {
					dataReceived: function(oEvt) {
						this.oValueHelpDialog.TableStateDataFilled();
						oTable.setBusy(false);
						var oBinding = oEvt.getSource(), iBindingLength;
						if (oBinding && this.oValueHelpDialog && this.oValueHelpDialog.isOpen()) {
							iBindingLength = oBinding.getLength();
							// Infinite number of requests are triggered if an error occurs, so don't update if no data is present
							// The below code is mainly required for token handling on the ValueHelpDialog.
							if (iBindingLength) {
								this.oValueHelpDialog.update();
							}
						}
					}.bind(this)
				}
			};
	
			oTable = this.oValueHelpDialog.getTable();
			oTable.setShowOverlay(false);
			this.oValueHelpDialog.TableStateDataSearching();
			oTable.setBusy(true);
			if (oTable instanceof sap.m.Table) {
				mBindingParams.factory = function(sId, oContext) {
					var aCols = oTable.getModel("columns").getData().cols;
					return new sap.m.ColumnListItem({
						cells: aCols.map(function(column) {
							var colname = column.template;
							return new sap.m.Label({
								text: "{" + colname + "}"
							});
						})
					});
				};
				oTable.bindItems(mBindingParams);
			} else {
				oTable.bindRows(mBindingParams);
			}
		};
		*/

		oSmartValueHelper.prototype._rebindTable = function () {
			var aFilters = [];
			aFilters = this._oFilterBar.getFilters();
			if (this._oValueHelpConfig.addCustomFilters) {
				for (var i = 0; i < this._oValueHelpConfig.addCustomFilters.length; i++) {
					aFilters.push(this._oValueHelpConfig.addCustomFilters[i]);
				}
			}
			/*
			var aFilterItems = this._oFilterBar.getAllFilterItems();
			
			for (var i = 0; i < aFilterItems.length; i++){
				var oControl = this._oFilterBar.determineControlByFilterItem(aFilterItems[i]);
				if (oControl) {
					if (oControl.getValue().trim().length > 0){
						aFilters.push(new Filter(oControl.getId().split("_")[1], FilterOperator.Contains, oControl.getValue()));		
					}
				}
			}
			*/

			//var oParams = {};
			var oParams = this._oFilterBar.getParameters() || {};

			if (this._oFilterBar.getSearchEnabled() && this._oFilterBar.getBasicSearchValue().trim().length > 0) {
				oParams.custom = {
					search: this._oFilterBar.getBasicSearchValue().trim()
				};
			}

			var aBindingParams = {
				path: "/" + this._sEntityType,
				parameters: oParams,
				filters: aFilters,
				events: {
					dataReceived: function (oEvt) {
						this._oValueHelpDialog.TableStateDataFilled();
						this._oValueHelpDialog.getTable().setBusy(false);
						var oBinding = oEvt.getSource(),
							iBindingLength;
						if (oBinding && this._oValueHelpDialog && this._oValueHelpDialog.isOpen()) {
							iBindingLength = oBinding.getLength();
							// Infinite number of requests are triggered if an error occurs, so don't update if no data is present
							// The below code is mainly required for token handling on the ValueHelpDialog.
							if (iBindingLength) {
								this._oValueHelpDialog.update();
							}
						}
					}.bind(this)
				}
			};

			var oTable = this._oValueHelpDialog.getTable();
			oTable.setShowOverlay(false);
			this._oValueHelpDialog.TableStateDataSearching();
			oTable.setBusy(true);
			if (oTable instanceof sap.m.Table) {
				aBindingParams.factory = function (sId, oContext) {
					var aCols = oTable.getModel("columns").getData().cols;
					return new sap.m.ColumnListItem({
						cells: aCols.map(function (column) {
							var colname = column.template;
							return new sap.m.Label({
								text: "{" + colname + "}"
							});
						})
					});
				};
				oTable.bindItems(aBindingParams);
			} else {
				oTable.bindRows(aBindingParams);
			}
		};

		oSmartValueHelper.prototype._onSearch = function () {
			this._rebindTable();
		};

		oSmartValueHelper.prototype._onOkPressed = function (oControlEvent) {
			var aTokens = oControlEvent.getParameter("tokens"),
				oRangeData, sKey, i = 0,
				aRowData = [],
				oRowData = null,
				oFormat;
			// First close the dialog, since when used in an aggregation - some model updates (setting IN/OUT params to ODataModel) destroy this
			// instance/control!
			this._closeValueHelpDialog();
			if (this._oControl instanceof sap.m.MultiInput) {
				// Clearing typed text if value is not selected from suggestion list but rather from ValueHelpDialog
				this._oControl.setValue("");
				this._oControl.setTokens(aTokens);
				i = aTokens.length;
				while (i--) {
					oRowData = aTokens[i].data("row");
					if (oRowData) {
						aRowData.push(oRowData);
					}
				}
			} else {
				if (aTokens[0]) {
					// Single Interval
					if (this.bIsSingleIntervalRange) {
						oRangeData = aTokens[0].data("range");
						if (oRangeData) {
							// check if data is in the format: "2005-2014"
							if (this._sType === "datetime") {
								oFormat = DateFormat.getDateTimeInstance(jQuery.extend({}, this._oDateFormatSettings, {
									UTC: false
								}));

								if (typeof oRangeData.value1 === "string") {
									oRangeData.value1 = new Date(oRangeData.value1);
								}
								if (oRangeData.operation === "BT") {
									if (typeof oRangeData.value2 === "string") {
										oRangeData.value2 = new Date(oRangeData.value2);
									}
									sKey = oFormat.format(oRangeData.value1) + "-" + oFormat.format(oRangeData.value2);
								} else {
									sKey = oFormat.format(oRangeData.value1);
								}
							} else {
								if (oRangeData.operation === "BT") {
									sKey = oRangeData.value1 + "-" + oRangeData.value2;
								} else {
									sKey = oRangeData.value1;
								}
							}
						}
					} else {
						sKey = aTokens[0].data().row[this._oValueHelpConfig.returnField];
					}
					oRowData = aTokens[0].data("row");
					if (oRowData) {
						aRowData.push(oRowData);
					}
				}
				this._oControl.setValue(sKey);

				// Manually trigger the change event on sapUI5 control since it doesn't do this internally on setValue!
				this._oControl.fireChange({
					value: sKey,
					validated: true
				});
			}
		};

		oSmartValueHelper.prototype._hideBasicSearch = function (bHide) {
			var sBasicSearchId = this._oFilterBar.getBasicSearch();
			if (sBasicSearchId) {
				sap.ui.getCore().byId(sBasicSearchId).setVisible(!bHide);
			}
		};

		oSmartValueHelper.prototype._onFilterBarResetPressed = function () {

		};

		oSmartValueHelper.prototype._onFilterBarFilterChange = function () {

		};

		oSmartValueHelper.prototype._setDefaultValues = function (oDefaultValues) {
			this._oDefaultValues = oDefaultValues;
		};

		oSmartValueHelper.prototype._setDisabledFields = function (aDisabledFields) {
			this._aDisabledFields = aDisabledFields;
		};

		oSmartValueHelper.prototype._onFilterBarInitialise = function () {
			var b = null;
			this._onFilterBarResetPressed();
			if (this._oFilterBar && this._oFilterBar.getBasicSearchControl) {
				b = this._oFilterBar.getBasicSearchControl();
				if (b) {
					//b.setValue(this.sBasicSearchText);
					if (sap.ui.Device.system.phone && b instanceof sap.m.SearchField) {
						b.setShowSearchButton(true);
					}
				}
			}

			// Set default values 
			if (Object.keys(this._oDefaultValues).length !== 0) {
				this._oFilterBar.setFilterData(this._oDefaultValues);
			}

			// Set disabled fields 
			this._aDisabledFields.forEach(function (sField) {
				let aItems = this._oFilterBar.getFilterGroupItems();
				for (let i = 0; i < aItems.length; i++) {
					// Check the match between sField and bindnig field
					let oItem = aItems[i];
					if (oItem.getControl() &&
						oItem.getControl().getBindingInfo("value") &&
						oItem.getControl().getBindingInfo("value").parts) {
						let sPath = oItem.getControl().getBindingInfo("value").parts[0].path;
						let aParts = sPath.split("/");
						if (sField === aParts[1]) {
							oItem.getControl().setEnabled(false);
							break;
						}
					}
				}
			}.bind(this))
		};

		oSmartValueHelper.prototype._createFilterBar = function () {
			/*
			 this._oFilterBar = new FilterBar({
			    advancedMode: this._oFilterBarConfig.advancedMode,
			    filterBarExpanded: this._oFilterBarConfig.filterBarExpanded,
			    showGoOnFB: this._oFilterBarConfig.showGoOnFB,
			    filterGroupItems: this._getFilterGroupItems(),
			    search: function() {
					this._onSearch();
			    }.bind(this)
			 });
			 */
			this._oFilterBar = new sap.ui.comp.smartfilterbar.SmartFilterBar(this._oValueHelpDialog.getId() + "-smartFilterBar", {
				entitySet: this._sEntityType,
				basicSearchFieldName: "",
				//enableBasicSearch: true,
				enableBasicSearch: this._oFilterBarConfig.hideBasicSearch,
				advancedMode: true,
				considerSelectionVariants: true,
				useProvidedNavigationProperties: true,
				showGoOnFB: true,
				expandAdvancedArea: true,
				search: this._onSearch.bind(this),
				reset: this._onFilterBarResetPressed.bind(this),
				filterChange: this._onFilterBarFilterChange.bind(this),
				initialise: this._onFilterBarInitialise.bind(this)
			});

			if (this._oFilterBar.setBasicSearch) {
				this._oFilterBar.setBasicSearch(new SearchField({
					showSearchButton: sap.ui.Device.system.phone,
					placeholder: "Search",
					search: function (event) {
						this._oValueHelpDialog.getFilterBar().search();
					}.bind(this)
				}));
			}
			this._oFilterBar.isRunningInValueHelpDialog = true;
			this._oValueHelpDialog.setModel(this._oModel);
			this._oValueHelpDialog.setFilterBar(this._oFilterBar);

			//this._hideBasicSearch(this._oFilterBarConfig.hideBasicSearch);
		};

		oSmartValueHelper.prototype._closeValueHelpDialog = function () {
			this._oValueHelpDialog.close();
		};

		oSmartValueHelper.prototype._destroyValueHelpDialog = function () {
			this._oValueHelpDialog.destroy();
		};

		oSmartValueHelper.prototype.init = function (oControl, oModel, sEntityType, oConfig, oDefaultValues, aDisabledFields) {

			// Set private variables.
			this._setDefaultValues(oDefaultValues);
			this._setDisabledFields(aDisabledFields);
			this._setModel(oModel);
			this._setEntityType(sEntityType);

			// Get entity type
			var oEntity = this._getEntityType();

			// Create the internal value help.
			this._oValueHelpDialog = new ValueHelpDialog({
				title: this._getTitle(oEntity),
				supportMultiselect: this._oValueHelpConfig.supportMultiselect,
				supportRanges: this._oValueHelpConfig.supportRanges,
				supportRangesOnly: this._oValueHelpConfig.supportRangesOnly,
				stretch: this._oValueHelpConfig.stretch,
				ok: function (oControlEvent) {
					this._onOkPressed(oControlEvent);
					this._closeValueHelpDialog();
				}.bind(this),
				cancel: function (oControlEvent) {
					this._closeValueHelpDialog();
				}.bind(this),
				afterClose: function () {
					this._destroyValueHelpDialog();
				}.bind(this)
			});

			// Set Model.
			this._oValueHelpDialog.getTable().setModel(this._oModel);

			// Bind Rows.
			// this._oValueHelpDialog.getTable().bindRows("/"+this._sEntityType);

			// Get Columns
			this._oColumnModel = new sap.ui.model.json.JSONModel();
			this._oColumnModel.setData({
				cols: this._getColumns()
			});

			// Set columns into value help table.
			this._oValueHelpDialog.getTable().setModel(this._oColumnModel, "columns");

			// Create filter bar
			this._createFilterBar();

		};

		oSmartValueHelper.prototype.open = function (oControl, oModel, sEntityType) {
			this._oValueHelpDialog.open();
		};

	 	return oSmartValueHelper;
	}, /* bExport= */ true);