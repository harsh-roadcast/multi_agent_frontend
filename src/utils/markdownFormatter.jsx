/**
 * Format API response into markdown with summary and references
 * @param {Object} response - The API response object
 * @returns {string} Markdown formatted response
 */
export const formatResponseAsMarkdown = (response) => {
  if (!response) return 'No response received'
  
  const summary = response.response || response.message || 'No response received'
  const sources = response.sources || []
  
  // Build markdown
  let markdown = `${summary}`
  
  // Add sources/references if available
  if (sources && sources.length > 0) {
    markdown += '\n\n---\n\n**📚 Referenced Datasources:**\n'
    sources.forEach((source, index) => {
      markdown += `\n${index + 1}. ${formatSourceName(source)}`
    })
  }
  
  return markdown
}

/**
 * Format source name for display
 * @param {string} source - The source type
 * @returns {string} Formatted source name
 */
const formatSourceName = (source) => {
  // Legacy source_type slug mapping (for backwards compat)
  const sourceMap = {
    sql: 'SQL Database',
    postgres: 'PostgreSQL Database',
    mysql: 'MySQL Database',
    redis: 'Redis Cache',
    elasticsearch: 'Elasticsearch',
    document: 'Document Store',
    structured_data: 'Structured Data',
  }
  // If the server already sent a human-readable name (not a slug), use it as-is
  if (sourceMap[source]) return sourceMap[source]
  return source  // already resolved by backend
}

/**
 * Render markdown as HTML (basic markdown support)
 * @param {string} markdown - Markdown text
 * @returns {React.ReactNode} HTML elements
 */
export const renderMarkdown = (markdown) => {
  if (!markdown) return null

  const parseRecordLine = (line) => {
    const content = line.replace(/^\s*-\s*/, '').trim()
    if (!content.includes(':') || !content.includes('|')) return null

    const row = {}
    const entries = content.split('|')

    for (const entry of entries) {
      const part = entry.trim()
      const separatorIndex = part.indexOf(':')
      if (separatorIndex <= 0) continue

      const key = part.slice(0, separatorIndex).trim()
      const value = part.slice(separatorIndex + 1).trim()
      if (!key) continue
      row[key] = value
    }

    return Object.keys(row).length > 0 ? row : null
  }

  const formatHeader = (header) => {
    return header
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  // Split by lines and process
  const lines = markdown.split('\n')
  const elements = []
  let codeBlock = false
  let currentList = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Handle matching records block as a table
    if (/^here are the matching records:?$/i.test(trimmedLine)) {
      const rows = []
      const headers = []
      let j = i + 1

      while (j < lines.length) {
        const candidate = lines[j].trim()

        if (!candidate) {
          j += 1
          continue
        }

        if (candidate === '---' || candidate.startsWith('**📚')) break
        if (!candidate.startsWith('-')) break

        const parsedRow = parseRecordLine(candidate)
        if (!parsedRow) break

        Object.keys(parsedRow).forEach((key) => {
          if (!headers.includes(key)) headers.push(key)
        })
        rows.push(parsedRow)
        j += 1
      }

      if (rows.length > 0 && headers.length > 0) {
        elements.push(
          <p key={`records-title-${i}`} style={{ margin: '0.5em 0', lineHeight: '1.6' }}>
            <strong>Here are the matching records:</strong>
          </p>
        )
        elements.push(
          <div key={`records-table-${i}`} className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th key={`header-${header}`}>{formatHeader(header)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={`row-${rowIndex}`}>
                    {headers.map((header) => (
                      <td key={`cell-${rowIndex}-${header}`}>{row[header] || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        i = j - 1
        continue
      }
    }
    
    // Handle Markdown pipe tables (| col | col | format)
    if (trimmedLine.startsWith('|') && trimmedLine.endsWith('|')) {
      const tableLines = []
      let j = i
      while (j < lines.length) {
        const tl = lines[j].trim()
        if (!tl.startsWith('|')) break
        tableLines.push(tl)
        j++
      }

      if (tableLines.length >= 2) {
        const parseRow = (row) =>
          row
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim())

        const headerCells = parseRow(tableLines[0])
        // tableLines[1] is the separator (--- row) — skip it
        const bodyRows = tableLines.slice(2).map(parseRow)

        elements.push(
          <div key={`pipe-table-${i}`} className="records-table-wrapper">
            <table className="records-table">
              <thead>
                <tr>
                  {headerCells.map((cell, ci) => (
                    <th key={`ph-${i}-${ci}`}>{cell}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => (
                  <tr key={`pr-${i}-${ri}`}>
                    {headerCells.map((_, ci) => (
                      <td key={`pc-${i}-${ri}-${ci}`}>{row[ci] !== undefined ? row[ci] : '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        i = j - 1
        continue
      }
    }

    // Handle code blocks
    if (line.startsWith('```')) {
      codeBlock = !codeBlock
      continue
    }
    
    if (codeBlock) {
      elements.push(
        <pre key={`code-${i}`} style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {line}
        </pre>
      )
      continue
    }
    
    // Handle horizontal rules
    if (trimmedLine === '---') {
      elements.push(<hr key={`hr-${i}`} style={{ margin: '1em 0', opacity: 0.3 }} />)
      continue
    }
    
    // Handle headers
    if (line.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`}>{line.slice(2)}</h1>)
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`}>{line.slice(3)}</h2>)
      continue
    }
    if (line.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`}>{line.slice(4)}</h3>)
      continue
    }
    
    // Handle bold
    if (line.includes('**')) {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      elements.push(
        <p key={`p-${i}`}>
          {parts.map((part, idx) => (
            idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part
          ))}
        </p>
      )
      continue
    }
    
    // Handle lists
    if (line.startsWith('\n')) {
      // Skip empty lines
      continue
    }
    
    if (line.match(/^\d+\.\s/)) {
      currentList.push(line.replace(/^\d+\.\s/, '').trim())
      continue
    }
    
    // Flush list if we hit a non-list line
    if (currentList.length > 0) {
      elements.push(
        <ol key={`list-${i}`} style={{ margin: '0.5em 0', paddingLeft: '1.5em' }}>
          {currentList.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ol>
      )
      currentList = []
    }
    
    // Handle text paragraphs
    if (line.trim()) {
      elements.push(
        <p key={`p-${i}`} style={{ margin: '0.5em 0', lineHeight: '1.6' }}>
          {line}
        </p>
      )
    }
  }
  
  // Flush remaining list
  if (currentList.length > 0) {
    elements.push(
      <ol key="final-list" style={{ margin: '0.5em 0', paddingLeft: '1.5em' }}>
        {currentList.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ol>
    )
  }
  
  return elements
}
