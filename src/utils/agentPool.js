export const AGENT_POOL_OPTIONS = [
  {
    value: 'auto',
    label: 'Auto (Supervisor decides)',
    selectedSources: null,
  },
  {
    value: 'sql_only',
    label: 'SQL / Structured Data only',
    selectedSources: ['sql'],
  },
  {
    value: 'document_only',
    label: 'Document only',
    selectedSources: ['document'],
  },
  {
    value: 'structured_only',
    label: 'Structured Data only',
    selectedSources: ['structured_data'],
  },
  {
    value: 'all',
    label: 'All agents',
    selectedSources: ['sql', 'document', 'structured_data'],
  },
]

export const resolveSelectedSources = (poolValue) => {
  const selected = AGENT_POOL_OPTIONS.find((option) => option.value === poolValue)
  return selected ? selected.selectedSources : null
}

