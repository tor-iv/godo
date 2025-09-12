/**
 * API Hooks
 * Custom hooks for common API operations with loading states and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { HttpClient } from '../api/HttpClient';
import { ApiResponse, NetworkState } from '../api/types';

/**
 * API State Interface
 */
export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * API Hook Options
 */
export interface UseApiOptions {
  immediate?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  cache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
}

/**
 * Generic API Hook
 */
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): ApiState<T> & {
  execute: () => Promise<void>;
  reset: () => void;
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const isCurrentRef = useRef(true);
  const { immediate = true, retryAttempts = 3, retryDelay = 1000 } = options;

  const execute = useCallback(async (): Promise<void> => {
    if (!isCurrentRef.current) return;

    setState(prevState => ({
      ...prevState,
      loading: true,
      error: null,
    }));

    let attempt = 0;
    const maxAttempts = retryAttempts;

    while (attempt < maxAttempts) {
      try {
        const response = await apiCall();

        if (!isCurrentRef.current) return;

        if (response.success) {
          setState({
            data: response.data || null,
            loading: false,
            error: null,
            success: true,
          });
          return;
        } else {
          throw new Error(response.message || 'API call failed');
        }
      } catch (error: any) {
        attempt++;

        if (!isCurrentRef.current) return;

        if (attempt === maxAttempts) {
          setState({
            data: null,
            loading: false,
            error: error.message || 'An unexpected error occurred',
            success: false,
          });
        } else {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }, [apiCall, retryAttempts, retryDelay]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  const refetch = useCallback(async (): Promise<void> => {
    await execute();
  }, [execute]);

  useEffect(() => {
    isCurrentRef.current = true;

    if (immediate) {
      execute();
    }

    return () => {
      isCurrentRef.current = false;
    };
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    reset,
    refetch,
  };
}

/**
 * Mutation Hook for POST/PUT/DELETE operations
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>
): {
  mutate: (variables: TVariables) => Promise<TData>;
  data: TData | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  reset: () => void;
} {
  const [state, setState] = useState<ApiState<TData>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setState(prevState => ({
        ...prevState,
        loading: true,
        error: null,
      }));

      try {
        const response = await mutationFn(variables);

        if (response.success) {
          setState({
            data: response.data || null,
            loading: false,
            error: null,
            success: true,
          });
          return response.data as TData;
        } else {
          throw new Error(response.message || 'Mutation failed');
        }
      } catch (error: any) {
        setState({
          data: null,
          loading: false,
          error: error.message || 'An unexpected error occurred',
          success: false,
        });
        throw error;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    mutate,
    ...state,
    reset,
  };
}

/**
 * Network Status Hook
 */
export function useNetworkStatus(): {
  networkState: NetworkState;
  isOnline: boolean;
  isOffline: boolean;
} {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
  });

  useEffect(() => {
    const httpClient = HttpClient.getInstance();

    // Get initial network state
    const initialState = httpClient.getNetworkState();
    setNetworkState(initialState);

    // Set up polling for network state changes
    const interval = setInterval(() => {
      const currentState = httpClient.getNetworkState();
      setNetworkState(currentState);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    networkState,
    isOnline: networkState.isConnected,
    isOffline: !networkState.isConnected,
  };
}

/**
 * Loading State Hook for multiple operations
 */
export function useLoadingState(): {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  withLoading: <T>(operation: () => Promise<T>) => Promise<T>;
} {
  const [loading, setLoading] = useState(false);

  const withLoading = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      setLoading(true);
      try {
        const result = await operation();
        return result;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    setLoading,
    withLoading,
  };
}

/**
 * Optimistic Updates Hook
 */
export function useOptimisticUpdate<T>(
  initialData: T | null,
  updateFn: (data: T, optimisticUpdate: Partial<T>) => T
): {
  data: T | null;
  updateOptimistically: (update: Partial<T>) => void;
  revert: () => void;
  commit: (newData: T) => void;
} {
  const [data, setData] = useState<T | null>(initialData);
  const [originalData, setOriginalData] = useState<T | null>(initialData);

  const updateOptimistically = useCallback(
    (update: Partial<T>) => {
      if (data) {
        setOriginalData(data);
        setData(updateFn(data, update));
      }
    },
    [data, updateFn]
  );

  const revert = useCallback(() => {
    if (originalData) {
      setData(originalData);
      setOriginalData(null);
    }
  }, [originalData]);

  const commit = useCallback((newData: T) => {
    setData(newData);
    setOriginalData(null);
  }, []);

  return {
    data,
    updateOptimistically,
    revert,
    commit,
  };
}

/**
 * Pagination Hook
 */
export function usePagination<T>(
  fetchFn: (
    page: number,
    limit: number
  ) => Promise<ApiResponse<{ items: T[]; total: number }>>,
  options: { pageSize?: number; immediate?: boolean } = {}
): {
  data: T[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
} {
  const { pageSize = 20, immediate = true } = options;

  const [state, setState] = useState({
    data: [] as T[],
    loading: false,
    error: null as string | null,
    currentPage: 1,
    totalPages: 0,
    total: 0,
  });

  const fetchPage = useCallback(
    async (page: number) => {
      setState(prevState => ({
        ...prevState,
        loading: true,
        error: null,
      }));

      try {
        const response = await fetchFn(page, pageSize);

        if (response.success && response.data) {
          setState({
            data: response.data.items,
            loading: false,
            error: null,
            currentPage: page,
            totalPages: Math.ceil(response.data.total / pageSize),
            total: response.data.total,
          });
        } else {
          throw new Error(response.message || 'Failed to fetch data');
        }
      } catch (error: any) {
        setState(prevState => ({
          ...prevState,
          loading: false,
          error: error.message || 'Failed to fetch data',
        }));
      }
    },
    [fetchFn, pageSize]
  );

  const nextPage = useCallback(async () => {
    if (state.currentPage < state.totalPages) {
      await fetchPage(state.currentPage + 1);
    }
  }, [state.currentPage, state.totalPages, fetchPage]);

  const prevPage = useCallback(async () => {
    if (state.currentPage > 1) {
      await fetchPage(state.currentPage - 1);
    }
  }, [state.currentPage, fetchPage]);

  const goToPage = useCallback(
    async (page: number) => {
      if (page >= 1 && page <= state.totalPages) {
        await fetchPage(page);
      }
    },
    [state.totalPages, fetchPage]
  );

  const refresh = useCallback(async () => {
    await fetchPage(state.currentPage);
  }, [state.currentPage, fetchPage]);

  useEffect(() => {
    if (immediate) {
      fetchPage(1);
    }
  }, [fetchPage, immediate]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    hasNext: state.currentPage < state.totalPages,
    hasPrev: state.currentPage > 1,
    nextPage,
    prevPage,
    goToPage,
    refresh,
  };
}
