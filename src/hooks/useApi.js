import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://work-2-qwqvqjoqsgfcxwdr.prod-runtime.all-hands.dev/api'
  : 'http://localhost:12001/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const makeRequest = useCallback(async (url, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url) => {
    return makeRequest(url, { method: 'GET' });
  }, [makeRequest]);

  const post = useCallback((url, data) => {
    return makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const put = useCallback((url, data) => {
    return makeRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }, [makeRequest]);

  const del = useCallback((url) => {
    return makeRequest(url, { method: 'DELETE' });
  }, [makeRequest]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
  };
};

// Hook for managing API state with automatic error handling
export const useApiState = (initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const api = useApi();

  const execute = useCallback(async (apiCall, options = {}) => {
    const { 
      showSuccessToast = false, 
      showErrorToast = true,
      successMessage = 'Operation completed successfully',
      onSuccess,
      onError 
    } = options;

    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      setData(result);
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      
      if (showErrorToast) {
        toast.error(err.message || 'An error occurred');
      }
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setLoading(false);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    setData,
  };
};

// Hook for paginated data
export const usePaginatedApi = (url, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    hasMore: true,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const api = useApi();

  const loadData = useCallback(async (params = {}, append = false) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        ...initialParams,
        ...params,
        limit: pagination.limit,
        offset: append ? pagination.offset : 0,
      });

      const response = await api.get(`${url}?${queryParams}`);
      
      if (append) {
        setData(prev => [...prev, ...(response.data || response.orders || [])]);
      } else {
        setData(response.data || response.orders || []);
      }

      setPagination(prev => ({
        ...prev,
        offset: append ? prev.offset + prev.limit : prev.limit,
        hasMore: (response.data || response.orders || []).length === prev.limit,
        total: response.total || (response.data || response.orders || []).length,
      }));
    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [url, api, initialParams, pagination.limit, pagination.offset]);

  const loadMore = useCallback(() => {
    if (!loading && pagination.hasMore) {
      loadData({}, true);
    }
  }, [loadData, loading, pagination.hasMore]);

  const refresh = useCallback((params = {}) => {
    setPagination(prev => ({ ...prev, offset: 0, hasMore: true }));
    loadData(params, false);
  }, [loadData]);

  return {
    data,
    pagination,
    loading,
    error,
    loadData,
    loadMore,
    refresh,
  };
};

export default useApi;