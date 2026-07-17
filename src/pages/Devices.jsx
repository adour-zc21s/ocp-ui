import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stacked, Pie, Button, LineChart, SparkLine } from '../components';
import { GridComponent, ColumnsDirective, ColumnDirective, Resize, Sort, ContextMenu, Filter, Page, ExcelExport, PdfExport, Edit, Inject } from '@syncfusion/ej2-react-grids';
import { contextMenuItems } from '../data/dummy';
import { PiMagnifyingGlassPlusDuotone, PiPenDuotone, PiTrashDuotone, PiEraserDuotone, PiMicrosoftExcelLogoDuotone} from "react-icons/pi";
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

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
    const [isEditingDevice, setIsEditingDevice] = useState(false);
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

    const [editFormData, setEditFormData] = useState({
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
    const createEmptyDeviceForm = () => ({
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

    const mapDeviceToFormData = (device = {}) => ({
        deviceName: device.deviceName || '',
        deviceType: device.deviceType || '',
        manufacture: device.manufacture || '',
        serialNumber: device.serialNumber || '',
        ipAddress: device.ipAddress || '',
        macAddress: device.macAddress || '',
        user: device.user || '',
        location: device.location || '',
        purchaseDate: device.purchaseDate || '',
        warrantyExpired: device.warrantyExpired || ''
    });

    const handleView = (rowData) => {
        setSelectedDevice(rowData);
        setEditFormData(mapDeviceToFormData(rowData));
        setIsEditingDevice(false);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDevice(null);
        setIsEditingDevice(false);
    };

    const handleOpenAddModal = () => {
        setFormData(createEmptyDeviceForm());
        setIsAddModalOpen(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setFormData(createEmptyDeviceForm());
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleEditDevice = () => {
        setEditFormData(mapDeviceToFormData(selectedDevice));
        setIsEditingDevice(true);
    };

    const handleSaveEditedDevice = async (e) => {
        e.preventDefault();
        if (!selectedDevice?.id) return;

        try {
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before updating a device.');
                return;
            }

            if (!editFormData.deviceName || !editFormData.deviceType || !editFormData.manufacture) {
                alert('Please fill in all required fields (Device Name, Device Type, Manufacture)');
                return;
            }

            const response = await axios.put(`${REST_API_URL}/${encodeURIComponent(selectedDevice.id)}`, {
                ...editFormData,
                id: selectedDevice.id
            }, { headers });

            const updatedDevice = response.data?.data || response.data || { ...selectedDevice, ...editFormData, id: selectedDevice.id };
            setDeviceData(prevData => prevData.map(device => device.id === selectedDevice.id ? updatedDevice : device));
            setSelectedDevice(updatedDevice);
            setIsEditingDevice(false);
            setError(null);
            alert('Device updated successfully');
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Update device error:', err);
                alert(err.response?.data?.message || 'Failed to update device');
            }
        }
    };
    // Search handlers
    const handleSearchInputChange = (e) => {
        setSearchId(e.target.value);
    };

    const handleSearchByName = async () => {
        if (!searchId) {
            alert('Please enter a device/host name to search');
            return;
        }

        const trimmed = searchId.trim();
        // local-first: case-insensitive partial match
        const localMatches = deviceData.filter((device) =>
            String(device.deviceName || '').toLowerCase().includes(trimmed.toLowerCase())
        );
        if (localMatches && localMatches.length > 0) {
            setDeviceData(localMatches);
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
                response = await axios.get(`${REST_API_URL}/?name=${encodeURIComponent(trimmed)}`, { headers });
            } catch (firstErr) {
                if (firstErr.response?.status === 404) {
                    try {
                        response = await axios.get(`${REST_API_URL}/?q=${encodeURIComponent(trimmed)}`, { headers });
                    } catch (secondErr) {
                        if (secondErr.response?.status === 404) {
                            response = await axios.get(`${REST_API_URL}/name/${encodeURIComponent(trimmed)}`, { headers });
                        } else {
                            throw secondErr;
                        }
                    }
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
        { field: 'id', headerText: 'ID', width: '60', textAlign: 'Center'},
        { field: 'deviceName', headerText: 'Device/Host Name', width: '150', textAlign: 'Left'},
        { field: 'user', headerText: 'User', width: '100', textAlign: 'Center'},
        { field: 'ipAddress', headerText: 'IP Address', width: '150', textAlign: 'Center'},
        { 
            field: 'actions', 
            headerText: 'Actions', 
            width: '160', 
            textAlign: 'Center', 
            template: (props) => (
                <div className="flex justify-center space-x-2">
                    <button 
                        type="button"
                        className="text-blue-500 text-xl py-1 px-2 transition duration-200 font-bold"
                        onClick={() => handleView(props)}
                    >
                        {<PiMagnifyingGlassPlusDuotone />}
                    </button>
                    <button 
                        type="button"
                        title="Delete Device"
                        className="text-red-500 text-xl py-1 px-3 transition duration-200 font-semibold"
                        onClick={() => handleDelete(props)}
                    >
                        <PiTrashDuotone />
                    </button>
                </div>
            ) 
        }
    ];
    // Sample data to export xlsx
    const handleExportXlsx = () => {
      // Map and transform the data to include ONLY your specific fields and custom headers
      const dataToExport = deviceData.map(item => ({
        'ID': item.id,
        'Device/Host Name': item.deviceName,
        'User': item.user
      }));

      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Convert the transformed JSON data into a worksheet
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      // Append the worksheet to the workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, "Devices");

      // Download the file
      XLSX.writeFile(workbook, "Device_List.xlsx");
    };

    const editing = { allowDeleting: false, allowEditing: false };

    return (
        <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-xl relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <Header category="Devices" title="All Device" />
                {/* flex-wrap ensures components wrap line-by-line if they run out of space */}
                <div className="flex flex-wrap items-center gap-2">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSearchByName();
                        }}
                        className="flex flex-wrap items-center gap-2"
                    >
                        <input
                            type="text"
                            placeholder="Search device name"
                            value={searchId}
                            onChange={handleSearchInputChange}
                            className="flex-1 sm:flex-initial px-2 py-2 border border-gray-300 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                        />
                    </form>
                    <button
                        title="Clear Search"
                        type="button"
                        onClick={handleClearSearch}
                        className="px-2 py-2 text-xl text-red-500 font-bold text-center rounded-xl bg-red-100 hover:bg-red-200 transition duration-200"
                    >
                        <PiEraserDuotone />
                    </button>
                    <button
                        title="Add Device"
                        type="button"
                        // className="w-full sm:w-auto text-green-500 px-3 py-2 rounded-xl text-xs bg-green-200 hover:bg-green-300 transition duration-200"
                        className="text-green-700 px-3 py-2 rounded-xl text-xs bg-green-200 hover:bg-green-300 transition duration-200"
                        onClick={handleOpenAddModal}
                    >
                        New Branch
                        {/* {<PiPenDuotone />} */}
                    </button>
                    <button 
                      onClick={handleExportXlsx}
                      title="Export to Excel"
                      type="button"
                      className="text-green-700 px-3 py-2 rounded-xl text-xs bg-green-200 hover:bg-green-300 transition duration-200"
                    >
                      <PiMicrosoftExcelLogoDuotone />
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
                    <div className="relative overflow-hidden bg-white dark:bg-secondary-dark-bg w-11/12 max-w-3xl md:w-2/5 xl:w-[36rem] p-6 rounded-2xl shadow-2xl border border-gray-100 transform transition-all scale-100 max-h-[85vh] overflow-y-auto">

                        {/* WATERMARK PLACED INSIDE THE BOX */}
                        {/* ADDED: z-0 */}
                        <img 
                            src="/images/watermark.png" 
                            alt="" 
                            aria-hidden="true" 
                            className="absolute inset-0 z-0 w-full h-full object-contain opacity-20 pointer-events-none select-none" 
                        />
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                Device Details
                            </h3>
                            <div className="flex items-center gap-2">
                                {!isEditingDevice && (
                                    <button
                                        type="button"
                                        title="Edit Device"
                                        onClick={handleEditDevice}
                                        className="px-3 py-2 rounded-lg text-sm text-blue-400 hover:text-blue-600 transition duration-200"
                                    >
                                        Edit
                                    </button>
                                )}
                                {/* <button 
                                    onClick={handleCloseModal}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-semibold"
                                >
                                    &times;
                                </button> */}
                            </div>
                        </div>

                        {isEditingDevice ? (
                            <form onSubmit={handleSaveEditedDevice} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Device/Host Name <span className="text-red-500">*</span></label>
                                        <input type="text" name="deviceName" value={editFormData.deviceName} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Device Type <span className="text-red-500">*</span></label>
                                        <select name="deviceType" value={editFormData.deviceType} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                                            <option value="">Select a device type</option>
                                            {deviceTypes.map((type) => (
                                                <option key={type.id || type} value={type.name || type}>{type.name || type}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Manufacture <span className="text-red-500">*</span></label>
                                        <input type="text" name="manufacture" value={editFormData.manufacture} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Serial Number</label>
                                        <input type="text" name="serialNumber" value={editFormData.serialNumber} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">IP Address</label>
                                        <input type="text" name="ipAddress" value={editFormData.ipAddress} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">MAC Address</label>
                                        <input type="text" name="macAddress" value={editFormData.macAddress} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">User</label>
                                        <input type="text" name="user" value={editFormData.user} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Location</label>
                                        <input type="text" name="location" value={editFormData.location} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Purchase Date</label>
                                        <input type="date" name="purchaseDate" value={editFormData.purchaseDate} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Warranty Expiry</label>
                                        <input type="date" name="warrantyExpired" value={editFormData.warrantyExpired} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6 border-t pt-3">
                                    <button 
                                        type="button" 
                                        className="px-4 py-2 rounded-xl text-sm bg-red-300 text-gray-800 hover:bg-red-400 transition duration-200" onClick={() => setIsEditingDevice(false)}>
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-5 py-2 rounded-xl text-sm text-dark bg-blue-300 hover:bg-blue-400 transition duration-200">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                                    <h3 className="text-sm font-semibold col-span-2 mb-2 text-gray-400 dark:text-gray-200">Identity & Classification</h3>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Device ID</p>
                                        <p className="font-medium mb-3">{selectedDevice.id || '-'}</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Device/Host Name</p>
                                        <p className="font-medium mb-3">{selectedDevice.deviceName || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Password</p>
                                        <p className="font-medium mb-3">{selectedDevice.password || '-'}</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Password Portal</p>
                                        <p className="font-medium mb-3">{selectedDevice.passwordPortal || '-'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
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

                                <div className="flex justify-end mt-6 border-t pt-3">
                                    <button
                                        type="button"
                                        title="Close"
                                        className="text-white bg-red-300 hover:bg-red-400 px-5 py-2 rounded-xl text-sm hover:opacity-90 transition duration-200"
                                        onClick={handleCloseModal}
                                    >
                                        Close
                                    </button>
                                </div>
                            </>
                        )}

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
                                            autoComplete="off"
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
                                            autoComplete="off"
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
                                            autoComplete="off"
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
                                            autoComplete="off"
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
                                            autoComplete="off"
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
                                            autoComplete="off"
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
                                            autoComplete="off"
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