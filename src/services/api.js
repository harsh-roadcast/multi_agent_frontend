import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 second timeout for chat requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Chat API
export const chatAPI = {
  sendMessage: async (message, systemPrompt = null, selectedSources = null) => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 85000) // 85s abort
      
      const response = await api.post('/chat', {
        message,
        selected_sources: selectedSources,
        vector_search_context: systemPrompt || ''
      }, {
        signal: controller.signal
      })
      
      clearTimeout(timeout)
      return response.data
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message === 'canceled') {
        throw new Error('Request timeout: Chat took too long. Please try a simpler query.')
      }
      throw error
    }
  },

  streamMessage: async (
    message,
    {
      systemPrompt = null,
      selectedSources = null,
      signal = null,
      onStarted,
      onDispatched,
      onAgent,
      onToken,
      onFinal,
      onError,
      onDone,
    } = {}
  ) => {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        selected_sources: selectedSources,
        vector_search_context: systemPrompt || '',
      }),
      ...(signal ? { signal } : {}),
    })

    if (!response.ok || !response.body) {
      throw new Error(`Streaming request failed (${response.status})`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    const dispatchEvent = (eventName, payload) => {
      if (eventName === 'started'    && onStarted)    onStarted(payload)
      if (eventName === 'dispatched' && onDispatched) onDispatched(payload)
      if (eventName === 'agent'      && onAgent)      onAgent(payload)
      if (eventName === 'token'      && onToken)      onToken(payload)
      if (eventName === 'final'      && onFinal)      onFinal(payload)
      if (eventName === 'error'      && onError)      onError(payload)
      if (eventName === 'done'       && onDone)       onDone(payload)
    }

    const parseEventBlock = (block) => {
      const lines = block.split('\n')
      let eventName = 'message'
      const dataLines = []

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim()
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trim())
        }
      }

      if (!dataLines.length) return
      const rawData = dataLines.join('\n')
      try {
        dispatchEvent(eventName, JSON.parse(rawData))
      } catch {
        dispatchEvent(eventName, { message: rawData })
      }
    }

    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split('\n\n')
      buffer = blocks.pop() || ''

      for (const block of blocks) {
        if (block.trim()) parseEventBlock(block)
      }
    }

    if (buffer.trim()) {
      parseEventBlock(buffer)
    }
  },
};

// Datasources API
export const datasourcesAPI = {
  list: async () => {
    const response = await api.get('/datasources');
    return response.data;
  },
  
  register: async (datasource) => {
    const response = await api.post('/datasources', datasource);
    return response.data;
  },
  
  index: async (datasourceId, recreate = false, dryRun = false) => {
    const response = await api.post(`/datasources/${datasourceId}/index`, {
      recreate,
      dry_run: dryRun
    });
    return response.data;
  },

  delete: async (datasourceId) => {
    const response = await api.delete(`/datasources/${datasourceId}`);
    return response.data;
  },
};

// Agents API
export const agentsAPI = {
  list: async () => {
    const response = await api.get('/agents');
    return response.data;
  },
  
  register: async (agent) => {
    const response = await api.post('/agents', agent);
    return response.data;
  },
  
  query: async (agentId, query) => {
    // agentId is the agent's UUID — passed as selected_sources for direct pinned routing
    const response = await api.post('/chat', {
      message: query,
      selected_sources: agentId ? [agentId] : null,
      vector_search_context: ''
    });
    return response.data;
  },

  /** Run supervised pipeline and get raw per-agent results (no synthesis). */
  runAgents: async (message, selectedSources = null) => {
    const response = await api.post('/agent/run', {
      message,
      selected_sources: selectedSources,
      vector_search_context: ''
    });
    return response.data;
  },

  delete: async (agentId) => {
    const response = await api.delete(`/agents/${agentId}`);
    return response.data;
  },
};

// Ingestion API
export const ingestionAPI = {
  ingest: async (params) => {
    const formData = new FormData();

    const files = Array.isArray(params.files)
      ? params.files
      : (params.file ? [params.file] : []);

    files.forEach(file => {
      formData.append('files', file);
    });

    if (params.text) {
      formData.append('text', params.text);
    }
    if (params.document_id) {
      formData.append('document_id', params.document_id);
    }
    if (params.metadata) {
      formData.append('metadata', JSON.stringify(params.metadata));
    }
    
    const response = await api.post('/ingest', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: {
        recreate: Boolean(params.recreate),
        dry_run: Boolean(params.dry_run),
        documents_only: Boolean(params.documents_only),
        db_source: params.db_source || 'postgres',
        file_path: params.file_path || undefined,
        db_url: params.db_url || undefined,
      }
    });
    return response.data;
  },
};

// Health Check
export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// GitBook config check
export const gitbookConfigAPI = {
  check: async () => {
    const response = await api.get('/config/gitbook');
    return response.data;
  },
};

export default api;
