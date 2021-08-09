import React from "react";
import DataGrid, {
  Column,
  FilterRow,
  HeaderFilter,
  SearchPanel
} from "devextreme-react/data-grid";
import SelectBox from "devextreme-react/select-box";
import CheckBox from "devextreme-react/check-box";

import service from "./data.js";
import { string } from "prop-types";

const saleAmountEditorOptions = { format: "currency", showClearButton: true };

class App extends React.Component {
  constructor(props) {
    super(props);
    this.orders = service.getOrders();
    this.applyFilterTypes = [
      {
        key: "auto",
        name: "Immediately"
      },
      {
        key: "onClick",
        name: "On Button Click"
      }
    ];
    this.saleAmountHeaderFilter = [
      {
        text: "Less than $3000",
        value: ["SaleAmount", "<", 3000]
      },
      {
        text: "$3000 - $5000",
        value: [
          ["SaleAmount", ">=", 3000],
          ["SaleAmount", "<", 5000]
        ]
      },
      {
        text: "$5000 - $10000",
        value: [
          ["SaleAmount", ">=", 5000],
          ["SaleAmount", "<", 10000]
        ]
      },
      {
        text: "$10000 - $20000",
        value: [
          ["SaleAmount", ">=", 10000],
          ["SaleAmount", "<", 20000]
        ]
      },
      {
        text: "Greater than $20000",
        value: ["SaleAmount", ">=", 20000]
      }
    ];
    this.state = {
      showFilterRow: true,
      showHeaderFilter: true,
      currentFilter: this.applyFilterTypes[0].key,
      searchPanelText: ""
    };
    this.dataGrid = null;
    this.orderHeaderFilter = this.orderHeaderFilter.bind(this);
    this.onShowFilterRowChanged = this.onShowFilterRowChanged.bind(this);
    this.onShowHeaderFilterChanged = this.onShowHeaderFilterChanged.bind(this);
    this.onCurrentFilterChanged = this.onCurrentFilterChanged.bind(this);
    this.myCellTemplate = this.myCellTemplate.bind(this);
    this.optionsChanged = this.optionsChanged.bind(this);
  }
  render() {
    return (
      <div>
        <DataGrid
          id="gridContainer"
          ref={(ref) => (this.dataGrid = ref)}
          onOptionChanged={this.optionsChanged}
          dataSource={this.orders}
          keyExpr="ID"
          showBorders={true}
        >
          <FilterRow
            visible={this.state.showFilterRow}
            applyFilter={this.state.currentFilter}
          />
          <HeaderFilter visible={this.state.showHeaderFilter} />
          <SearchPanel visible={true} width={240} placeholder="Search..." />
          <Column dataField="OrderNumber" width={140} caption="Invoice Number">
            <HeaderFilter groupInterval={10000} />
          </Column>
          <Column
            dataField="OrderDate"
            alignment="right"
            dataType="date"
            width={120}
            calculateFilterExpression={this.calculateFilterExpression}
          >
            <HeaderFilter dataSource={this.orderHeaderFilter} />
          </Column>
          <Column
            dataField="DeliveryDate"
            alignment="right"
            dataType="datetime"
            format="M/d/yyyy, HH:mm"
            width={180}
          />
          <Column
            dataField="SaleAmount"
            alignment="right"
            dataType="number"
            format="currency"
            editorOptions={saleAmountEditorOptions}
          >
            <HeaderFilter dataSource={this.saleAmountHeaderFilter} />
          </Column>
          <Column
            dataField="Employee"
            calculateFilterExpression={this.calculateFilterExpression2}
            cellRender={this.myCellTemplate}
          />
          <Column
            dataField="CustomerStoreCity"
            caption="City"
            calculateFilterExpression={this.calculateFilterExpression2}
            cellRender={this.myCellTemplate}
          >
            <HeaderFilter allowSearch={true} />
          </Column>
        </DataGrid>
        <div className="options">
          <div className="caption">Options</div>
          <div className="option">
            <span>Apply Filter </span>
            <SelectBox
              items={this.applyFilterTypes}
              value={this.state.currentFilter}
              onValueChanged={this.onCurrentFilterChanged}
              valueExpr="key"
              displayExpr="name"
              disabled={!this.state.showFilterRow}
            />
          </div>
          <div className="option">
            <CheckBox
              text="Filter Row"
              value={this.state.showFilterRow}
              onValueChanged={this.onShowFilterRowChanged}
            />
          </div>
          <div className="option">
            <CheckBox
              text="Header Filter"
              value={this.state.showHeaderFilter}
              onValueChanged={this.onShowHeaderFilterChanged}
            />
          </div>
        </div>
      </div>
    );
  }
  calculateFilterExpression(value, selectedFilterOperations, target) {
    let column = this;
    if (target === "headerFilter" && value === "weekends") {
      return [[getOrderDay, "=", 0], "or", [getOrderDay, "=", 6]];
    }
    return column.defaultCalculateFilterExpression.apply(this, arguments);
  }

  myCellTemplate(cellData) {
    console.log(cellData);
    const query = this.state.searchPanelText.trim();
    if (query.length === 0) return cellData.value;
    const regExpText = "(".concat(
      query
        .replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&")
        .split(" ")
        .join(")|(")
        .concat(")")
    );
    const regExp = new RegExp(regExpText, "ig");
    const matches = cellData.value.match(regExp)
      ? cellData.value.match(regExp).filter((el) => el !== undefined)
      : [];
    return (
      <div>
        {cellData.value
          .split(regExp)
          .filter((el) => el !== undefined && el != null)
          .map((el, index) => {
            if (el === matches[0]) {
              matches.shift();
              return (
                <span key={index} className="dx-datagrid-search-text">
                  {el}
                </span>
              );
            } else return el;
          })}
      </div>
    );
  }

  calculateFilterExpression2(filtervalue, selectedFilterOperations, target) {
    const getRowText = (row) => {
      return Object.values(row).join(" ");
    };
    if (target !== "search") return;
    const filters = filtervalue.split(" ").filter((n) => n !== "");
    if (filters.length === 1) {
      return [getRowText, "contains", filters[0]];
    }
    const result = [];
    filters.forEach((filter) => {
      result.push([getRowText, "contains", filter]);
      result.push("or");
    });
    result.pop();
    return result;
  }

  optionsChanged(options) {
    if (
      options.name === "searchPanel" &&
      options.fullName === "searchPanel.text"
    ) {
      this.setState({
        searchPanelText: options.value
      });
    }
  }

  orderHeaderFilter(data) {
    data.dataSource.postProcess = (results) => {
      results.push({
        text: "Weekends",
        value: "weekends"
      });
      return results;
    };
  }
  onShowFilterRowChanged(e) {
    this.setState({
      showFilterRow: e.value
    });
    this.clearFilter();
  }
  onShowHeaderFilterChanged(e) {
    this.setState({
      showHeaderFilter: e.value
    });
    this.clearFilter();
  }
  onCurrentFilterChanged(e) {
    this.setState({
      currentFilter: e.value
    });
  }
  clearFilter() {
    this.dataGrid.instance.clearFilter();
  }
}

function getOrderDay(rowData) {
  return new Date(rowData.OrderDate).getDay();
}

export default App;
