import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stacked, Pie, Button, LineChart, SparkLine } from '../components';
import { GridComponent, ColumnsDirective, ColumnDirective, Resize, Sort, ContextMenu, Filter, Page, ExcelExport, PdfExport, Edit, Inject } from '@syncfusion/ej2-react-grids';
import { contextMenuItems } from '../data/dummy';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; 
const REST_API_URL = `${API_BASE_URL}/api/v1/dev`;

const Devices = () => {
    const [deviceData, setDeviceData] = useState([]);
    const [deviceTypes, setDeviceTypes] = useState([]);
    const [searchId, setSearchId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Form states for adding device
    const [formData, setFormData] = useState({
        deviceName: '',
        deviceType: '',
        manufacture: '',
        serialNumber: '',
        ipAddress: '',
        macAddress: '',
        user: '',
        location: '',
        purchaseDate: '',
        warrantyExpired: ''
    });

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

    // Fetch devices on component mount
    useEffect(() => {
        const fetchDevices = async () => {
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
                    setDeviceData(data);
                } else {
                    setError('Unexpected data format from server');
                }
                setLoading(false);
            } catch (error) {
                if (!handleAuthError(error)) {
                    setError('Failed to load devices, please log out and log in again.');
                }
                setLoading(false);
            }
        };
        fetchDevices();
    }, []);

    // Fetch device types
    useEffect(() => {
        const fetchDeviceTypes = async () => {
            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    return;
                }

                const response = await axios.get(`${REST_API_URL}/types`, { headers });

                let data = response.data;
                if (data.data) data = data.data;
                
                if (Array.isArray(data)) {
                    setDeviceTypes(data);
                }
            } catch (error) {
                if (!handleAuthError(error)) {
                    console.error('Failed to load device types:', error);
                }
            }
        };
        fetchDeviceTypes();
    }, []);

    // Action Handlers
    const handleView = (rowData) => {
        setSelectedDevice(rowData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDevice(null);
    };

    const handleOpenAddModal = () => {
        setFormData({
            deviceName: '',
            deviceType: '',
            manufacture: '',
            serialNumber: '',
            ipAddress: '',
            macAddress: '',
            user: '',
            location: '',
            purchaseDate: '',
            warrantyExpired: ''
        });
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setFormData({
            deviceName: '',
            deviceType: '',
            manufacture: '',
            serialNumber: '',
            ipAddress: '',
            macAddress: '',
            user: '',
            location: '',
            purchaseDate: '',
            warrantyExpired: ''
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
        const localMatch = deviceData.find((device) => String(device.id) === String(trimmedSearchId));
        if (localMatch) {
            setDeviceData([localMatch]);
            setError(null);
            return;
        }

        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before searching devices.');
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
                setDeviceData([]);
                alert('Device not found');
            } else if (Array.isArray(data)) {
                setDeviceData(data);
            } else {
                setDeviceData([data]);
            }
            setError(null);
            setLoading(false);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Search error:', err);
                alert(err.response?.data?.message || 'Failed to search device');
            }
            setLoading(false);
        }
    };

    const handleClearSearch = async () => {
        // reload all devices
        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                setError('Please log in to load devices.');
                setLoading(false);
                return;
            }
            const response = await axios.get(REST_API_URL, { headers });

            let data = response.data;
            if (data.data) data = data.data;
            if (Array.isArray(data)) setDeviceData(data);
            else setDeviceData([]);
            setSearchId('');
            setError(null);
            setLoading(false);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Reload devices error:', err);
                setError('Failed to reload devices');
            }
            setLoading(false);
        }
    };

    const handleAddDevice = async (e) => {
        e.preventDefault();
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before adding a device.');
                return;
            }

            // Validate required fields
            if (!formData.deviceName || !formData.deviceType || !formData.manufacture) {
                alert('Please fill in all required fields (Device Name, Device Type, Manufacture)');
                return;
            }

            const response = await axios.post(REST_API_URL, formData, { headers });

            // Add new device to the list
            setDeviceData(prevData => [...prevData, response.data]);
            alert('Device added successfully');
            handleCloseAddModal();
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error("Add device error:", err);
                alert(err.response?.data?.message || 'Failed to add device');
            }
        }
    };

    const handleDelete = async (rowData) => {
        if (!window.confirm(`Are you sure you want to delete device: ${rowData.deviceName}?`)) {
            return;
        }
        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before deleting a device.');
                return;
            }

            await axios.delete(`${REST_API_URL}/${encodeURIComponent(rowData.id)}`, { headers });

            setDeviceData(prevData => 
                prevData.filter(device => device.id !== rowData.id)
            );
            alert(`Device "${rowData.deviceName}" deleted successfully`);
            setError(null);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error("Delete device error:", err);
                alert(err.response?.data?.message || 'Failed to delete device');
            }
        } finally {
            setLoading(false);
        }
    };

    const devicesGrid = [
        { field: 'id', headerText: 'ID', width: '60', textAlign: 'Center' },
        { field: 'deviceName', headerText: 'Device/Host Name', width: '150', textAlign: 'Left' },
        { field: 'deviceType', headerText: 'Device Type', width: '100', textAlign: 'Center' },
        { field: 'manufacture', headerText: 'Manufacture', width: '150', textAlign: 'Center' },
        { field: 'serialNumber', headerText: 'Serial Number', width: '150', textAlign: 'Center' },
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
            <div className="flex justify-between items-center mb-6">
                <Header category="Devices" title="All Devices" />
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
                        + Add Device
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
                    <p className="text-gray-600">Loading devices...</p>
                </div>
            ) : deviceData.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                    <p className="text-gray-600">No devices found</p>
                </div>
            ) : (
                <GridComponent
                    id="gridcomp"
                    dataSource={deviceData}
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
                        {devicesGrid.map((item, index) => (
                            <ColumnDirective key={index} {...item} />
                        ))}
                    </ColumnsDirective>
                    <Inject services={[Resize, Sort, ContextMenu, Filter, Page, ExcelExport, Edit, PdfExport]} />
                </GridComponent>
            )}

            {/* --- VIEW MODAL --- */}
            {isModalOpen && selectedDevice && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in" >
                    <div className="relative overflow-hidden bg-white dark:bg-secondary-dark-bg w-11/12 md:w-1/2 p-6 rounded-2xl shadow-2xl border border-gray-100 transform transition-all scale-100 max-h-screen overflow-y-auto">

                        {/* WATERMARK PLACED INSIDE THE BOX */}
                        {/* ADDED: z-0 */}
                        <img 
                            src="/images/watermark.png" 
                            alt="" 
                            aria-hidden="true" 
                            className="absolute inset-0 z-0 w-full h-full object-contain opacity-10 pointer-events-none select-none" 
                        />
                        
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
                        {/* title */}
                            <h3 className="text-sm font-semibold col-span-2 mb-2 text-gray-400 dark:text-gray-200">Identity & Classification</h3>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Device ID</p>
                                <p className="font-medium mb-3">{selectedDevice.id || '-'}</p>

                                <p className="text-xs text-gray-400 uppercase tracking-wider">Device/Host Name</p>
                                <p className="font-medium mb-3">{selectedDevice.deviceName || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Manufacture</p>
                                <p className="font-medium mb-3">{selectedDevice.manufacture || '-'}</p>

                                <p className="text-xs text-gray-400 uppercase tracking-wider">Device Type</p>
                                <p className="font-medium mb-3">{selectedDevice.deviceType || '-'}</p>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                        {/* title */}
                            <h3 className="text-sm font-semibold col-span-2 mb-2 text-gray-400 dark:text-gray-200">Network and Connectivity</h3>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">IP Address</p>
                                <p className="font-medium mb-3">{selectedDevice.ipAddress || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">MAC Address</p>
                                <p className="font-medium mb-3">{selectedDevice.macAddress || '-'}</p>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                        {/* title */}
                            <h3 className="text-sm font-semibold col-span-2 mb-2 text-gray-400 dark:text-gray-200">Location and assignment</h3>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">User</p>
                                <p className="font-medium mb-3">{selectedDevice.user || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Location</p>
                                <p className="font-medium mb-3">{selectedDevice.location || '-'}</p>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                        {/* title */}
                            <h3 className="text-sm font-semibold col-span-2 mb-2 text-gray-400 dark:text-gray-200">Lifecycle and asset management</h3>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Purchase Date</p>
                                <p className="font-medium mb-3">{selectedDevice.purchaseDate || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">Warranty Expiry</p>
                                <p className="font-medium mb-3">{selectedDevice.warrantyExpired || '-'}</p>
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

            {/* --- ADD DEVICE MODAL --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-secondary-dark-bg w-11/12 md:w-1/2 p-6 rounded-2xl shadow-2xl border border-gray-100 transform transition-all scale-100 max-h-screen overflow-y-auto">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                Add New Device
                            </h3>
                            <button 
                                onClick={handleCloseAddModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-semibold"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleAddDevice}>
                            {/* Identity & Classification */}
                            <div className="mb-4">
                                <h4 className="text-sm font-semibold mb-3 text-gray-400 dark:text-gray-200">Identity & Classification</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Device/Host Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="deviceName"
                                            value={formData.deviceName}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            autocomplete="off"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Device Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="deviceType"
                                            value={formData.deviceType}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select a device type</option>
                                            {deviceTypes.map((type) => (
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
                                            autocomplete="off"
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
                                            autocomplete="off"
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
                                            autocomplete="off"
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
                                            autocomplete="off"
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
                                            autocomplete="off"
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
                                            autocomplete="off"
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
                                    Add Device
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Devices;