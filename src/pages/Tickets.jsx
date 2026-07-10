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
const REST_API_URL = `${API_BASE_URL}/api/v1/tickets`;

const Tickets = () => {
    const [ticketData, setTicketData] = useState([]);
    const [searchId, setSearchId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditingTicket, setIsEditingTicket] = useState(false);
    // Form states for adding tickets
    const [formData, setFormData] = useState({
        departemen: '',
        priority: ''
    });

    const [editFormData, setEditFormData] = useState({
        departemen: '',
        priority: ''
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
    // Fetch tickets on component mount
    useEffect(() => {
        const fetchTickets = async () => {
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
                    setTicketData(data);
                } else {
                    setError('Unexpected data format from server');
                }
                setLoading(false);
            } catch (error) {
                if (!handleAuthError(error)) {
                    setError('Failed to load tickets, please log out and log in again.');
                }
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    // Action Handlers
    const createEmptyTicketForm = () => ({
        departemen: '',
        priority: ''
    });
    const mapTicketToFormData = (ticket = {}) => ({
        departemen: ticket.departemen || '',
        priority: ticket.priority || ''
    });    
    const handleView = (rowData) => {
        setSelectedTicket(rowData);
        setEditFormData(mapDeviceToFormData(rowData));
        setIsEditingDevice(false);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTicket(null);
        setIsEditingTicket(false);
    };
    const handleOpenAddModal = () => {
        setFormData(createEmptyTicketForm());
        setIsAddModalOpen(true);
    };
    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
        setFormData(createEmptyTicketForm());
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
    const handleEditTicket = () => {
        setEditFormData(mapTicketToFormData(selectedTicket));
        setIsEditingTicket(true);
    };
    const handleSaveEditedTicket = async (e) => {
        e.preventDefault();
        if (!selectedTicket?.id) return;

        try {
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before updating a ticket.');
                return;
            }

            if (!editFormData.departemen || !editFormData.priority) {
                alert('Please fill in all required fields (Department, Priority)');
                return;
            }

            const response = await axios.put(`${REST_API_URL}/${encodeURIComponent(selectedTicket.id)}`, {
                ...editFormData,
                id: selectedTicket.id
            }, { headers });

            const updatedTicket = response.data?.data || response.data || { ...selectedTicket, ...editFormData, id: selectedTicket.id };
            setTicketData(prevData => prevData.map(ticket => ticket.id === selectedTicket.id ? updatedTicket : ticket));
            setSelectedTicket(updatedTicket);
            setIsEditingTicket(false);
            setError(null);
            alert('Ticket updated successfully');
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Update ticket error:', err);
                alert(err.response?.data?.message || 'Failed to update ticket');
            }
        }
    };
    // Search handlers
    const handleSearchInputChange = (e) => {
        setSearchId(e.target.value);
    };
    const handleSearchByName = async () => {
        if (!searchId) {
            alert('Please enter a ticket name to search');
            return;
        }

        const trimmed = searchId.trim();
        // local-first: case-insensitive partial match
        const localMatches = ticketData.filter((ticket) =>
            String(ticket.ticketName || '').toLowerCase().includes(trimmed.toLowerCase())
        );
        if (localMatches && localMatches.length > 0) {
            setTicketData(localMatches);
            setError(null);
            return;
        }

        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before searching tickets.');
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
                setTicketData([]);
                alert('Ticket not found');
            } else if (Array.isArray(data)) {
                setTicketData(data);
            } else {
                setTicketData([data]);
            }
            setError(null);
            setLoading(false);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Search error:', err);
                alert(err.response?.data?.message || 'Failed to search ticket');
            }
            setLoading(false);
        }
    };
    const handleClearSearch = async () => {
        // reload all tickets
        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                setError('Please log in to load tickets.');
                setLoading(false);
                return;
            }
            const response = await axios.get(REST_API_URL, { headers });

            let data = response.data;
            if (data.data) data = data.data;
            if (Array.isArray(data)) setTicketData(data);
            else setTicketData([]);
            setSearchId('');
            setError(null);
            setLoading(false);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Reload tickets error:', err);
                setError('Failed to reload tickets');
            }
            setLoading(false);
        }
    };
    const handleAddTicket = async (e) => {
        e.preventDefault();
        try {
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before adding a ticket.');
                return;
            }

            // Validate required fields
            if (!formData.ticketName || !formData.ticketType || !formData.manufacture) {
                alert('Please fill in all required fields (Ticket Name, Ticket Type, Manufacture)');
                return;
            }

            const response = await axios.post(REST_API_URL, formData, { headers });

            // Add new ticket to the list
            setTicketData(prevData => [...prevData, response.data]);
            alert('Ticket added successfully');
            handleCloseAddModal();
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error("Add ticket error:", err);
                alert(err.response?.data?.message || 'Failed to add ticket');
            }
        }
    };
    const handleDelete = async (rowData) => {
        if (!window.confirm(`Are you sure you want to delete ticket: ${rowData.ticketName}?`)) {
            return;
        }
        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before deleting a ticket.');
                return;
            }

            await axios.delete(`${REST_API_URL}/${encodeURIComponent(rowData.id)}`, { headers });

            setTicketData(prevData => 
                prevData.filter(ticket => ticket.id !== rowData.id)
            );
            alert(`Ticket "${rowData.ticketName}" deleted successfully`);
            setError(null);
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error("Delete ticket error:", err);
                alert(err.response?.data?.message || 'Failed to delete ticket');
            }
        } finally {
            setLoading(false);
        }
    };
    const ticketsGrid = [
        { field: 'id', headerText: 'ID', width: '60', textAlign: 'Center'},
        { field: 'noTiket', headerText: 'Ticket No', width: '150', textAlign: 'Left'},
        { field: 'judul', headerText: 'Subject', width: '100', textAlign: 'Center'},
        { field: 'branch', headerText: 'Branch', width: '150', textAlign: 'Center'},
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
                        title="Delete Ticket"
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
                <Header category="Tickets" title="All Tickets" />
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
                            placeholder="Search by name"
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
                        title="Add Ticket"
                        type="button"
                        // className="w-full sm:w-auto text-green-500 px-3 py-2 rounded-xl text-xs bg-green-200 hover:bg-green-300 transition duration-200"
                        className="text-green-500 px-3 py-2 rounded-xl text-xs bg-green-200 hover:bg-green-300 transition duration-200"
                        onClick={handleOpenAddModal}
                    >
                        New Ticket
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
                    <p className="text-gray-600">Loading tickets...</p>
                </div>
            ) : ticketData.length === 0 ? (
                <div className="flex justify-center items-center py-8">
                    <p className="text-gray-600">No tickets found</p>
                </div>
            ) : (
                <GridComponent
                    id="gridcomp"
                    dataSource={ticketData}
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
                        {ticketsGrid.map((item, index) => (
                            <ColumnDirective key={index} {...item} />
                        ))}
                    </ColumnsDirective>
                    <Inject services={[Resize, Sort, ContextMenu, Filter, Page, ExcelExport, Edit, PdfExport]} />
                </GridComponent>
            )}
        </div>
    );
};
export default Tickets;