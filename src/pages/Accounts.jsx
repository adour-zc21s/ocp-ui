import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GridComponent, ColumnsDirective, ColumnDirective, Resize, Sort, ContextMenu, Filter, Page, ExcelExport, PdfExport, Edit, Inject } from '@syncfusion/ej2-react-grids';
import { contextMenuItems } from '../data/dummy';
import { Header } from '../components';

const REST_API_URL = 'http://localhost:8081/api/acc/v1';

const Accounts = () => {
    const [accountsData, setAccountsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                // Get token from localStorage
                const token = localStorage.getItem('authToken');
                
                if (!token) {
                    setError('No authentication token found. Please log in again.');
                    setLoading(false);
                    return;
                }

                console.log('Fetching accounts from:', REST_API_URL);
                console.log('Token:', token.substring(0, 20) + '...');

                const response = await axios.get(REST_API_URL, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                console.log('Accounts response:', response.data);
                
                // Handle different response formats
                let data = response.data;
                if (data.data) {
                    data = data.data;
                }
                if (Array.isArray(data)) {
                    setAccountsData(data);
                } else {
                    console.warn('Unexpected data format:', data);
                    setError('Unexpected data format from server');
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error fetching accounts:', error);
                
                let errorMsg = 'Failed to load accounts';
                if (error.response?.status === 401) {
                    errorMsg = 'Unauthorized - Token may be expired. Please log in again.';
                } else if (error.response?.status === 403) {
                    errorMsg = 'Forbidden - You do not have permission to view accounts.';
                } else if (error.response?.status === 404) {
                    errorMsg = 'Accounts endpoint not found.';
                } else if (error.response?.data?.message) {
                    errorMsg = error.response.data.message;
                }
                
                setError(errorMsg);
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    const accountsGrid = [
        { field: 'id', headerText: 'ID', width: '120', textAlign: 'Center' },
        { field: 'name', headerText: 'Account Name', width: '150', textAlign: 'Center' },
        { field: 'accountNumber', headerText: 'Account Number', width: '150', textAlign: 'Center' },
        { field: 'email', headerText: 'Email', width: '200', textAlign: 'Center' },
        { field: 'hp', headerText: 'Phone', width: '150', textAlign: 'Center' },
    ];

    const editing = { allowDeleting: true, allowEditing: true };

    return (
        <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-3xl">
            <Header category="Accounts" title="All Accounts" />
            
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p className="font-semibold">Error Loading Accounts:</p>
                    <p>{error}</p>
                </div>
            )}
            
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <p className="text-gray-600">Loading accounts...</p>
                </div>
            ) : accountsData.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                    <p className="text-gray-600">No accounts found</p>
                </div>
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