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
      currentFilter: this.applyFilterTypes[0].key
    };
    this.dataGrid = null;
    this.orderHeaderFilter = this.orderHeaderFilter.bind(this);
    this.onShowFilterRowChanged = this.onShowFilterRowChanged.bind(this);
    this.onShowHeaderFilterChanged = this.onShowHeaderFilterChanged.bind(this);
    this.onCurrentFilterChanged = this.onCurrentFilterChanged.bind(this);
  }
  render() {
    return (
      <div>
        <DataGrid
          id="gridContainer"
          ref={(ref) => (this.dataGrid = ref)}
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
            cellTemplate={this.myCellTemplate}
          />
          <Column
            dataField="CustomerStoreCity"
            caption="City"
            calculateFilterExpression={this.calculateFilterExpression2}
            cellTemplate={this.myCellTemplate}
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

  myCellTemplate(cellElement, cellInfo) {
    const text = cellInfo.text,
      search = cellInfo.component.option("searchPanel.text");

    console.log(text, "txt");
    if (search.length) {
      const filters = search.split(" ").filter((n) => n !== "");
      console.log(filters, "filters");
      const searchStrings = filters
        .map((filter) => {
          return [
            text.toLowerCase().indexOf(filter.toLowerCase()),
            filter.length
          ];
        })
        .filter((str) => {
          return str[0] >= 0;
        })
        .sort((str) => {
          return str[0];
        });
      console.log(searchStrings, "searchStrings");
      if (!searchStrings.length) {
        cellElement.append(text);
      } else {
        const span = '<span class="dx-datagrid-search-text">';
        const highlights = [];

        searchStrings.forEach((str, index) => {
          if (index === 0) {
            highlights.push(text.slice(0, str[0]));
          }

          highlights.push(span);
          highlights.push(text.slice(str[0], str[0] + str[1]));
          highlights.push("</span>");

          if (index === searchStrings.length - 1) {
            highlights.push(text.slice(str[0] + str[1]));
          } else {
            highlights.push(text.slice(str[1], searchStrings[index + 1][0]));
          }
        });

        var html = highlights.join("");
        cellElement.innerHTML = html;
      }
    } else {
      cellElement.append(text);
    }
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
