import { useEffect, useState, useMemo } from 'react'
import { listIssues, getIssue, patchIssue, createIssue } from './api.js'

const STATUS = ['', 'open', 'in_progress', 'closed']
const STATUS_LABEL = { '': '全部議題', open: '待處理', in_progress: '處理中', closed: '已結案' }

// ── Potion Craft 風格木刻草藥學插畫圖標 (Woodcut Botanical & Alchemical SVGs) ──

// 草藥葉片 (Herb Leaf Sprig)
const HerbSprigIcon = ({ size = 16, color = '#341e0f' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22C12 14 16 9 20 7C20 11 17 17 12 22Z" fill="#56784d" fillOpacity="0.4" />
    <path d="M12 22C12 15 8 11 4 10C4 14 7 19 12 22Z" fill="#56784d" fillOpacity="0.4" />
    <path d="M12 22V3" />
    <path d="M12 7C14 5 17 4 19 4C17 7 15 9 12 11" fill="#739967" fillOpacity="0.3" />
    <path d="M12 12C9 10 7 9 5 9C7 12 9 14 12 15" fill="#739967" fillOpacity="0.3" />
  </svg>
)

// 藥水燒瓶 / 蒸餾瓶 (Alembic Retort Flask)
const PotionFlaskIcon = ({ size = 20, color = '#341e0f' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 2v5.5L4.5 18A3 3 0 0 0 7.1 22h9.8a3 3 0 0 0 2.6-4L14 7.5V2h-4Z" />
    <line x1="8" y1="2" x2="16" y2="2" strokeWidth="2.2" />
    <path d="M6 16c1.5-1 3.5 1 6 0s4 1 6 0l1 3.5A2.5 2.5 0 0 1 16.5 21H7.5A2.5 2.5 0 0 1 5 19.5L6 16Z" fill="#56784d" fillOpacity="0.35" />
    <circle cx="10" cy="18" r="1" fill="#341e0f" />
    <circle cx="14" cy="17" r="1.2" fill="#341e0f" />
  </svg>
)

// 木刻版畫花朵 (Woodcut Blossom)
const WoodcutFlowerIcon = ({ size = 16, color = '#341e0f' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" fill="#c99339" fillOpacity="0.5" />
    <circle cx="12" cy="6" r="3" fill="#f4ecd7" />
    <circle cx="17.5" cy="9.5" r="3" fill="#f4ecd7" />
    <circle cx="16" cy="16.5" r="3" fill="#f4ecd7" />
    <circle cx="8" cy="16.5" r="3" fill="#f4ecd7" />
    <circle cx="6.5" cy="9.5" r="3" fill="#f4ecd7" />
    <circle cx="12" cy="12" r="1.5" fill="#341e0f" />
  </svg>
)

// Potion Craft 藤蔓裝飾分界線 (Botanical Vine Divider)
const PotionCraftDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, margin: '10px 0', opacity: 0.85 }}>
    <svg width="90" height="14" viewBox="0 0 90 14" fill="none">
      <path d="M0 7 C25 7, 30 2, 45 7 C60 12, 65 7, 85 7" stroke="#6b4425" strokeWidth="1.4" />
      <circle cx="85" cy="7" r="2" fill="#56784d" />
      <path d="M30 5 C32 2, 38 3, 36 6" fill="#56784d" stroke="#341e0f" strokeWidth="1" />
    </svg>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <WoodcutFlowerIcon size={18} />
    </div>
    <svg width="90" height="14" viewBox="0 0 90 14" fill="none">
      <circle cx="5" cy="7" r="2" fill="#56784d" />
      <path d="M5 7 C25 7, 30 12, 45 7 C60 2, 65 7, 90 7" stroke="#6b4425" strokeWidth="1.4" />
      <path d="M60 9 C58 12, 52 11, 54 8" fill="#56784d" stroke="#341e0f" strokeWidth="1" />
    </svg>
  </div>
)

