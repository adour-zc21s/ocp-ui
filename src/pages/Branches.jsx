import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stacked, Pie, Button, LineChart, SparkLine } from '../components';
import { GridComponent, ColumnsDirective, ColumnDirective, Resize, Sort, ContextMenu, Filter, Page, ExcelExport, PdfExport, Edit, Inject } from '@syncfusion/ej2-react-grids';
import { contextMenuItems } from '../data/dummy';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { useNavigate } from 'react-router-dom';

const REST_API_URL = 'http://localhost:8081/api/v1/branches';

const Branches = () => {
    const [brancheData, setBrancheData] = useState([]);
    const [searchName, setSearchName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBranche, setSelectedBranche ] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const { currentColor, currentMode } = useStateContext();
    const navigate = useNavigate();

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
        const fetchBranches = async () => {
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
                    setBrancheData(data);
                } else {
                    setError('Unexpected data format from server');
                }
                setLoading(false);
            } catch (error) {
                if (!handleAuthError(error)) {
                    setError('Failed to load branches, please log out and log in again.');
                }
                setLoading(false);
            }
        };
        fetchBranches();
    }, []);

    // Action Handlers
    const handleView = (rowData) => {
        setSelectedBranche(rowData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedBranche(null);
    };

    const handleOpenAddModal = () => {
        setFormData({
            branchName: '',
            code: ''
        });
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setFormData({
            branchName: '',
            code: ''
        });
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Search handlers
    const handleSearchInputChange = (e) => {
        setSearchName(e.target.value);
    };

    const handleSearchByName = async (e) => {
    // Prevent the browser from reloading the page on form submission
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        if (!searchName) {
            alert('Please enter a branch name to search');
            return;
        }

        const trimmedSearchName = searchName.trim();
        const localMatch = brancheData.find((branch) => String(branch.name) === String(trimmedSearchName));
        if (localMatch) {
            setBrancheData([localMatch]);
            setError(null);
            return;
        }

        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before searching branches.');
                setLoading(false);
                return;
            }

            let response;
            try {
                response = await axios.get(`${REST_API_URL}/search?letter=${encodeURIComponent(trimmedSearchName)}`, { headers });
            } catch (firstErr) {
                if (firstErr.response?.status === 404) {
                    response = await axios.get(`${REST_API_URL}/${encodeURIComponent(trimmedSearchName)}`, { headers });
                } else {
                    throw firstErr;
                }
            }

            let data = response.data;
            if (data.data) data = data.data;

            if (!data) {
                setBrancheData([]);
                alert('Branch not found');
            } else if (Array.isArray(data)) {
                setBrancheData(data);
            } else {
                setBrancheData([data]);
            }
            setError(null);
            setLoading(false);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Search error:', err);
                alert(err.response?.data?.message || 'Failed to search branch');
            }
            setLoading(false);
        }
    };

    const handleClearSearch = async () => {
        // reload all branches
        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                setError('Please log in to load branches.');
                setLoading(false);
                return;
            }
            const response = await axios.get(REST_API_URL, { headers });

            let data = response.data;
            if (data.data) data = data.data;
            if (Array.isArray(data)) setBrancheData(data);
            else setBrancheData([]);
            setSearchName('');
            setError(null);
            setLoading(false);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Reload branches error:', err);
                setError('Failed to reload branches');
            }
            setLoading(false);
        }
    };

    const branchesGrid = [
        { field: 'id', headerText: 'ID', width: '60', textAlign: 'Center' },
        { field: 'code', headerText: 'Dealer Code', width: '150', textAlign: 'Left' },
        { field: 'name', headerText: 'Branch Name', width: '150', textAlign: 'Left' },
        { field: 'namaPt', headerText: 'PT', width: '150', textAlign: 'Center' },

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

    return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-3xl relative">
        <div className="flex justify-between items-center mb-6">
            <Header category="Branches" title="All Branche" />
            
            {/* CHANGED: Wrapped search input and actions in a form element */}
            <form onSubmit={handleSearchByName} className="flex items-center space-x-3">
                <input
                    type="text"
                    placeholder="Search by name"
                    value={searchName}
                    onChange={handleSearchInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                    type="submit"
                    className="px-3 py-2 rounded-lg text-sm text-white"
                    style={{ backgroundColor: currentColor }}
                >
                    Search
                </button>
                <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-3 py-2 rounded-lg text-sm text-white bg-gray-500 hover:bg-gray-600 transition duration-200"
                >
                    Clear
                </button>
                <button
                    type="button"
                    style={{ backgroundColor: currentColor }}
                    className="text-white px-4 py-2 rounded-xl hover:opacity-80 transition duration-200 font-semibold text-sm"
                    onClick={handleOpenAddModal}
                >
                    + Add Branch
                </button>
            </form>
        </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <p className="text-gray-600">Loading branches...</p>
                </div>
            ) : brancheData.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <p className="text-gray-600">No branches found.</p>
                </div>
            ) : (
                <GridComponent
                    id="gridcomp"
                    dataSource={brancheData}
                    width="auto"
                    allowPaging
                    allowSorting
                    allowExcelExport
                    allowPdfExport
                    contextMenuItems={contextMenuItems}
                    // editSettings={editing}
                    pageSettings={{ pageSize: 5 }}
                >
                    <ColumnsDirective>
                        {branchesGrid.map((item, index) => (
                            <ColumnDirective key={index} {...item} />
                        ))}
                    </ColumnsDirective>
                </GridComponent>
            )}

            {/* --- VIEW MODAL --- */}
            {isModalOpen && selectedBranche && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">

                    {/* White Modal Container Box */}
                    {/* ADDED: relative, overflow-hidden */}
                    <div className="relative overflow-hidden bg-white dark:bg-secondary-dark-bg w-11/12 md:w-1/2 p-6 rounded-2xl shadow-2xl border border-gray-100 transform transition-all scale-100 max-h-screen overflow-y-auto">

                        {/* WATERMARK PLACED INSIDE THE BOX */}
                        {/* ADDED: z-0 */}
                        <img 
                            src="/images/watermark.png" 
                            alt="" 
                            aria-hidden="true" 
                            className="absolute inset-0 z-0 w-full h-full object-contain opacity-10 pointer-events-none select-none" 
                        />

                        {/* ALL CONTENT INSIDE THE BOX WRAPPED IN A HIGHER Z-INDEX */}
                        {/* ADDED: relative, z-10 */}
                        <div className="relative z-10">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center border-b pb-3 mb-4">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                    Device Details
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
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Dealer Code</p>
                                    <p className="font-medium mb-3">{selectedBranche.code || '-'} - {selectedBranche.namaPt || '-'}</p>
                                    <p className="font-medium mb-3">{selectedBranche.address || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Branch Name</p>
                                    <p className="font-medium mb-3">{selectedBranche.name || '-'}</p>
            
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">NPWP</p>
                                    <p className="font-medium">{selectedBranche.npwp || '-'}</p>
                                </div>
                            </div>
            
                            <div className="border-t my-4"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Email affiliate</p>
                                    <p className="font-medium mb-3">{selectedBranche.emailDigunakan || '-'}</p>
            
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">Description</p>
                                    <p className="font-medium mb-3">{selectedBranche.description || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">ISP 1</p>
                                    <p className="font-medium mb-3">{selectedBranche.namaIsp1 || '-'} - {selectedBranche.noIsp1 || '-'}</p>
            
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">ISP 2</p>
                                    <p className="font-medium mb-3">{selectedBranche.namaIsp2 || '-'} - {selectedBranche.noIsp2 || '-'}</p>
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
                        </div> {/* End of z-10 wrap */}
            
                    </div>
                </div>
            )}

        </div>
    );   


};
export default Branches;
