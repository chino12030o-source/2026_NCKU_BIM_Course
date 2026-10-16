import { useEffect, useState, useMemo } from 'react'
import { listIssues, getIssue, patchIssue, createIssue } from './api.js'

const STATUS = ['', 'open', 'in_progress', 'closed']
const STATUS_LABEL = { '': '全部', open: '待處理', in_progress: '處理中', closed: '已完成' }

export default function App() {
  const [filter, setFilter] = useState('')
  const [issues, setIssues] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [err, setErr] = useState('')
  const [openGroups, setOpenGroups] = useState({}) // { [modelName]: boolean }
  const [showArchived, setShowArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  async function refresh(f = filter, a = showArchived) {
    try {
      setIsRefreshing(true)
      setErr('')
      const data = await listIssues(f, a ? 'all' : '')
      setIssues(data)
    } catch (e) {
      setErr('後端連不上（請確認 go run ./backend 正在執行）：' + e.message)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    refresh(filter, showArchived)
  }, [filter, showArchived])

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null)
      return
    }
    getIssue(selectedId)
      .then(setDetail)
      .catch((e) => setErr(String(e.message || e)))
  }, [selectedId])

  async function onPatch(status) {
    if (selectedId == null) return
    try {
      const updated = await patchIssue(selectedId, { status })
      setDetail(updated)
      refresh()
    } catch (e) {
      setErr('更新狀態失敗: ' + (e.message || e))
    }
  }

  async function onToggleArchive() {
    if (selectedId == null || !detail) return
    try {
      const updated = await patchIssue(selectedId, { archived: !detail.archived })
      setDetail(updated)
      refresh()
    } catch (e) {
      setErr('封存操作失敗: ' + (e.message || e))
    }
  }

  async function onCreate(e) {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData(e.target)
    try {
      const created = await createIssue(fd)
      e.target.reset()
      setShowCreateModal(false)
      await refresh()
      setSelectedId(created.id)
    } catch (ex) {
      setErr(String(ex.message || ex))
    } finally {
      setIsSubmitting(false)
    }
  }

  // 計算各狀態數量
  const statusCounts = useMemo(() => {
    const counts = { '': issues.length, open: 0, in_progress: 0, closed: 0 }
    for (const it of issues) {
      if (counts[it.status] !== undefined) {
        counts[it.status]++
      }
    }
    return counts
  }, [issues])

  // 搜尋與模型分組
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues
    const q = searchQuery.toLowerCase()
    return issues.filter((it) => {
      const title = (it.title || '').toLowerCase()
      const desc = (it.description || '').toLowerCase()
      const rep = (it.reporter || '').toLowerCase()
      const view = (it.view_name || '').toLowerCase()
      const elem = String(it.revit_element_id || '')
      const id = String(it.id || '')
      return (
        title.includes(q) ||
        desc.includes(q) ||
        rep.includes(q) ||
        view.includes(q) ||
        elem.includes(q) ||
        id.includes(q)
      )
    })
  }, [issues, searchQuery])

  const groups = useMemo(() => {
    const gMap = {}
    for (const it of filteredIssues) {
      const g = it.model_name || '未指定模型'
      if (!gMap[g]) gMap[g] = []
      gMap[g].push(it)
    }
    return gMap
  }, [filteredIssues])

  return (
    <div className="app-container">
      {/* 頂部導航欄 */}
      <header className="top-navbar">
        <div className="brand">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18" />
              <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
              <path d="M9 9h1" /><path d="M9 13h1" /><path d="M9 17h1" />
              <path d="M14 9h1" /><path d="M14 13h1" /><path d="M14 17h1" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="brand-title">RFI 議題追蹤圖台</span>
              <span className="brand-badge">NCKU BIM 2026</span>
            </div>
          </div>
        </div>

        <div className="nav-actions">
          <div className="status-indicator">
            <span className="status-dot"></span>
            後端服務連線中 (:8080)
          </div>
          <button
            className="btn"
            onClick={() => refresh()}
            title="重新整理"
            style={{ padding: '7px 12px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            重整
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            手動建立議題
          </button>
        </div>
      </header>

      {/* 主工作區 */}
      <div className="main-layout">
        {/* 左側邊欄：議題列表 */}
        <aside className="sidebar">
          <div className="sidebar-header">
            {/* 搜尋欄 */}
            <div className="search-box">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="搜尋議題、元件 ID 或回報人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 狀態切換頁籤 */}
            <div className="filter-tabs">
              {STATUS.map((s) => (
                <button
                  key={s}
                  className={`filter-tab ${filter === s ? 'active' : ''}`}
                  onClick={() => setFilter(s)}
                >
                  <span>{STATUS_LABEL[s]}</span>
                  <span className="tab-badge">{statusCounts[s]}</span>
                </button>
              ))}
            </div>

            <div className="sidebar-controls">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                />
                顯示已封存項目
              </label>
              <span>共 {filteredIssues.length} 筆</span>
            </div>
          </div>

          {err && (
            <div style={{ margin: '12px 16px', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12.5, color: '#dc2626' }}>
              ⚠️ {err}
            </div>
          )}

          {/* 議題樹狀清單 */}
          <div className="issues-scroll-area">
            {filteredIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8', fontSize: 13 }}>
                無符合條件的議題
              </div>
            ) : (
              Object.entries(groups).map(([g, items]) => {
                const isGroupOpen = openGroups[g] !== false
                return (
                  <div key={g} className="model-group">
                    <div
                      className="model-group-header"
                      onClick={() => setOpenGroups({ ...openGroups, [g]: !isGroupOpen })}
                    >
                      <div className="model-name">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isGroupOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#64748b' }}>
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                        <span>{g}</span>
                      </div>
                      <span className="issue-count">{items.length}</span>
                    </div>

                    {isGroupOpen && (
                      <div>
                        {items.map((it) => {
                          const isSelected = selectedId === it.id
                          return (
                            <div
                              key={it.id}
                              className={`issue-card ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedId(it.id)}
                            >
                              <div className="card-top">
                                <span className="issue-id-badge">#{it.id}</span>
                                <span className="card-title">{it.title}</span>
                              </div>

                              <div className="card-badges">
                                <span className={`badge ${it.status}`}>
                                  {STATUS_LABEL[it.status]}
                                </span>
                                {it.source && (
                                  <span className="badge source">
                                    {it.source.toUpperCase()}
                                  </span>
                                )}
                                {it.archived && (
                                  <span className="badge archived">已封存</span>
                                )}
                              </div>

                              <div className="card-meta">
                                {it.reporter && (
                                  <div className="meta-item">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                      <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <span>{it.reporter}</span>
                                  </div>
                                )}
                                {it.view_name && (
                                  <div className="meta-item" title={`視圖：${it.view_name}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {it.view_name}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* 右側：議題詳情面板 */}
        <main className="detail-area">
          {!detail ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#334155' }}>尚未選取議題</h3>
              <p style={{ fontSize: 13.5, color: '#64748b', maxWidth: 360, textAlign: 'center' }}>
                請從左側列表選擇一筆議題，即可檢視模型構件、綁定位置與 Revit 視圖截圖。
              </p>
            </div>
          ) : (
            <div className="detail-container">
              {/* 詳情頂部資訊卡 */}
              <div className="detail-header-card">
                <div className="detail-header-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="issue-id-badge" style={{ fontSize: 13, padding: '3px 8px' }}>
                      #{detail.id}
                    </span>
                    <h2 className="detail-title">{detail.title}</h2>
                  </div>
                  <span className={`badge ${detail.status}`} style={{ fontSize: 13, padding: '4px 10px' }}>
                    {STATUS_LABEL[detail.status]}
                  </span>
                </div>

                {detail.description && (
                  <div className="detail-desc">
                    {detail.description}
                  </div>
                )}
              </div>

              {/* 元件與模型屬性資訊網格 */}
              <div className="info-grid">
                <div className="info-card">
                  <span className="info-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /></svg>
                    所屬模型檔案
                  </span>
                  <span className="info-value">{detail.model_name || '未分類'}</span>
                </div>

                <div className="info-card">
                  <span className="info-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                    Revit 視圖名稱
                  </span>
                  <span className="info-value">{detail.view_name || '無指定視圖'}</span>
                </div>

                <div className="info-card">
                  <span className="info-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    Revit Element ID
                  </span>
                  <span className="info-value">
                    {detail.revit_element_id ? (
                      <span className="info-code">{detail.revit_element_id}</span>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                <div className="info-card">
                  <span className="info-label">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    回報人員
                  </span>
                  <span className="info-value">{detail.reporter || '匿名'}</span>
                </div>
              </div>

              {/* 截圖預覽區域 */}
              <div className="screenshot-section">
                <div className="screenshot-header">
                  <span>模型視圖截圖 (Revit View Snapshot)</span>
                  {detail.screenshot && (
                    <a
                      href={`/screenshots/${detail.screenshot}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn"
                      style={{ fontSize: 12, padding: '4px 10px' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      查看原始大圖
                    </a>
                  )}
                </div>

                {detail.screenshot ? (
                  <div className="screenshot-img-wrapper">
                    <img
                      src={`/screenshots/${detail.screenshot}`}
                      alt="Revit Screenshot"
                      className="screenshot-img"
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: 13, background: '#f8fafc', borderRadius: 8 }}>
                    此議題無夾帶截圖
                  </div>
                )}
              </div>

              {/* 狀態切換與操作列 */}
              <div className="action-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>議題狀態流程：</span>
                  <div className="status-buttons">
                    <button
                      className="btn btn-open"
                      onClick={() => onPatch('open')}
                      disabled={detail.status === 'open'}
                    >
                      退回待處理
                    </button>
                    <button
                      className="btn btn-prog"
                      onClick={() => onPatch('in_progress')}
                      disabled={detail.status === 'in_progress'}
                    >
                      進行處理中
                    </button>
                    <button
                      className="btn btn-closed"
                      onClick={() => onPatch('closed')}
                      disabled={detail.status === 'closed'}
                    >
                      標記已解決
                    </button>
                  </div>
                </div>

                <button className="btn" onClick={onToggleArchive}>
                  {detail.archived ? '從封存還原' : '封存議題'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 手動建立議題 Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">手動建立 RFI 議題</h3>
              <button
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', fontSize: 20 }}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={onCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">議題標題 *</label>
                  <input
                    name="title"
                    className="form-input"
                    placeholder="請輸入議題簡要標題（例如：管線與樑碰撞）"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">詳細說明</label>
                  <textarea
                    name="description"
                    className="form-textarea"
                    placeholder="說明碰撞位置、改善建議或特殊需求..."
                    rows={3}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">回報人</label>
                    <input name="reporter" className="form-input" placeholder="例如：chino12030o" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Revit ElementId</label>
                    <input name="revit_element_id" className="form-input" placeholder="例如：1240472" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">IFC GlobalId（選填）</label>
                  <input name="ifc_global_id" className="form-input" placeholder="例如：3b$eX4..." />
                </div>

                <div className="form-group">
                  <label className="form-label">附加視圖截圖</label>
                  <input type="file" name="screenshot" accept="image/*" className="form-input" style={{ padding: '6px' }} />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '送出中...' : '建立議題'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
