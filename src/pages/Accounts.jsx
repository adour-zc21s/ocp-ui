import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GridComponent, ColumnsDirective, ColumnDirective, Resize, Sort, ContextMenu, Filter, Page, ExcelExport, PdfExport, Edit, Inject } from '@syncfusion/ej2-react-grids';
import { contextMenuItems } from '../data/dummy';
import { Header } from '../components';

const REST_API_URL = 'http://localhost:8081/api/acc/v1';

const Accounts = () => {
    const [accountsData, setAccountsData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await axios.get(REST_API_URL);
                setAccountsData(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching accounts:', error);
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    const accountsGrid = [
        { field: 'id', headerText: 'Account ID', width: '120', textAlign: 'Center' },
        { field: 'name', headerText: 'Account Name', width: '150', textAlign: 'Center' },
        { field: 'email', headerText: 'Email', width: '200', textAlign: 'Center' },
        { field: 'phone', headerText: 'Phone', width: '150', textAlign: 'Center' },
        { field: 'status', headerText: 'Status', width: '120', textAlign: 'Center' },
    ];

    const editing = { allowDeleting: true, allowEditing: true };

    return (
        <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-3xl">
            <Header category="Accounts" title="All Accounts" />
            {loading ? (
                <p>Loading accounts...</p>
            ) : (
                <GridComponent
                    id="gridcomp"
                    dataSource={accountsData}
                    width="auto"
                    allowPaging
                    allowSorting
                    allowExcelExport
                    allowPdfExport
                    contextMenuItems={contextMenuItems}
                    editSettings={editing}
                    pageSettings={{ pageCount: 5 }}
                >
                    <ColumnsDirective>
                        {accountsGrid.map((item, index) => (
                            <ColumnDirective key={index} {...item} />
                        ))}
                    </ColumnsDirective>
                    <Inject services={[Resize, Sort, ContextMenu, Filter, Page, ExcelExport, Edit, PdfExport]} />
                </GridComponent>
            )}
        </div>
    );
};
export default Accounts;