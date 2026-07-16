import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Stacked, Pie, Button, LineChart, SparkLine } from '../components';
import { GridComponent, ColumnsDirective, ColumnDirective, Resize, Sort, ContextMenu, Filter, Page, ExcelExport, PdfExport, Edit, Inject } from '@syncfusion/ej2-react-grids';
import { contextMenuItems } from '../data/dummy';
import { PiMagnifyingGlassPlusDuotone, PiPenDuotone, PiTrashDuotone, PiEraserDuotone} from "react-icons/pi";
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; 
const REST_API_URL = `${API_BASE_URL}/api/v1/emails`;

const Emails = () => {
    const [emailsData, setEmailsData] = useState([]);
    const [searchName, setSearchName] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentColor } = useStateContext();

    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        prefectName: '',
        email: '',
        passwd: ''
    });
    const [editFormData, setEditFormData] = useState({
        id: '',
        prefectName: '',
        email: '',
        passwd: ''
    });
    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        return{ 
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
    // Fetch emails on component mount
    useEffect(() => {
        const fetchEmails = async () => {
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
                    setEmailsData(data);
                } else {
                    setError('Unexpected data format from server');
                }
                setLoading(false);
            } catch (error) {
                if (!handleAuthError(error)) {
                    setError('Failed to load emails, please log out and log in again.');
                }
                setLoading(false);
            }
        };
        fetchEmails();
    }, []);
    // Action Handlers
    const createEmptyEmailForm = () => ({
        id: '',
        prefectName: '',
        email: '',
        passwd: ''
    });
    const mapEmailToFormData = (email = {}) => ({
        id: email.id || '',
        prefectName: email.prefectName || '',
        email: email.email || '',
        passw: email.passw || ''
    });
    const handleView = (rowData) => {
        setSelectedEmail(rowData);
        setFormData(mapEmailToFormData(rowData));
        setIsEditingEmail(false);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEmail(null);
        setIsEditingEmail(false);
    };
    const handleOpenAddModal = () => {
        setFormData(createEmptyEmailForm());
        setIsAddModalOpen(true);
    };
    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setFormData(createEmptyEmailForm());
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
    const handleEditEmail = () => {
        setEditFormData(mapEmailToFormData(selectedEmail));
        setIsEditingEmail(true);
    };
    const handleSaveEditedEmail = async (e) => {
        e.preventDefault();
        if (!selectedEmail?.id) return;

        try {
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before updating an email.');
                return;
            }

            if (!editFormData.prefectName || !editFormData.email || !editFormData.passw) {
                alert('Please fill in all required fields (Prefect Name, Email, Password)');
                return;
            }

            const response = await axios.put(`${REST_API_URL}/${encodeURIComponent(selectedEmail.id)}`, {
                ...editFormData,
                id: selectedEmail.id
            }, { headers });

            const updatedEmail = response.data?.data || response.data || { ...selectedEmail, ...editFormData, id: selectedEmail.id };
            setEmailsData(prevData => prevData.map(email => email.id === selectedEmail.id ? updatedEmail : email));
            setSelectedEmail(updatedEmail);
            setIsEditingEmail(false);
            setError(null);
            alert('Email updated successfully');
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Update email error:', err);
                alert(err.response?.data?.message || 'Failed to update email');
            }
        }
    };
    const handleSearchByName = async (e) => {
    // Prevent the browser from reloading the page on form submission
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        if (!searchName) {
            alert('Please enter an email address to search');
            return;
        }

        const trimmedSearchName = searchName.trim();
        const localMatch = emailsData.find((email) => String(email.email) === String(trimmedSearchName));
        if (localMatch) {
            setEmailsData([localMatch]);
            setError(null);
            return;
        }

        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before searching emails.');
                setLoading(false);
                return;
            }

            let response;
            try {
                response = await axios.get(`${REST_API_URL}/search?email=${encodeURIComponent(trimmedSearchName)}`, { headers });
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
                setEmailsData([]);
                alert('Email not found');
            } else if (Array.isArray(data)) {
                setEmailsData(data);
            } else {
                setEmailsData([data]);
            }
            setError(null);
            setLoading(false);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Search error:', err);
                alert(err.response?.data?.message || 'Failed to search email');
            }
            setLoading(false);
        }
    };
    // Search handlers
    const handleSearchInputChange = (e) => {
        setSearchName(e.target.value);
    };
    const handleClearSearch = async () => {
        // reload all emails
        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                setError('Please log in to load emails.');
                setLoading(false);
                return;
            }
            const response = await axios.get(REST_API_URL, { headers });

            let data = response.data;
            if (data.data) data = data.data;
            if (Array.isArray(data)) setEmailsData(data);
            else setEmailsData([]);
            setSearchName('');
            setError(null);
            setLoading(false);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Reload emails error:', err);
                setError('Failed to reload emails');
            }
            setLoading(false);
        }
    };
    // handleDelete function
    const handleDelete = async (rowData) => {
        // 1. Ask for confirmation before destroying data
        if (!window.confirm(`Are you sure you want to delete email "${rowData.email}"?`)) {
            return;
        }

        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before deleting emails.');
                setLoading(false);
                return;
            }
            await axios.delete(`${REST_API_URL}/${encodeURIComponent(rowData.id)}`, { headers });
            setEmailsData((prevEmails) => 
                prevEmails.filter((email) => email.id !== rowData.id)
            );
            alert(`Email "${rowData.email}" successfully deleted.`);
            setError(null);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Delete email error:', err);
                alert(err.response?.data?.message || 'Failed to delete email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };
    const emailsGrid = [
        { field: 'id', headerText: 'ID', width: '50', textAlign: 'Left' },
        { field: 'perfectName', headerText: 'Prefect Name', width: '150', textAlign: 'Left' },
        { field: 'email', headerText: 'Email Address', width: '150', textAlign: 'Left' },
        { field: 'passwd', headerText: 'Password', width: '150', textAlign: 'Center' },

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
                        title="Delete Email"
                        className="text-red-500 text-xl py-1 px-3 transition duration-200 font-semibold"
                        onClick={() => handleDelete(props)}
                    >
                        <PiTrashDuotone />
                    </button>
                </div>
            ) 
        }
    ];
    const editing = { allowDeleting: false, allowEditing: false };
    return (
        <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-xl relative">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <Header category="Emails" title="All Emails" />

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
                            placeholder="Search by email"
                            value={searchName}
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
                        title="Add Email"
                        type="button"
                        // className="w-full sm:w-auto text-green-500 px-3 py-2 rounded-xl text-xs bg-green-200 hover:bg-green-300 transition duration-200"
                        className="text-green-700 px-3 py-2 rounded-xl text-xs bg-green-200 hover:bg-green-300 transition duration-200"
                        onClick={handleOpenAddModal}
                    >
                        New Email
                        {/* {<PiPenDuotone />} */}
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
                    <p className="text-gray-600">Loading emails...</p>
                </div>
            ) : emailsData.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                    <p className="text-gray-600">No emails found</p>
                </div>
            ) : (
                <GridComponent
                    id="gridcomp"
                    dataSource={emailsData}
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
                        {emailsGrid.map((item, index) => (
                            <ColumnDirective key={index} {...item} />
                        ))}
                    </ColumnsDirective>
                    <Inject services={[Resize, Sort, ContextMenu, Filter, Page, ExcelExport, Edit, PdfExport]} />
                </GridComponent>
            )}

            {/* --- VIEW MODAL --- */}
            {isModalOpen && selectedEmail && (
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
                                Email Details
                            </h3>
                            <div className="flex items-center gap-2">
                                {!isEditingEmail && (
                                    <button
                                        type="button"
                                        title="Edit Email"
                                        onClick={handleEditEmail}
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

                        {isEditingEmail ? (
                            <form onSubmit={handleSaveEditedEmail} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Email Address <span className="text-red-500">*</span></label>
                                        <input type="email" name="emailAddress" value={editFormData.emailAddress} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
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
                                    <h3 className="text-sm font-semibold col-span-2 mb-2 text-gray-400 dark:text-gray-200">Email Information</h3>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">ID</p>
                                        <p className="font-medium mb-3">{selectedEmail.id || '-'}</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Email Address</p>
                                        <p className="font-medium mb-3">{selectedEmail.email || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Perfect Name</p>
                                        <p className="font-medium mb-3">{selectedEmail.perfectName || '-'}</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Password</p>
                                        <p className="font-medium mb-3">{selectedEmail.passwd || '-'}</p>
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
export default Emails;