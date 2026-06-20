import React from 'react';
import { GridComponent, ColumnsDirective, ColumnDirective, Resize, Sort, ContextMenu, Filter, Page, ExcelExport, PdfExport, Edit, Inject } from '@syncfusion/ej2-react-grids';
import { accountsData, contextMenuItems, accountsGrid } from '../data/dummy';
import { Header } from '../components';

const Accounts = () => {
    return (
        <div>
            <Header category="Accounts" title="All Accounts" />
        </div>
    );
};
export default Accounts;