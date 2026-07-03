import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stacked, Pie, Button, LineChart, SparkLine } from '../components';
import { GridComponent, ColumnsDirective, ColumnDirective, Resize, Sort, ContextMenu, Filter, Page, ExcelExport, PdfExport, Edit, Inject } from '@syncfusion/ej2-react-grids';
import { contextMenuItems } from '../data/dummy';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; 
const REST_API_URL = `${API_BASE_URL}/api/v1/acc`;

const Accounts = () => {
    const [accountsData, setAccountsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

    const { currentColor, currentMode } = useStateContext();

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };
    
    const handleAuthError = (error) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
            localStorage.removeItem('authToken');
            setError('Authentication required. Redirecting to login.');
            navigate('/login', { replace: true });
            return true;
        }
        return false;
    };

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    setError('No authentication token found. Please log in again.');
                    setLoading(false);
                    navigate('/login', { replace: true });
                    return;
                }

                const response = await axios.get(REST_API_URL, { headers });

                let data = response.data;
                if (data.data) data = data.data;
                
                if (Array.isArray(data)) {
                    setAccountsData(data);
                } else {
                    setError('Unexpected data format from server');
                }
                setLoading(false);
            } catch (error) {
                if (!handleAuthError(error)) {
                    setError('Failed to load accounts, please log out and log in again.');
                }
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    // Action Handlers
    const handleView = (rowData) => {
        setSelectedAccount(rowData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedAccount(null);
    };

    const handleDelete = async (rowData) => {
        if (window.confirm(`Are you sure you want to delete account: ${rowData.name}?`)) {
            try {
                const token = localStorage.getItem('authToken');
                
                await axios.delete(`${REST_API_URL}/?id=${rowData.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                setAccountsData(prevData => prevData.filter(account => account.id !== rowData.id));
                alert('Account deleted successfully');
            } catch (err) {
                console.error("Delete error:", err);
                alert(err.response?.data?.message || 'Failed to delete account');
            }
        }
    };

    const accountsGrid = [
        { field: 'id', headerText: 'ID', width: '60', textAlign: 'Center' },
        { field: 'nik', headerText: 'NIK', width: '150', textAlign: 'Center' },
        { field: 'name', headerText: 'Account Name', width: '200', textAlign: 'Left' },
        { field: 'accountNumber', headerText: 'Acc. Number', width: '100', textAlign: 'Center' },
        { field: 'email', headerText: 'Email', width: '200', textAlign: 'Center' },
        { 
            field: 'actions', 
            headerText: 'Actions', 
            width: '160', 
            textAlign: 'Center', 
            template: (props) => (
                <div className="flex justify-center space-x-2">
                    <button 
                        type="button"
                        style={{ backgroundColor: currentColor }}
                        className="text-white text-xs py-1 px-3 rounded-xl hover:opacity-80 transition duration-200"
                        onClick={() => handleView(props)}
                    >
                        View
                    </button>
                    <button 
                        type="button"
                        className="bg-red-600 text-white text-xs py-1 px-3 rounded-xl hover:bg-red-700 transition duration-200"
                        onClick={() => handleDelete(props)}
                    >
                        Delete
                    </button>
                </div>
            ) 
        }
    ];

    const editing = { allowDeleting: false, allowEditing: false };

    return (
        <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-3xl relative">
            <Header category="Accounts" title="All Accounts" />
            
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
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

            {/* --- VIEW MODAL --- */}
            {isModalOpen && selectedAccount && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-secondary-dark-bg w-11/12 md:w-1/2 p-6 rounded-2xl shadow-2xl border border-gray-100 transform transition-all scale-100">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                Account Details
                            </h3>
                            <button 
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-semibold"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Account ID</p>
                                <p className="font-medium mb-3">{selectedAccount.id || '-'}</p>
                                
                                <p className="text-xs text-gray-400 uppercase tracking-wider">NIK Number</p>
                                <p className="font-medium mb-3">{selectedAccount.nik || '-'}</p>

                                <p className="text-xs text-gray-400 uppercase tracking-wider">Full Name</p>
                                <p className="font-medium mb-3 capitalize">{selectedAccount.name || '-'}</p>

                                <p className="text-xs text-gray-400 uppercase tracking-wider">Account Number</p>
                                <p className="font-medium text-blue-600 mb-3">{selectedAccount.accountNumber || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Email Address</p>
                                <p className="font-medium mb-3">{selectedAccount.email || '-'}</p>

                                <p className="text-xs text-gray-400 uppercase tracking-wider">Phone Number</p>
                                <p className="font-medium mb-3">{selectedAccount.hp || '-'}</p>

                                <p className="text-xs text-gray-400 uppercase tracking-wider">Balance</p>
                                <p className="font-semibold text-green-600 mb-3 text-base">
                                    {selectedAccount.balance !== undefined 
                                        ? `Rp ${selectedAccount.balance.toLocaleString('id-ID')}` 
                                        : 'Rp 0'
                                    }
                                </p>

                                <p className="text-xs text-gray-400 uppercase tracking-wider">Address</p>
                                <p className="font-medium mb-3">{selectedAccount.address || '-'}</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end mt-6 border-t pt-3">
                            <button
                                type="button"
                                style={{ backgroundColor: currentColor }}
                                className="text-white px-5 py-2 rounded-xl text-sm hover:opacity-90 transition duration-200"
                                onClick={handleCloseModal}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default Accounts;