export default function App() {
  const [filter, setFilter] = useState('')
  const [issues, setIssues] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [err, setErr] = useState('')
  const [openGroups, setOpenGroups] = useState({})
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
      setErr('後端連不上（請確認 go run . 正在 :8080 執行）：' + e.message)
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

  const statusCounts = useMemo(() => {
    const counts = { '': issues.length, open: 0, in_progress: 0, closed: 0 }
    for (const it of issues) {
      if (counts[it.status] !== undefined) {
        counts[it.status]++
      }
    }
    return counts
  }, [issues])

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
      const g = it.model_name || '未分類模型'
      if (!gMap[g]) gMap[g] = []
      gMap[g].push(it)
    }
    return gMap
  }, [filteredIssues])

  return (
    <div className="app-container">
      {/* ── 頂部導覽列：Potion Craft 風格中世紀版畫橫幅 ── */}
      <header className="top-navbar">
        <div className="brand">
          <div className="brand-icon-wrapper" title="BIM 議題工坊">
            <PotionFlaskIcon size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="brand-title">RFI 議題追蹤圖台</span>
              <span className="brand-badge">NCKU BIM 2026</span>
            </div>
            <div className="brand-subtitle">
              <span>🌿</span>
              <span>建築資訊模型協作與議題流轉管理系統</span>
            </div>
          </div>
        </div>

        <div className="nav-actions">
          <div className="status-indicator">
            <span className="status-dot"></span>
            後端通訊在線 (:8080)
          </div>
          <button
            className="btn"
            onClick={() => refresh()}
            title="重新整理資料庫"
          >
            <svg 
              width="13" 
              height="13" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            重整
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <HerbSprigIcon size={16} color="#ffffff" />
            手動建立議題
          </button>
        </div>
      </header>

      {/* ── 主工作區 ── */}
      <div className="main-layout">
        {/* 左側邊欄：Potion Craft 背包手抄本欄位 */}
        <aside className="sidebar">
          <div className="sidebar-header">
            {/* 搜尋框 */}
            <div className="search-box">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="搜尋議題、元件或回報人..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 狀態切換頁籤：仿 Potion Craft 書籤印章分頁 */}
            <div className="filter-tabs">
              {STATUS.map((s) => (
                <button
                  key={s}
                  className={`filter-tab ${filter === s ? 'active' : ''}`}
                  onClick={() => setFilter(s)}
                >
                  <span>
                    {s === 'open' && '🌼 '}
                    {s === 'in_progress' && '⚗️ '}
                    {s === 'closed' && '🧪 '}
                    {s === '' && '📜 '}
                    {STATUS_LABEL[s]}
                  </span>
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
                顯示封存項目
              </label>
              <span>共收錄 {filteredIssues.length} 則議題</span>
            </div>
          </div>

          {err && (
            <div style={{ margin: '12px 16px', padding: '10px 14px', background: '#fae3e3', border: '1.8px solid #8f3e3e', borderRadius: 4, fontSize: 12.5, color: '#682020', fontWeight: 600 }}>
              ⚠️ {err}
            </div>
          )}

          {/* 議題樹狀卡片清單 (仿 Potion Craft 標本抽屜格子) */}
          <div className="issues-scroll-area">
            {filteredIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--pc-ink-muted)', fontSize: 13.5, fontStyle: 'italic' }}>
                目前無相符的議題紀錄
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
                        <svg 
                          width="13" 
                          height="13" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2.4" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          style={{ transform: isGroupOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <HerbSprigIcon size={14} />
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
                                  {it.status === 'open' && '🌼 '}
                                  {it.status === 'in_progress' && '⚗️ '}
                                  {it.status === 'closed' && '✓ '}
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
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                      <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <span>{it.reporter}</span>
                                  </div>
                                )}
                                {it.view_name && (
                                  <div className="meta-item" title={`視圖：${it.view_name}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="12" cy="12" r="3" />
                                      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
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

        {/* ── 右側：Potion Craft 手抄食譜書與工作台 ── */}
        <main className="detail-area">
          {/* 背景浮水印：木刻版畫樹紋 */}
          <svg className="woodcut-watermark" viewBox="0 0 200 200" fill="none" stroke="#6b4425" strokeWidth="1.2">
            <path d="M100 180 V90 C100 60, 70 40, 50 30 M100 90 C100 60, 130 40, 150 30 M100 120 C80 100, 60 95, 40 95 M100 110 C120 95, 140 90, 160 90" />
            <circle cx="50" cy="30" r="15" fill="#56784d" fillOpacity="0.2" />
            <circle cx="150" cy="30" r="15" fill="#56784d" fillOpacity="0.2" />
            <circle cx="40" cy="95" r="12" fill="#56784d" fillOpacity="0.2" />
            <circle cx="160" cy="90" r="12" fill="#56784d" fillOpacity="0.2" />
          </svg>

          {!detail ? (
            <div className="empty-state">
              <div className="empty-icon-aureole">
                <PotionFlaskIcon size={46} />
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 21, fontWeight: 700, color: 'var(--pc-ink-dark)' }}>
                請選取一則議題查閱詳情
              </h3>
              <p style={{ fontSize: 14, color: 'var(--pc-ink-muted)', maxWidth: 430, textAlign: 'center', lineHeight: 1.8 }}>
                點選左側清單中的議題項目，即可查閱與 BIM 模型構件綁定的空間定位、視圖與外掛截圖。
              </p>
              <PotionCraftDivider />
            </div>
          ) : (
            <div className="detail-container">
              {/* 詳情手抄本主頁面 */}
              <div className="detail-header-card">
                <div className="detail-header-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="issue-id-badge" style={{ fontSize: 13, padding: '3px 8px' }}>
                      #{detail.id}
                    </span>
                    <h2 className="detail-title">{detail.title}</h2>
                  </div>
                  <span className={`badge ${detail.status}`} style={{ fontSize: 13, padding: '4px 12px' }}>
                    {STATUS_LABEL[detail.status]}
                  </span>
                </div>

                <PotionCraftDivider />

                {detail.description && (
                  <div className="detail-desc">
                    {detail.description}
                  </div>
                )}
              </div>

              {/* 構件與模型屬性資訊網格 (抽屜標本盒) */}
              <div className="info-grid">
                <div className="info-card">
                  <span className="info-label">
                    <HerbSprigIcon size={14} />
                    所屬模型檔案
                  </span>
                  <span className="info-value">{detail.model_name || '未分類'}</span>
                </div>

                <div className="info-card">
                  <span className="info-label">
                    <WoodcutFlowerIcon size={14} />
                    Revit 視圖名稱
                  </span>
                  <span className="info-value">{detail.view_name || '無指定視圖'}</span>
                </div>

                <div className="info-card">
                  <span className="info-label">
                    <HerbSprigIcon size={14} />
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
                    <WoodcutFlowerIcon size={14} />
                    回報人員
                  </span>
                  <span className="info-value">{detail.reporter || '匿名'}</span>
                </div>
              </div>

              {/* 截圖木刻雕花框 */}
              <div className="screenshot-section">
                <div className="screenshot-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <HerbSprigIcon size={16} />
                    模型視角截圖 (Revit View Snapshot)
                  </span>
                  {detail.screenshot && (
                    <a
                      href={`/screenshots/${detail.screenshot}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn"
                      style={{ fontSize: 12, padding: '4px 10px' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      檢視原始高清圖
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
                  <div style={{ textAlign: 'center', padding: '36px', color: 'var(--pc-ink-muted)', fontSize: 13.5, background: '#ede1c4', borderRadius: 4, fontStyle: 'italic', border: '1px dashed var(--pc-ink-border)' }}>
                    此議題未夾帶模型視圖截圖
                  </div>
                )}
              </div>

              {/* 操作工作列 */}
              <div className="action-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13.5, fontWeight: 700, color: 'var(--pc-ink-dark)' }}>
                    議題流轉狀態：
                  </span>
                  <div className="status-buttons">
                    <button
                      className="btn btn-open"
                      onClick={() => onPatch('open')}
                      disabled={detail.status === 'open'}
                    >
                      🌼 標記待處理
                    </button>
                    <button
                      className="btn btn-prog"
                      onClick={() => onPatch('in_progress')}
                      disabled={detail.status === 'in_progress'}
                    >
                      ⚗️ 設為處理中
                    </button>
                    <button
                      className="btn btn-closed"
                      onClick={() => onPatch('closed')}
                      disabled={detail.status === 'closed'}
                    >
                      ✓ 標記已結案
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

      {/* ── 手動登記 RFI 議題 Modal ── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <HerbSprigIcon size={18} />
                手動登記 RFI 議題
              </h3>
              <button
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--pc-ink-dark)', fontSize: 20, fontWeight: 700 }}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={onCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">議題名稱 *</label>
                  <input
                    name="title"
                    className="form-input"
                    placeholder="請輸入議題主旨（例如：3F 機電管線與大樑干涉）"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">細節說明與工程備註</label>
                  <textarea
                    name="description"
                    className="form-textarea"
                    placeholder="描述衝突構件位置、標高或建議修改方向..."
                    rows={3}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">回報者</label>
                    <input name="reporter" className="form-input" placeholder="例如：chino12030o" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Revit Element ID</label>
                    <input name="revit_element_id" className="form-input" placeholder="例如：1240472" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">IFC Global ID（選填）</label>
                  <input name="ifc_global_id" className="form-input" placeholder="例如：3b$eX4..." />
                </div>

                <div className="form-group">
                  <label className="form-label">夾帶視角截圖</label>
                  <input type="file" name="screenshot" accept="image/*" className="form-input" style={{ padding: '6px' }} />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消返回
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '登記送出中...' : '確認建立議題'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
