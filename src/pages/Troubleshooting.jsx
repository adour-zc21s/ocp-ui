import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081').replace(/\/$/, '');
const REST_API_URL = `${API_BASE_URL}/api/v1/catalog/issues`;

const getRecords = (data) => {
  const responseData = data?.data ?? data;
  const listData = Array.isArray(responseData)
    ? responseData
    : responseData?.issues
      || responseData?.solutions
      || responseData?.content
      || responseData?.items
      || responseData?.results;
  const records = Array.isArray(listData) ? listData : [responseData];
  return records.filter((item) => item !== null && item !== undefined);
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const formatLabel = (label) => String(label)
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const renderSolution = (solution) => {
  if (Array.isArray(solution)) {
    return (
      <ol className="list-decimal space-y-2 pl-5">
        {solution.map((item, index) => (
          <li key={index} className="break-words">
            {renderSolution(item)}
          </li>
        ))}
      </ol>
    );
  }

  if (solution && typeof solution === 'object') {
    const fields = Object.entries(solution).filter(([key]) => key.toLowerCase() !== 'id');
    return (
      <dl className="grid gap-3 xl:grid-cols-2">
        {fields.map(([key, value]) => (
          <div key={key} className="min-w-0">
            <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {formatLabel(key)}
            </dt>
            <dd className="whitespace-pre-wrap break-words text-sm text-slate-700 dark:text-gray-200">
              {renderSolution(value)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span className="whitespace-pre-wrap">{formatValue(solution)}</span>;
};

const renderSolutionsColumns = (solutions) => {
  const items = Array.isArray(solutions) ? solutions : [solutions];

  return (
    <div className="grid w-full grid-cols-1 gap-4">
      {items.map((solution, index) => (
        <div key={index} className="w-full min-w-0 rounded-lg border border-slate-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Solution {index + 1}
          </p>
          <div className="break-words text-sm text-slate-700 dark:text-gray-200">
            {renderSolution(solution)}
          </div>
        </div>
      ))}
    </div>
  );
};

const renderRootCause = (cause) => {
  if (Array.isArray(cause)) {
    return (
      <ul className="list-disc space-y-2 pl-5">
        {cause.map((item, index) => (
          <li key={index}>{renderRootCause(item)}</li>
        ))}
      </ul>
    );
  }

  if (cause && typeof cause === 'object') {
    return (
      <dl className="grid gap-3 sm:grid-cols-2">
        {Object.entries(cause).map(([key, value]) => {
          const isSolutions = key.toLowerCase().replace(/[_-]/g, '') === 'solutions';
          return (
          <div key={key} className={`min-w-0 ${isSolutions ? 'sm:col-span-2' : ''}`}>
            <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {formatLabel(key)}
            </dt>
            <dd className="break-words text-sm text-slate-700 dark:text-gray-200">
              {isSolutions ? renderSolutionsColumns(value) : formatValue(value)}
            </dd>
          </div>
          );
        })}
      </dl>
    );
  }

  const text = formatValue(cause);
  return <span className="whitespace-pre-wrap">{text}</span>;
};

const renderRootCauses = (value) => {
  let causes = value;
  if (typeof causes === 'string') {
    try {
      causes = JSON.parse(causes);
    } catch (error) {
      causes = causes.split(/\r?\n/).map((cause) => cause.trim()).filter(Boolean);
    }
  }

  if (Array.isArray(causes)) {
    return (
      <ol className="list-decimal space-y-3 pl-5">
        {causes.map((cause, index) => (
          <li key={index} className="rounded-lg bg-slate-50 p-3 dark:bg-gray-800">
            {renderRootCause(cause)}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-gray-800">
      {renderRootCause(causes)}
    </div>
  );
};

const getTitle = (issue) => (
  issue.title
  || issue.issueName
  || issue.name
  || issue.judul
  || issue.nama
  || 'Issue'
);

const getErrorCode = (issue) => (
  issue.errorCode
  ?? issue.error_code
  ?? issue.kodeError
  ?? issue.kode_error
  ?? issue.code
);

const Troubleshooting = () => {
  const [issues, setIssues] = useState([]);
  const [issueDetails, setIssueDetails] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState(null);
  const [detailErrors, setDetailErrors] = useState({});
  const [expandedIssueId, setExpandedIssueId] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [activeKeyword, setActiveKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchIssues = useCallback(async (filterKeyword = '') => {
    setLoading(true);
    setError('');
    setIssueDetails({});
    setDetailErrors({});
    setExpandedIssueId(null);

    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      setError('Sesi login tidak ditemukan. Silakan login kembali.');
      navigate('/login', { replace: true });
      return;
    }

    try {
      const requestUrl = filterKeyword
        ? `${REST_API_URL}?keyword=${encodeURIComponent(filterKeyword)}`
        : REST_API_URL;
      const response = await axios.get(requestUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const items = getRecords(response.data);
      setIssues(items);
    } catch (requestError) {
      if (requestError.response?.status === 401 || requestError.response?.status === 403) {
        localStorage.removeItem('authToken');
        setError('Sesi login berakhir. Silakan login kembali.');
        navigate('/login', { replace: true });
      } else {
        setError('Gagal memuat daftar issues. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchIssueDetails = useCallback(async (issue) => {
    const issueId = issue.id ?? issue.issueId;
    if (issueId === null || issueId === undefined || issueId === '') {
      setDetailErrors((previous) => ({
        ...previous,
        [issueId ?? 'missing']: 'ID issue tidak tersedia.',
      }));
      return;
    }

    if (Object.prototype.hasOwnProperty.call(issueDetails, issueId)) {
      setExpandedIssueId((previous) => (previous === issueId ? null : issueId));
      return;
    }

    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('Sesi login tidak ditemukan. Silakan login kembali.');
      navigate('/login', { replace: true });
      return;
    }

    setExpandedIssueId(issueId);
    setDetailLoadingId(issueId);
    setDetailErrors((previous) => ({ ...previous, [issueId]: '' }));

    try {
      const response = await axios.get(
        `${REST_API_URL}/${encodeURIComponent(issueId)}/full`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      setIssueDetails((previous) => ({
        ...previous,
        [issueId]: response.data?.data ?? response.data,
      }));
    } catch (requestError) {
      if (requestError.response?.status === 401 || requestError.response?.status === 403) {
        localStorage.removeItem('authToken');
        setError('Sesi login berakhir. Silakan login kembali.');
        navigate('/login', { replace: true });
      } else {
        setDetailErrors((previous) => ({
          ...previous,
          [issueId]: 'Gagal memuat detail issue. Silakan coba lagi.',
        }));
      }
    } finally {
      setDetailLoadingId(null);
    }
  }, [issueDetails, navigate]);

  useEffect(() => {
    fetchIssues(activeKeyword);
  }, [activeKeyword, fetchIssues]);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setActiveKeyword(keyword.trim());
  };

  const handleFilterReset = () => {
    setKeyword('');
    setActiveKeyword('');
  };

  return (
    <div className="m-4 mt-24 rounded-3xl bg-white p-6 dark:bg-[#1f2937] md:m-10 md:mt-6">
      <Header category="Support" title="Troubleshooting" />

      <form onSubmit={handleFilterSubmit} className="mb-6 flex flex-col gap-3 sm:flex-row">
        <label htmlFor="issue-keyword" className="sr-only">
          Filter issue berdasarkan judul atau kode error
        </label>
        <input
          id="issue-keyword"
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Cari berdasarkan judul atau kode error"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Filter
        </button>
        {activeKeyword && (
          <button
            type="button"
            onClick={handleFilterReset}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Reset
          </button>
        )}
      </form>

      {loading && (
        <p className="text-sm text-slate-500 dark:text-gray-300" role="status">
          Memuat daftar issues...
        </p>
      )}

      {!loading && error && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200" role="alert">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => fetchIssues(activeKeyword)}
            className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800"
          >
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && issues.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-gray-300">
          Belum ada issue.
        </p>
      )}

      {!loading && !error && issues.length > 0 && (
        <div className="grid gap-5">
          {issues.map((issue, index) => {
            const record = typeof issue === 'object' && !Array.isArray(issue)
              ? issue
              : { issue };
            const title = getTitle(record);
            const errorCode = getErrorCode(record);
            const issueId = record.id ?? record.issueId;
            const detailKey = issueId ?? 'missing';
            const isExpanded = expandedIssueId === issueId;

            return (
              <article
                key={issueId ?? index}
                className="rounded-2xl border border-slate-200 p-5 dark:border-gray-700"
              >
                <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">
                  {title}
                </h2>
                <p className="text-sm text-slate-600 dark:text-gray-300">
                  Kode Error: <span className="font-semibold">{formatValue(errorCode)}</span>
                </p>
                <button
                  type="button"
                  onClick={() => fetchIssueDetails(record)}
                  disabled={detailLoadingId === issueId}
                  aria-expanded={isExpanded}
                  className="mt-4 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {detailLoadingId === issueId
                    ? 'Memuat detail...'
                    : isExpanded
                      ? 'Tutup detail'
                      : 'Lihat detail'}
                </button>
                {isExpanded && (
                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-gray-700">
                    {detailErrors[detailKey] && (
                      <p className="mb-3 text-sm text-red-600 dark:text-red-300" role="alert">
                        {detailErrors[detailKey]}
                      </p>
                    )}
                    {issueDetails[issueId] && (
                      <dl className="grid gap-3 sm:grid-cols-2">
                        {Object.entries(issueDetails[issueId]).map(([key, value]) => {
                          const isRootCauses = key.toLowerCase().replace(/[_-]/g, '') === 'rootcauses';
                          const isSolution = key.toLowerCase().replace(/[_-]/g, '') === 'solution';
                          return (
                            <div key={key} className={`min-w-0 ${isRootCauses || isSolution ? 'sm:col-span-2' : ''}`}>
                              <dt className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                {formatLabel(key)}
                              </dt>
                              <dd className="text-sm text-slate-700 dark:text-gray-200">
                                {isRootCauses
                                  ? renderRootCauses(value)
                                  : isSolution
                                    ? renderSolution(value)
                                    : formatValue(value)}
                              </dd>
                            </div>
                          );
                        })}
                      </dl>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Troubleshooting;
