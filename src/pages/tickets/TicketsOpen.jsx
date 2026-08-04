import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    GridComponent, 
    ColumnsDirective, 
    ColumnDirective, 
    Resize, 
    Sort, 
    ContextMenu, 
    Filter, 
    Page, 
    ExcelExport, 
    PdfExport, 
    Edit, 
    Inject 
} from '@syncfusion/ej2-react-grids';
import { 
    PiMagnifyingGlassPlusDuotone, 
    PiTrashDuotone, 
    PiEraserDuotone 
} from "react-icons/pi";
import { Header } from '../../components';
import { useStateContext } from '../../contexts/ContextProvider';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; 
const REST_API_URL = `${API_BASE_URL}/api/v1/tickets`;

const TicketsOpen = () => {
    const gridRef = useRef(null);

    // Initial state guaranteed to be valid for Syncfusion Grid
    const [ticketData, setTicketData] = useState({ result: [], count: 0 });
    const [departments, setDepartments] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [branches, setBranches] = useState([]);
    const [searchId, setSearchId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Summary Card Stats
    const [ticketStats, setTicketStats] = useState({
        total: 0,
        open: 0,
        pending: 0,
        closed: 0
    });

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditingTicket, setIsEditingTicket] = useState(false);

    // Backend pageable states
    const [page, setPage] = useState(0);
    const [pageSize] = useState(5);

    // Form states
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

    const { currentColor } = useStateContext();
    const navigate = useNavigate();

    // Helper functions
    const getStoredUser = () => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (error) {
            return {};
        }
    };

    const getUserRoles = () => {
        const storedUser = getStoredUser();
        const rawRoles = storedUser.roles || storedUser.role || [];
        if (Array.isArray(rawRoles)) {
            return rawRoles.map((role) => String(role).toUpperCase());
        }
        if (typeof rawRoles === 'string') {
            return [rawRoles.toUpperCase()];
        }
        return [];
    };

    const hasRole = (...allowedRoles) => {
        const roles = getUserRoles();
        return roles.some((role) => 
            allowedRoles.some((allowed) => role === allowed || role === `ROLE_${allowed}` || `ROLE_${role}` === `ROLE_${allowed}`)
        );
    };

    const canManageTickets = () => hasRole('ADMIN');

    const ensureAdminAccess = (action = 'perform this action') => {
        if (!canManageTickets()) {
            alert(`Only admins can ${action}.`);
            return false;
        }
        return true;
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        if (!token) return null;
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        };
    };

    const handleAuthError = (err) => {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
            localStorage.removeItem('authToken');
            setError('Authentication required. Redirecting to login.');
            navigate('/login', { replace: true });
            return true;
        }
        return false;
    };

    // 1. Fetch Ticket Stats from Backend Endpoint
    const fetchTicketStats = async () => {
        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await axios.get(`${REST_API_URL}/stats`, { headers });
            const data = response.data?.data || response.data;

            if (data) {
                setTicketStats({
                    total: Number(data.total) || 0,
                    open: Number(data.open) || 0,
                    pending: Number(data.pending) || 0,
                    closed: Number(data.closed) || 0
                });
            }
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Fetch stats error:', err);
            }
        }
    };

    // 2. Fetch tickets grid with pagination
    const fetchTickets = async (currentPage = page, currentSize = pageSize) => {
        try {
            setLoading(true);
            const headers = getAuthHeaders();
            
            // Sesuaikan endpoint dengan query parameter status=Open
            const response = await axios.get(
                `${REST_API_URL}?status=Open&page=${currentPage}&size=${currentSize}`, 
                { headers }
            );
        
            const data = response.data;
        
            // Extract rows / list data
            // Spring HATEOAS biasanya menyimpan array di dalam _embedded.tickets / content / result / data
            let rows = 
                data?._embedded?.tickets || 
                data?.content || 
                data?.result || 
                data?.data || 
                (Array.isArray(data) ? data : []);
        
            // Extract total count khusus dari struktur "page.totalElements"
            let totalCount = 0;
            if (data?.page?.totalElements !== undefined) {
                totalCount = data.page.totalElements; // <--- Mengambil dari "page": { "totalElements": 8 }
            } else if (data?.totalElements !== undefined) {
                totalCount = data.totalElements;
            } else {
                totalCount = rows.length;
            }
        
            const cleanRows = rows.filter(item => item !== null && item !== undefined);
        
            setTicketData({
                result: cleanRows,
                count: totalCount // Ini akan bernilai 8
            });
        
        } catch (err) {
            console.error('Fetch tickets error:', err);
            setTicketData({ result: [], count: 0 });
        } finally {
            setLoading(false);
        }
    };

    // Load Dropdown Options Once
    useEffect(() => {
        const fetchDropdownData = async () => {
            const headers = getAuthHeaders();
            if (!headers) return;

            try {
                const [deptRes, branchRes, accRes] = await Promise.all([
                    axios.get(`${REST_API_URL}/departments`, { headers }),
                    axios.get(`${REST_API_URL}/branches`, { headers }),
                    axios.get(`${REST_API_URL}/accounts`, { headers })
                ]);

                const extractData = (res) => {
                    const d = res.data?.data || res.data;
                    return Array.isArray(d) ? d : [];
                };

                setDepartments(extractData(deptRes));
                setBranches(extractData(branchRes));
                setAccounts(extractData(accRes));
            } catch (err) {
                handleAuthError(err);
            }
        };

        fetchDropdownData();
    }, []);

    // Load Grid & Stats on Page/PageSize Change
    useEffect(() => {
        fetchTickets(page, pageSize);
        fetchTicketStats();
    }, [page, pageSize]);

    useEffect(() => {
        if (gridRef.current && gridRef.current.pagerModule) {
            gridRef.current.pagerModule.goToPage(page + 1);
        }
    }, [ticketData, page]);

    const handleGridAction = (args) => {
        if (args.requestType === 'paging') {
            args.cancel = true;
            const targetPage = args.currentPage - 1;
            if (targetPage !== page) {
                setPage(targetPage);
            }
        }
    };

    const createEmptyTicketForm = () => ({
        noTiket: '',
        judul: '',
        departemen: '',
        emailNotification: '',
        branch: '',
        priority: ''
    });

    const mapTicketToFormData = (ticket = {}) => ({
        noTiket: ticket?.noTiket || '',
        judul: ticket?.judul || '',
        departemen: ticket?.departemen || '',
        emailNotification: ticket?.account || '',
        priority: ticket?.priority || ''
    });    

    const fetchComments = async (ticketId) => {
        try {
            setIsCommentsLoading(true);
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await axios.get(`${REST_API_URL}/${encodeURIComponent(ticketId)}/comments`, { headers });
            let data = response.data?.data || response.data;

            if (Array.isArray(data)) {
                setComments(data);
            } else if (data) {
                setComments([data]);
            } else {
                setComments([]);
            }
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Fetch comments error:', err);
            }
        } finally {
            setIsCommentsLoading(false);
        }
    };

    const handleView = (rowData) => {
        if (!rowData) return;
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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditTicket = () => {
        if (!ensureAdminAccess('edit tickets')) return;
        setEditFormData(mapTicketToFormData(selectedTicket));
        setIsEditingTicket(true);
    };

    const handleSaveEditedTicket = async (e) => {
        e.preventDefault();
        if (!selectedTicket?.id || !ensureAdminAccess('edit tickets')) return;

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

            const updatedTicket = response.data?.data || response.data || { ...selectedTicket, ...editFormData };
            
            setIsEditingTicket(false);
            fetchTickets(page, pageSize);
            fetchTicketStats();
            setSelectedTicket(updatedTicket);
            setError(null);
            alert('Ticket updated successfully');
        } catch (err) {
            if (!handleAuthError(err)) {
                console.error('Update ticket error:', err);
                alert(err.response?.data?.message || 'Failed to update ticket');
            }
        }
    };

    const handleSearchInputChange = (e) => {
        setSearchId(e.target.value);
    };

    const handleSearchByName = async () => {
        if (!searchId) {
            alert('Please enter a ticket name to search');
            return;
        }
        const trimmed = searchId.trim();

        const localMatches = (ticketData.result || []).filter((ticket) =>
            String(ticket?.judul || ticket?.ticketName || '').toLowerCase().includes(trimmed.toLowerCase())
        );

        if (localMatches.length > 0) {
            setTicketData({ result: localMatches, count: localMatches.length });
            setError(null);
            return;
        }

        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await axios.get(`${REST_API_URL}/?name=${encodeURIComponent(trimmed)}`, { headers });
            let data = response.data?.data || response.data;

            if (!data) {
                setTicketData({ result: [], count: 0 });
                alert('Ticket not found');
            } else if (Array.isArray(data)) {
                setTicketData({ result: data, count: data.length });
            } else {
                setTicketData({ result: [data], count: 1 });
            }
            setError(null);
        } catch (err) {
            if (!handleAuthError(err)) {
                alert(err.response?.data?.message || 'Failed to search ticket');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchId('');
        setPage(0);
        fetchTickets(0, pageSize);
        fetchTicketStats();
    };

    const handleCloseTicket = async () => {
        if (!selectedTicket?.id || !ensureAdminAccess('close tickets')) return;
        if (!window.confirm(`Are you sure you want to close ticket: ${selectedTicket.noTiket}?`)) return;

        try {
            setLoading(true); // 1. Explicitly mark loading active
            const headers = getAuthHeaders();
            if (!headers) {
                setLoading(false);
                return;
            }

            // 2. Perform the close API call
            await axios.put(`${REST_API_URL}/${encodeURIComponent(selectedTicket.id)}/close`, {}, { headers });

            // 3. Close the modal first so the DOM unmounts cleanly
            handleCloseModal();

            alert('Ticket closed successfully and notification email sent.');

            // 4. Re-fetch grid data & stats in parallel
            await Promise.all([
                fetchTickets(page, pageSize),
                fetchTicketStats()
            ]);

            // 5. Refresh Syncfusion grid instance safely if attached
            if (gridRef.current) {
                gridRef.current.refresh();
            }

        } catch (err) {
            if (!handleAuthError(err)) {
                alert(err.response?.data?.message || 'Failed to close ticket');
            }
        } finally {
            setLoading(false); // 6. Ensure loading overlay is always turned off
        }
    };

    const handleAddTicket = async (e) => {
        e.preventDefault();
        if (!ensureAdminAccess('create tickets')) return;
    
        try {
            const headers = getAuthHeaders();
            if (!headers) return;
        
            await axios.post(REST_API_URL, formData, { headers });
        
            handleCloseAddModal();
            fetchTickets(page, pageSize);
            fetchTicketStats();
            alert('Ticket added successfully');
        } catch (err) {
            if (!handleAuthError(err)) {
                alert(err.response?.data?.message || 'Failed to add ticket');
            }
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !selectedTicket?.id) return;

        try {
            const headers = getAuthHeaders();
            if (!headers) return;

            const response = await axios.post(
                `${REST_API_URL}/${encodeURIComponent(selectedTicket.id)}/comments`,
                { comment: commentText.trim() },
                { headers }
            );

            const newComment = response.data?.data || response.data || { 
                comment: commentText.trim(), 
                createdAt: new Date().toISOString() 
            };

            setComments(prev => [newComment, ...prev]);
            setCommentText('');
            alert('Comment added successfully');
        } catch (err) {
            if (!handleAuthError(err)) {
                alert(err.response?.data?.message || 'Failed to add comment');
            }
        }
    };

    const handleDelete = async (rowData) => {
        if (!rowData?.id || !ensureAdminAccess('delete tickets')) return;
        if (!window.confirm(`Are you sure you want to delete ticket: ${rowData.noTiket}?`)) return;
        
        try {
            setLoading(true);
            const headers = getAuthHeaders();
            if (!headers) return;
        
            await axios.delete(`${REST_API_URL}/${encodeURIComponent(rowData.id)}`, { headers });
        
            await fetchTickets(page, pageSize);
            await fetchTicketStats();
        
            alert(`Ticket "${rowData.noTiket}" deleted successfully`);
            setError(null);
        } catch (err) {
            if (!handleAuthError(err)) {
                alert(err.response?.data?.message || 'Failed to delete ticket');
            }
        } finally {
            setLoading(false);
        }
    };

    // FIXED: Safe null guard inside Template component
    const TicketTemplate = (props) => {
        if (!props || typeof props !== 'object') return null;
        const fullDescription = props.deskripsi || props.judul || props.noTiket || '';
        // Helper to truncate string
        const truncate = (str, maxLength = 25) => {
            if (!str) return '';
            return str.length > maxLength ? `${str.substring(0, maxLength)} . . .` : str;
        };
        return (
            <div title={fullDescription} style={{ cursor: 'pointer' }}>
                <div style={{ color: '#444', fontWeight: 'bold', fontSize: '10px' }}>
                    {props.noTiket || ''}
                </div>
                <div style={{ fontSize: '12px' }}>
                    {truncate(props.judul || '', 25)}
                </div>
            </div>
        );
    };

    const ticketsGrid = [
        { field: 'id', headerText: 'ID', width: '55', textAlign: 'Center' },
        { field: 'ticketDetails', headerText: 'Ticket No / Subject', width: '150', textAlign: 'Left', template: TicketTemplate },
        { 
            field: 'dibuatOleh', 
            headerText: 'Created By', 
            width: '90', 
            textAlign: 'Center',
            template: (props) => {
                if (!props || !props.dibuatOleh) return '-';
                // Mengambil karakter pertama dan diubah ke huruf besar
                const firstChar = String(props.dibuatOleh).trim().charAt(0).toUpperCase();

                return (
                    <span 
                        className="inline-flex items-center justify-center w-8 h-8 bg-green-400 text-white rounded-full text-xs border-2 border-gray-100"
                        title={props.dibuatOleh} // Tooltip tetap menampilkan nama lengkap saat di-hover
                    >
                        {firstChar}
                    </span>
                );
            }
        },
        { field: 'departemen', headerText: 'Department', width: '120', textAlign: 'Center' },
        { 
            field: 'status', 
            headerText: 'Status', 
            width: '90', 
            textAlign: 'Center',
            // FIXED: Safe null guard inside Status Template
            template: (props) => {
                if (!props || typeof props !== 'object') return null;
                const statusLower = (props.status || '').toLowerCase();
                let badgeStyle = 'bg-gray-100 text-gray-500';

                if (statusLower === 'open') badgeStyle = 'bg-green-500 text-white';
                else if (statusLower === 'pending') badgeStyle = 'bg-amber-100 text-amber-500';
                else if (statusLower === 'closed') badgeStyle = 'bg-red-100 text-red-500';

                return (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs tracking-wide ${badgeStyle}`}>
                        {props.status || ''}
                    </span>
                );
            }
        },
        {
            field: 'createdAt',
            headerText: 'Created At',
            width: '100',
            textAlign: 'Center',
            type: 'dateTime',
            format: 'd/M/yy'
        },
        { 
            field: 'actions', 
            headerText: 'Actions', 
            width: '160', 
            textAlign: 'Center', 
            template: (props) => {
                if (!props || typeof props !== 'object') return null;
                return (
                    <div className="flex justify-center space-x-2">
                        <button 
                            type="button"
                            className="text-blue-500 text-xl py-1 px-2 font-bold"
                            onClick={() => handleView(props)}
                        >
                            <PiMagnifyingGlassPlusDuotone />
                        </button>
                        {canManageTickets() && (
                            <button 
                                type="button"
                                title="Delete Ticket"
                                className="text-red-500 text-xl py-1 px-3 font-semibold"
                                onClick={() => handleDelete(props)}
                            >
                                <PiTrashDuotone />
                            </button>
                        )}
                    </div>
                );
            } 
        }
    ];

    return (
        <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-xl relative">
            <Header category="Page" title="Ticket Dashboard" />

            {/* --- SUMMARY METRIC CARDS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-4">
                <div className="p-4 bg-blue-100 dark:bg-secondary-dark-bg border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total Tickets</p>
                        <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{ticketStats.total}</h4>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-xl text-xl font-bold">
                        📊
                    </div>
                </div>

                <div className="p-4 bg-green-100 dark:bg-secondary-dark-bg border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Open Tickets</p>
                        <h4 className="text-2xl font-bold text-green-600 mt-1">{ticketStats.open}</h4>
                    </div>
                    <div className="p-3 bg-green-50 text-green-500 rounded-xl text-xl font-bold">
                        🟢
                    </div>
                </div>

                <div className="p-4 bg-amber-100 dark:bg-secondary-dark-bg border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Pending Tickets</p>
                        <h4 className="text-2xl font-bold text-amber-500 mt-1">{ticketStats.pending}</h4>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-xl text-xl font-bold">
                        ⏳
                    </div>
                </div>

                <div className="p-4 bg-red-100 dark:bg-secondary-dark-bg border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Closed Tickets</p>
                        <h4 className="text-2xl font-bold text-red-500 mt-1">{ticketStats.closed}</h4>
                    </div>
                    <div className="p-3 bg-red-50 text-red-500 rounded-xl text-xl font-bold">
                        🔴
                    </div>
                </div>
            </div>

            {/* --- CONTROLS & SEARCH BAR --- */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
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
                        className="px-2 py-2 text-xl text-red-500 font-bold rounded-xl bg-red-100 hover:bg-red-200 transition duration-200"
                    >
                        <PiEraserDuotone />
                    </button>
                    {canManageTickets() && (
                        <button
                            title="Add Ticket"
                            type="button"
                            className="text-green-700 px-3 py-2 rounded-xl text-xs bg-green-200 hover:bg-green-300 transition duration-200"
                            onClick={handleOpenAddModal}
                        >
                            New Ticket
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <p>{error}</p>
                </div>
            )}

            {/* Grid container with loading overlay */}
            <div className="relative min-h-[300px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center backdrop-blur-[1px]">
                        <p className="text-gray-600 font-medium">Loading tickets...</p>
                    </div>
                )}

                <GridComponent
                    id="gridcomp"
                    ref={gridRef}
                    dataSource={ticketData}
                    allowPaging={true}
                    pageSettings={{ 
                        pageSize: pageSize, 
                        currentPage: page + 1 
                    }}
                    actionBegin={handleGridAction}
                >
                    <ColumnsDirective>
                        {ticketsGrid.map((item, index) => (
                            <ColumnDirective key={index} {...item} />
                        ))}
                    </ColumnsDirective>
                    <Inject services={[Resize, Sort, ContextMenu, Filter, Page, ExcelExport, Edit, PdfExport]} />
                </GridComponent>
            </div>

            {/* --- VIEW / EDIT MODAL --- */}
            {isModalOpen && selectedTicket && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="relative overflow-hidden bg-white dark:bg-secondary-dark-bg w-11/12 max-w-3xl md:w-2/5 xl:w-[36rem] p-6 rounded-2xl shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto">
                        <img 
                            src="/images/watermark.png" 
                            alt="" 
                            aria-hidden="true" 
                            className="absolute inset-0 z-0 w-full h-full object-contain opacity-20 pointer-events-none select-none" 
                        />
                        <div className="flex justify-between items-center border-b pb-3 mb-4 relative z-10">
                            <div className="flex flex-col">
                                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                    Ticket Details
                                </h3>
                                <p className='text-xs text-gray-400'>
                                    {selectedTicket.createdAt
                                        ? new Date(selectedTicket.createdAt).toLocaleString('en-GB', {
                                            day: 'numeric',
                                            month: 'numeric',
                                            year: '2-digit',
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                          })
                                        : 'Unknown time'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {!isEditingTicket && selectedTicket.status === 'Open' && canManageTickets() && (
                                    <button
                                        type="button"
                                        title="Close Ticket"
                                        onClick={handleCloseTicket}
                                        className="px-3 py-2 rounded-lg text-sm bg-red-100 text-red-600 hover:bg-red-200 transition duration-200 font-semibold"
                                    >
                                        Close Ticket
                                    </button>
                                )}

                                {!isEditingTicket && canManageTickets() && (
                                    <button
                                        type="button"
                                        title="Edit Ticket"
                                        onClick={handleEditTicket}
                                        className="px-3 py-2 rounded-lg text-sm text-blue-400 hover:text-blue-600 transition duration-200"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>

                        {isEditingTicket ? (
                            <form onSubmit={handleSaveEditedTicket} className="space-y-4 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Department <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="departemen"
                                            value={editFormData.departemen}
                                            onChange={handleEditFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((d) => (
                                                <option key={d.id || d} value={d.name || d}>{d.name || d}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                                            Priority <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="priority"
                                            value={editFormData.priority}
                                            onChange={handleEditFormChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Priority</option>
                                            <option value="LOW">LOW</option>
                                            <option value="MEDIUM">MEDIUM</option>
                                            <option value="HIGH">HIGH</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6 border-t pt-3">
                                    <button 
                                        type="button" 
                                        className="px-4 py-2 rounded-xl text-sm bg-red-300 text-gray-800 hover:bg-red-400 transition duration-200" 
                                        onClick={() => setIsEditingTicket(false)}>
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
                            <div className="relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
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
                                                                {comment.createdAt
                                                                    ? new Date(comment.createdAt).toLocaleString('en-GB', {
                                                                        day: 'numeric',
                                                                        month: 'numeric',
                                                                        year: '2-digit',
                                                                        hour: 'numeric',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                      })
                                                                    : 'Unknown time'}
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
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        className="text-white bg-red-300 hover:bg-red-400 px-5 py-2 rounded-xl text-sm transition duration-200"
                                        onClick={handleCloseModal}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- ADD MODAL --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-secondary-dark-bg w-11/12 md:w-1/2 p-6 rounded-2xl shadow-2xl border border-gray-100 max-h-screen overflow-y-auto">
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

                        <form onSubmit={handleAddTicket}>
                            <div className="mb-4">
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                            <div className="flex justify-end gap-3 mt-6 border-t pt-3">
                                <button
                                    type="button"
                                    className="px-4 py-2 rounded-xl text-sm bg-gray-300 text-gray-800 hover:bg-gray-400 transition duration-200"
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

export default TicketsOpen;