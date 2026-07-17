export default function DataTable({ columns, rows, page, pages, total, onPageChange, onSearch, searchValue, actions }) {
  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between mb-3">
          <input
            type="text"
            className="form-control w-25"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => onSearch(e.target.value)}
          />
          <span className="text-muted small align-self-center">{total} total records</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                {actions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="text-center text-muted py-4">No records found</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                  ))}
                  {actions && <td>{actions(row)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <nav>
            <ul className="pagination pagination-sm justify-content-center mb-0">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <li key={p} className={'page-item ' + (p === page ? 'active' : '')}>
                  <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  )
}
