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
    const [departments, setDepartments] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [branches, setBranches] = useState([]);
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
        judul: '',
        departemen: '',
        emailNotification: '',
        branch: '',
        priority: ''
    });

    const [editFormData, setEditFormData] = useState({
        departemen: '',
        priority: ''
    });
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
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

    // Fetch department
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    return;
                }

                const response = await axios.get(`${REST_API_URL}/departments`, { headers });

                let data = response.data;
                if (data.data) data = data.data;
                
                if (Array.isArray(data)) {
                    setDepartments(data);
                }
            } catch (error) {
                if (!handleAuthError(error)) {
                    console.error('Failed to load departments:', error);
                }
            }
        };
        fetchDepartments();
    }, []);

    // Fetch branches
    useEffect(() => {
        const fetchBranches = async () => {
            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    return;
                }

                const response = await axios.get(`${REST_API_URL}/branches`, { headers });

                let data = response.data;
                if (data.data) data = data.data;
                
                if (Array.isArray(data)) {
                    setBranches(data);
                }
            } catch (error) {
                if (!handleAuthError(error)) {
                    console.error('Failed to load branches:', error);
                }
            }
        };
        fetchBranches();
    }, []);

    // fetch accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const headers = getAuthHeaders();
                if (!headers) {
                    return;
                }
                const response = await axios.get(`${REST_API_URL}/accounts`, { headers });
                let data = response.data;
                if (data.data) data = data.data;
                if (Array.isArray(data)) {
                    setAccounts(data);
                }
            } catch (error) {
                if (!handleAuthError(error)) {
                    console.error('Failed to load accounts:', error);
                }
            }
        };
        fetchAccounts();
    }, []);

    // Action Handlers
    const createEmptyTicketForm = () => ({
        noTiket: '',
        judul: '',
        departemen: '',
        emailNotification: '',
        branch: '',
        priority: ''
    });
    const mapTicketToFormData = (ticket = {}) => ({
        noTiket: ticket.noTiket || '',
        judul: ticket.judul || '',
        departemen: ticket.departemen || '',
        emailNotification: ticket.account ||'',
        priority: ticket.priority || ''
    });    
    const fetchComments = async (ticketId) => {
        try {
            setIsCommentsLoading(true);
            const headers = getAuthHeaders();
            if (!headers) {
                return;
            }
            const response = await axios.get(`${REST_API_URL}/${encodeURIComponent(ticketId)}/comments`, { headers });
            let data = response.data;
            if (data.data) data = data.data;
            if (Array.isArray(data)) {
                setComments(data);
            } else if (data) {
                setComments([data]);
            } else {
                setComments([]);
            }
        } catch (error) {
            if (!handleAuthError(error)) {
                console.error('Fetch comments error:', error);
            }
        } finally {
            setIsCommentsLoading(false);
        }
    };
    const handleView = (rowData) => {
        setSelectedTicket(rowData);
        setEditFormData(mapTicketToFormData(rowData));
        setIsEditingTicket(false);
        setIsModalOpen(true);
        fetchComments(rowData.id);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTicket(null);
        setIsEditingTicket(false);
        setComments([]);
        setCommentText('');
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
            if (!formData.judul || !formData.departemen || !formData.emailNotification) {
                alert('Please fill in all required fields (Ticket Judul, Departemen, Account)');
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
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) {
            alert('Please enter a comment');
            return;
        }
        if (!selectedTicket?.id) return;

        try {
            const headers = getAuthHeaders();
            if (!headers) {
                alert('Please log in before adding a comment.');
                return;
            }

            const response = await axios.post(
                `${REST_API_URL}/${encodeURIComponent(selectedTicket.id)}/comments`,
                { comment: commentText.trim() },
                { headers }
            );

            const newComment = response.data?.data || response.data || { comment: commentText.trim(), createdAt: new Date().toISOString() };
            setComments(prevComments => [newComment, ...prevComments]);
            setCommentText('');
            alert('Comment added successfully');
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Add comment error:', err);
                alert(err.response?.data?.message || 'Failed to add comment');
            }
        }
    };
    const handleDelete = async (rowData) => {
        if (!window.confirm(`Are you sure you want to delete ticket: ${rowData.noTiket}?`)) {
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
            alert(`Ticket "${rowData.noTiket}" deleted successfully`);
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
    const TicketTemplate = (props) => {
      return (
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{props.noTiket}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{props.judul}</div>
        </div>
      );
    };
    const ticketsGrid = [
        { field: 'id', headerText: 'ID', width: '30', textAlign: 'Center'},
        { field: 'ticketDetails', 
            headerText: 'Ticket No / Subject', 
            width: '250', 
            textAlign: 'Left',
            template: TicketTemplate
        },
        { field: 'dibuatOleh', headerText: 'Created By', width: '100', textAlign: 'Center'},
        { field: 'departemen', headerText: 'Department', width: '100', textAlign: 'Center'},
        { 
            field: 'status', 
            headerText: 'Status', 
            width: '90', 
            textAlign: 'Center',
            template: (props) => {
                const isOpen = props.status === 'Open';
                return (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                        isOpen 
                            ? 'bg-green-100 text-green-500' 
                            : 'bg-red-100 text-red-500'
                    }`}>
                        {props.status}
                    </span>
                );
            }
        },
        { field: 'createdAt', headerText: 'Created At', width: '100', textAlign: 'Center'},
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
                        <PiMagnifyingGlassPlusDuotone />
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
                        className="text-green-700 px-3 py-2 rounded-xl text-xs bg-green-200 hover:bg-green-300 transition duration-200"
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
            {/* --- VIEW MODAL --- */}
            {isModalOpen && selectedTicket && (
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
                                Ticket Details
                            </h3>
                            <div className="flex items-center gap-2">
                                {!isEditingTicket && (
                                    <button
                                        type="button"
                                        title="Edit Ticket"
                                        onClick={handleEditTicket}
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

                        {isEditingTicket ? (
                            <form onSubmit={handleSaveEditedTicket} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Ticket ID <span className="text-red-500">*</span></label>
                                        <input type="text" name="ticketId" value={editFormData.ticketId} onChange={handleEditFormChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6 border-t pt-3">
                                    <button 
                                        type="button" 
                                        className="px-4 py-2 rounded-xl text-sm bg-red-300 text-gray-800 hover:bg-red-400 transition duration-200" onClick={() => setIsEditingTicket(false)}>
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
                                    {/* <h3 className="text-sm font-semibold col-span-2 mb-2 text-gray-400 dark:text-gray-200">Identity & Classification</h3> */}
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Ticket Number</p>
                                        <p className="font-medium mb-3">{selectedTicket.noTiket || '-'}</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Judul</p>
                                        <p className="font-medium mb-3">{selectedTicket.judul || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Branch</p>
                                        <p className="font-medium mb-3">{selectedTicket.branch || '-'}</p>
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Departemen</p>
                                        <p className="font-medium mb-3">{selectedTicket.departemen || '-'}</p>
                                    </div>
                                    {/* Description */}
                                    <div className="col-span-1 md:col-span-2">
                                        <p className="text-xs text-gray-400 uppercase tracking-wider">Description</p>
                                        <p className="font-medium mb-3">{selectedTicket.deskripsi || '-'}</p>
                                    </div>

                                    <div className="col-span-1 md:col-span-2">
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs text-gray-400 uppercase tracking-wider">Comments</p>
                                                {isCommentsLoading && <span className="text-xs text-gray-500">Loading...</span>}
                                            </div>
                                            {comments.length === 0 ? (
                                                <p className="text-sm text-gray-500">No comments yet.</p>
                                            ) : (
                                                <ul className="space-y-3">
                                                    {comments.map((comment, idx) => (
                                                        <li key={comment.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                                                            <p className="text-sm text-gray-800">{comment.comment || comment.text || comment.body || '-'}</p>
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Unknown time'}
                                                            </p>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <form onSubmit={handleAddComment} className="space-y-3">
                                            <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Add Comment</label>
                                            <textarea
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows={4}
                                                placeholder="Write a comment..."
                                            />
                                            <button
                                                type="submit"
                                                className="px-4 py-2 rounded-xl text-sm text-white bg-blue-500 hover:bg-blue-600 transition duration-200"
                                            >
                                                Add Comment
                                            </button>
                                        </form>
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
            {/* --- ADD MODAL --- */}
             {isAddModalOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-secondary-dark-bg w-11/12 md:w-1/2 p-6 rounded-2xl shadow-2xl border border-gray-100 transform transition-all scale-100 max-h-screen overflow-y-auto">
                        
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                Add New Ticket
                            </h3>
                            <button 
                                onClick={handleCloseAddModal}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-semibold"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleAddTicket}>
                            {/* Identity & Classification */}
                            <div className="mb-4">
                                {/* <h4 className="text-sm font-semibold mb-3 text-gray-400 dark:text-gray-200">Identity & Classification</h4> */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Judul <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="judul"
                                            value={formData.judul}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Account Manager
                                        </label>
                                        <select
                                            name="emailNotification"
                                            value={formData.emailNotification}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select an account</option>
                                            {accounts.map((account) => (
                                                <option key={account.id || account} value={account.email || account}>
                                                    {account.name || account}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Departemen <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="departemen"
                                            value={formData.departemen}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select a department</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id || dept} value={dept.name || dept}>
                                                    {dept.name || dept}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Branch
                                        </label>
                                        <select
                                            name="branch"
                                            value={formData.branch}
                                            onChange={handleFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select a branch</option>
                                            {branches.map((branch) => (
                                                <option key={branch.id || branch} value={branch.name || branch}>
                                                    {branch.name || branch}
                                                </option>
                                            ))}
                                        </select>
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
                                    Add Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Tickets;