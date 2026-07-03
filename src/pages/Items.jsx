import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stacked, Pie, Button, LineChart, SparkLine } from '../components';
import { GridComponent, ColumnsDirective, ColumnDirective, Resize, Sort, ContextMenu, Filter, Page, ExcelExport, PdfExport, Edit, Inject } from '@syncfusion/ej2-react-grids';
import { contextMenuItems } from '../data/dummy';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { useNavigate } from 'react-router-dom';

const REST_API_URL = 'http://localhost:8081/api/v1/order/items';

const Items = () => {
    const [itemData, setItemData] = useState([]);
    const [searchId, setSearchId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
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

    // Fetch item on component mount
    useEffect(() => {
        const fetchItems = async () => {
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
                    setItemData(data);
                } else {
                    setError('Unexpected data format from server');
                }
                setLoading(false);
            } catch (error) {
                if (!handleAuthError(error)) {
                    setError('Failed to load items, please log out and log in again.');
                }
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    // Action Handlers
    const handleView = (rowData) => {
        setSelectedItem(rowData);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleOpenAddModal = () => {
        setFormData({
            code: '',
            name: '',
            qty: ''
        });
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setFormData({
            code: '',
            name: '',
            qty: ''
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
        setSearchId(e.target.value);
    };

    const handleSearchById = async () => {
        if (!searchId) {
            alert('Please enter a device ID to search');
            return;
        }

        const trimmedSearchId = searchId.trim();
        const localMatch = itemData.find((item) => String(item.id) === String(trimmedSearchId));
        if (localMatch) {
            setItemData([localMatch]);
            setError(null);
            return;
        }

        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before searching items.');
                setLoading(false);
                return;
            }

            let response;
            try {
                response = await axios.get(`${REST_API_URL}/?id=${encodeURIComponent(trimmedSearchId)}`, { headers });
            } catch (firstErr) {
                if (firstErr.response?.status === 404) {
                    response = await axios.get(`${REST_API_URL}/${encodeURIComponent(trimmedSearchId)}`, { headers });
                } else {
                    throw firstErr;
                }
            }

            let data = response.data;
            if (data.data) data = data.data;

            if (!data) {
                setItemData([]);
                alert('Item not found');
            } else if (Array.isArray(data)) {
                setItemData(data);
            } else {
                setItemData([data]);
            }
            setError(null);
            setLoading(false);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Search error:', err);
                alert(err.response?.data?.message || 'Failed to search item');
            }
            setLoading(false);
        }
    };

    const handleClearSearch = async () => {
        // reload all items
        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                setError('Please log in to load items.');
                setLoading(false);
                return;
            }
            const response = await axios.get(REST_API_URL, { headers });
                let data = response.data;
            if (data.data) data = data.data;
            if (Array.isArray(data)) setItemData(data);
            else setItemData([]);
            setSearchId('');
            setError(null);
            setLoading(false);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Reload items error:', err);
                setError('Failed to reload items');
            }
            setLoading(false);
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before adding an item.');
                return;
            }

            // Validate required fields
            if (!formData.itemName || !formData.itemType || !formData.manufacture) {
                alert('Please fill in all required fields (Item Name, Item Type, Manufacture)');
                return;
            }

            const response = await axios.post(REST_API_URL, formData, { headers });

            // Add new item to the list
            setItemData(prevData => [...prevData, response.data]);
            alert('Item added successfully');
            handleCloseAddModal();
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error("Add item error:", err);
                alert(err.response?.data?.message || 'Failed to add item');
            }
        }
    };

    const handleDelete = async (rowData) => {
        if (window.confirm(`Are you sure you want to delete item: ${rowData.name}?`)) {
            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    alert('Please log in before deleting an item.');
                    return;
                }

                await axios.delete(`${REST_API_URL}/?id=${rowData.id}`, { headers });

                setItemData(prevData => prevData.filter(item => item.id !== rowData.id));
                alert('Item deleted successfully');
            } catch (err) {
                if (!handleAuthError(err)) {
                    console.error("Delete error:", err);
                    alert(err.response?.data?.message || 'Failed to delete item');
                }
            }
        }
    };



    const itemsGrid = [
        { field: 'id', headerText: 'Item Code', width: '150', textAlign: 'Center' },
        { field: 'name', headerText: 'Name', width: '200', textAlign: 'Center' },
        // { field: 'description', headerText: 'Description', width: '150', textAlign: 'Center' },
        { field: 'stockQuantity', headerText: 'Quantity', width: '150', textAlign: 'Center' },
        // add currency formatting for price
        { 
          field: 'price', 
          headerText: 'Price', 
          width: '150', 
          textAlign: 'Center', 
          format: 'Rp#,##0',
        },
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
    const editing = { allowDeleting: false, allowEditing: false }

    return (
        <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-3xl relative">
            <div className="flex justify-between items-center mb-6">
                <Header category="Items" title="All Items" />
                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        placeholder="Search by ID"
                        value={searchId}
                        onChange={handleSearchInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                        type="button"
                        onClick={handleSearchById}
                        className="px-3 py-2 rounded-lg text-sm text-white"
                        style={{ backgroundColor: currentColor }}
                    >
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={handleClearSearch}
                        className="px-3 py-2 rounded-lg text-sm bg-gray-200 text-gray-800 hover:bg-gray-300"
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        style={{ backgroundColor: currentColor }}
                        className="text-white px-4 py-2 rounded-xl hover:opacity-80 transition duration-200 font-semibold text-sm"
                        onClick={handleOpenAddModal}
                    >
                        + Add Item
                    </button>
                </div>
            </div>
            
            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p>{error}</p>
                </div>
            )}
            
            {loading ? (
                <div className="flex justify-center items-center py-8">
                    <p className="text-gray-600">Loading items...</p>
                </div>
            ) : itemData.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                    <p className="text-gray-600">No items found</p>
                </div>
            ) : (
                <GridComponent
                    id="gridcomp"
                    dataSource={itemData}
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
                        {itemsGrid.map((item, index) => (
                            <ColumnDirective key={index} {...item} />
                        ))}
                    </ColumnsDirective>
                    <Inject services={[Resize, Sort, ContextMenu, Filter, Page, ExcelExport, Edit, PdfExport]} />
                </GridComponent>
            )}

            {/* --- VIEW MODAL --- */}
            {isModalOpen && selectedItem && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in" >
                    <div className="bg-white dark:bg-secondary-dark-bg w-11/12 md:w-1/2 p-6 rounded-2xl shadow-2xl border border-gray-100 transform transition-all scale-100 max-h-screen overflow-y-auto" >
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                Item Details
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
                        {/* title */}
                            <h3 className="text-sm font-semibold col-span-2 mb-2 text-gray-400 dark:text-gray-200" italic>Item Information</h3>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Item Code</p>
                                <p className="font-medium mb-3">{selectedItem.id || '-'}</p>

                                <p className="text-xs text-gray-400 uppercase tracking-wider">Item Name</p>
                                <p className="font-medium mb-3">{selectedItem.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Price</p>
                                <p className="font-medium mb-3">{selectedItem.price || '-'}</p>

                                <p className="text-xs text-gray-400 uppercase tracking-wider">Description</p>
                                <p className="font-medium mb-3">{selectedItem.description || '-'}</p>
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

            {/* --- ADD ITEM MODAL --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-secondary-dark-bg w-11/12 md:w-1/2 p-6 rounded-2xl shadow-2xl border border-gray-100 transform transition-all scale-100 max-h-screen overflow-y-auto">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                Add New Item
                            </h3>
                            <button 
                                onClick={handleCloseAddModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-semibold"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleAddItem}>
                            {/* Identity & Classification */}
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold mb-3 text-gray-400 dark:text-gray-200">Identity & Classification</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Item/Host Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="itemName"
                                            value={formData.itemName}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Item Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="itemType"
                                            value={formData.itemType}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select an item type</option>
                                            {itemTypes.map((type) => (
                                                <option key={type.id || type} value={type.name || type}>
                                                    {type.name || type}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Manufacture <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="manufacture"
                                            value={formData.manufacture}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Serial Number
                                        </label>
                                        <input
                                            type="text"
                                            name="serialNumber"
                                            value={formData.serialNumber}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Network and Connectivity */}
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold mb-3 text-gray-400 dark:text-gray-200">Network and Connectivity</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            IP Address
                                        </label>
                                        <input
                                            type="text"
                                            name="ipAddress"
                                            value={formData.ipAddress}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            MAC Address
                                        </label>
                                        <input
                                            type="text"
                                            name="macAddress"
                                            value={formData.macAddress}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Location and Assignment */}
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold mb-3 text-gray-400 dark:text-gray-200">Location and Assignment</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            User
                                        </label>
                                        <input
                                            type="text"
                                            name="user"
                                            value={formData.user}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Lifecycle and Asset Management */}
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold mb-3 text-gray-400 dark:text-gray-200">Lifecycle and Asset Management</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Purchase Date
                                        </label>
                                        <input
                                            type="date"
                                            name="purchaseDate"
                                            value={formData.purchaseDate}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Warranty Expiry
                                        </label>
                                        <input
                                            type="date"
                                            name="warrantyExpired"
                                            value={formData.warrantyExpired}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 mt-6 border-t pt-3">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-xl text-sm bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-400 transition duration-200"
                                    onClick={handleCloseAddModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ backgroundColor: currentColor }}
                                    className="px-5 py-2 rounded-xl text-sm text-white hover:opacity-90 transition duration-200"
                                >
                                    Add Item
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );



};
export default Items;