import { useEffect, useState, useMemo } from 'react'
import { listIssues, getIssue, patchIssue, createIssue } from './api.js'

const STATUS = ['', 'open', 'in_progress', 'closed']
const STATUS_LABEL = { 
  '': '全部法案', 
  open: '待調配', 
  in_progress: '蒸餾中', 
  closed: '已煉成' 
}

// ── 魔法陣背景與中世紀煉金術幾何圖騰 (Sacred Geometry & Magic Circles) ──
const MagicCircleBackground = () => (
  <svg 
    className="magic-circle-bg" 
    viewBox="0 0 600 600" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 最外層符文與虛線環 */}
    <circle cx="300" cy="300" r="290" stroke="#bef264" strokeWidth="1" strokeDasharray="4 8" opacity="0.35" />
    <circle cx="300" cy="300" r="280" stroke="#d4af37" strokeWidth="1.8" opacity="0.5" />
    <circle cx="300" cy="300" r="268" stroke="#a3e635" strokeWidth="1" strokeDasharray="12 4 2 4" opacity="0.6" />
    
    {/* 12 方位星芒點位 */}
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
      <g key={deg} transform={`rotate(${deg} 300 300)`}>
        <line x1="300" y1="12" x2="300" y2="32" stroke="#bef264" strokeWidth="1.5" opacity="0.8" />
        <circle cx="300" cy="24" r="2.5" fill="#d4af37" />
        <circle cx="300" cy="33" r="1.5" fill="#bef264" />
      </g>
    ))}

    {/* 中層大同心環 */}
    <circle cx="300" cy="300" r="240" stroke="#d4af37" strokeWidth="1.2" opacity="0.45" />
    <circle cx="300" cy="300" r="226" stroke="#bef264" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />

    {/* 煉金術雙互錯正六角星 (Solomon's Transmutation Hexagram) */}
    <polygon 
      points="300,74 496,413 104,413" 
      stroke="#bef264" 
      strokeWidth="1.5" 
      opacity="0.6" 
    />
    <polygon 
      points="300,526 104,187 496,187" 
      stroke="#d4af37" 
      strokeWidth="1.5" 
      opacity="0.6" 
    />

    {/* 八角方陣輪轉 (Sacred Octagon) */}
    <rect x="145" y="145" width="310" height="310" stroke="#a3e635" strokeWidth="1" opacity="0.3" />
    <rect x="145" y="145" width="310" height="310" stroke="#d4af37" strokeWidth="1" opacity="0.3" transform="rotate(45 300 300)" />

    {/* 內同心環與古代元素印記輪環 */}
    <circle cx="300" cy="300" r="162" stroke="#bef264" strokeWidth="1.2" strokeDasharray="6 3" opacity="0.7" />
    <circle cx="300" cy="300" r="148" stroke="#d4af37" strokeWidth="1.6" opacity="0.75" />

    {/* 核心五芒星與煉金幾何 (Alchemical Pentagram) */}
    <polygon 
      points="300,152 334,258 445,258 355,324 389,430 300,364 211,430 245,324 155,258 266,258" 
      stroke="#bef264" 
      strokeWidth="1.4" 
      fill="rgba(190, 242, 100, 0.02)" 
      opacity="0.8" 
    />

    {/* 核心秘儀之眼 (Alembic Core Sigil) */}
    <circle cx="300" cy="300" r="62" stroke="#d4af37" strokeWidth="1.8" opacity="0.85" />
    <circle cx="300" cy="300" r="52" stroke="#bef264" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
    <circle cx="300" cy="300" r="22" fill="#bef264" fillOpacity="0.2" stroke="#bef264" strokeWidth="2" />
    <circle cx="300" cy="300" r="8" fill="#d4af37" />

    {/* 四象古代幾何標記 (Fire, Water, Air, Earth) */}
    <polygon points="300,105 315,130 285,130" stroke="#bef264" strokeWidth="1.2" opacity="0.7" /> {/* Fire */}
    <polygon points="300,495 285,470 315,470" stroke="#d4af37" strokeWidth="1.2" opacity="0.7" /> {/* Water */}
    <polygon points="105,300 130,285 130,315" stroke="#a3e635" strokeWidth="1.2" opacity="0.7" /> {/* Air */}
    <polygon points="495,300 470,315 470,285" stroke="#bef264" strokeWidth="1.2" opacity="0.7" /> {/* Earth */}
  </svg>
)

// ── 中世紀蒸餾瓶 / 藥水試劑圖標 (Alembic Retort & Potion Flasks) ──
const PotionFlaskIcon = ({ size = 20, glow = false }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    style={{ filter: glow ? 'drop-shadow(0 0 6px #bef264)' : 'none' }}
  >
    {/* 瓶身線條 */}
    <path 
      d="M10 2v5L4.5 17.5A3 3 0 0 0 7.1 22h9.8a3 3 0 0 0 2.6-4.5L14 7V2h-4Z" 
      stroke="#d4af37" 
      strokeWidth="1.6" 
      strokeLinejoin="round" 
    />
    <path d="M8.5 2h7" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
    {/* 黃綠色發光魔法藥水液面 */}
    <path 
      d="M5.6 16.2c1.4-1.2 3.8 0.8 6.4-0.2s3.6 1 6.4 0.2l1 2.3A2.5 2.5 0 0 1 16.9 21H7.1a2.5 2.5 0 0 1-2.5-2.5l1-2.3Z" 
      fill="rgba(190, 242, 100, 0.45)" 
      stroke="#bef264" 
      strokeWidth="1.2" 
    />
    {/* 藥水氣泡 */}
    <circle cx="10" cy="18.5" r="1.1" fill="#fff" opacity="0.85" />
    <circle cx="14.2" cy="17" r="1.3" fill="#bef264" opacity="0.9" />
    <circle cx="11.5" cy="14" r="0.8" fill="#d9f99d" />
  </svg>
)

// ── 賢者之石 / 煉成水晶圖標 (Philosopher's Crystal Sigil) ──
const CrystalSigilIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <polygon points="12 2 20 8.5 17 21 7 21 4 8.5" stroke="#7dd3fc" strokeWidth="1.6" strokeLinejoin="round" fill="rgba(56, 189, 248, 0.15)" />
    <line x1="12" y1="2" x2="12" y2="21" stroke="#38bdf8" strokeWidth="1.2" opacity="0.7" />
    <line x1="4" y1="8.5" x2="20" y2="8.5" stroke="#38bdf8" strokeWidth="1.2" opacity="0.7" />
    <polyline points="4 8.5 12 14 20 8.5" stroke="#7dd3fc" strokeWidth="1.2" />
    <polyline points="7 21 12 14 17 21" stroke="#7dd3fc" strokeWidth="1.2" />
  </svg>
)

// ── 原料試劑瓶圖標 (Raw Materia Flask) ──
const RawMateriaIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="7" y="6" width="10" height="15" rx="3" stroke="#facc15" strokeWidth="1.6" fill="rgba(250, 204, 21, 0.15)" />
    <line x1="9" y1="3" x2="15" y2="3" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
    <line x1="10" y1="3" x2="10" y2="6" stroke="#d4af37" strokeWidth="1.5" />
    <line x1="14" y1="3" x2="14" y2="6" stroke="#d4af37" strokeWidth="1.5" />
    <path d="M8 14h8" stroke="#fde047" strokeWidth="1.2" strokeDasharray="2 2" />
    <circle cx="12" cy="11" r="1.5" fill="#fde047" />
  </svg>
)

// ── 中世紀古典分界符印 (Medieval Alchemical Divider) ──
const AlchemicalDivider = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, margin: '12px 0', opacity: 0.85 }}>
    <svg width="100" height="14" viewBox="0 0 100 14" fill="none">
      <line x1="0" y1="7" x2="80" y2="7" stroke="#5c4714" strokeWidth="1" />
      <circle cx="15" cy="7" r="1.5" fill="#bef264" />
      <circle cx="45" cy="7" r="2" fill="#d4af37" />
      <polygon points="80,7 88,3 96,7 88,11" stroke="#d4af37" fill="#152019" strokeWidth="1" />
    </svg>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#bef264' }}>
      <span style={{ fontSize: 13, textShadow: '0 0 8px #a3e635' }}>🜔</span>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="#d4af37" strokeWidth="1.4" />
        <circle cx="12" cy="12" r="4" stroke="#bef264" strokeWidth="1.2" fill="rgba(190, 242, 100, 0.2)" />
        <line x1="12" y1="1" x2="12" y2="5" stroke="#bef264" strokeWidth="1.5" />
        <line x1="12" y1="19" x2="12" y2="23" stroke="#bef264" strokeWidth="1.5" />
        <line x1="1" y1="12" x2="5" y2="12" stroke="#bef264" strokeWidth="1.5" />
        <line x1="19" y1="12" x2="23" y2="12" stroke="#bef264" strokeWidth="1.5" />
      </svg>
      <span style={{ fontSize: 13, textShadow: '0 0 8px #a3e635' }}>🜍</span>
    </div>
    <svg width="100" height="14" viewBox="0 0 100 14" fill="none">
      <polygon points="4,7 12,3 20,7 12,11" stroke="#d4af37" fill="#152019" strokeWidth="1" />
      <circle cx="55" cy="7" r="2" fill="#d4af37" />
      <circle cx="85" cy="7" r="1.5" fill="#bef264" />
      <line x1="20" y1="7" x2="100" y2="7" stroke="#5c4714" strokeWidth="1" />
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
      setErr('煉金工坊後端儀軌中斷（請確認 go run . 在 :8080 運作）：' + e.message)
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
      setErr('轉換法印狀態失敗: ' + (e.message || e))
    }
  }

  async function onToggleArchive() {
    if (selectedId == null || !detail) return
    try {
      const updated = await patchIssue(selectedId, { archived: !detail.archived })
      setDetail(updated)
      refresh()
    } catch (e) {
      setErr('封印操作失敗: ' + (e.message || e))
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
      const g = it.model_name || '未分類古籍領域'
      if (!gMap[g]) gMap[g] = []
      gMap[g].push(it)
    }
    return gMap
  }, [filteredIssues])

  return (
    <div className="app-container">
      {/* ── 頂部導覽列：中世紀煉金術工坊 ── */}
      <header className="top-navbar">
        <div className="brand">
          <div className="brand-sigil" title="煉金術師秘儀印章">
            <PotionFlaskIcon size={26} glow />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="brand-title">煉金工坊・RFI 議題流轉儀軌</span>
              <span className="brand-badge">NCKU BIM 2026</span>
            </div>
            <div className="brand-subtitle">
              <span>⚗️</span>
              <span>BIM 建築資訊模型構件・藥水蒸餾萃取與流轉紀錄法典</span>
              <span>✦</span>
            </div>
          </div>
        </div>

        <div className="nav-actions">
          <div className="status-indicator">
            <span className="status-dot"></span>
            秘儀連線中 (:8080)
          </div>
          <button
            className="btn"
            onClick={() => refresh()}
            title="感應秘庫更新"
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ transform: isRefreshing ? 'rotate(180deg)' : 'none', transition: 'transform 0.4s ease' }}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            感應重整
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <PotionFlaskIcon size={16} />
            刻寫新法案
          </button>
        </div>
      </header>

      {/* ── 主工作區 ── */}
      <div className="main-layout">
        {/* 左側：法典索引與議題清單 */}
        <aside className="sidebar">
          <div className="sidebar-header">
            {/* 符印搜尋框 */}
            <div className="search-box">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="搜尋法案秘記、構件印記或術士名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 煉金狀態分頁標籤 */}
            <div className="filter-tabs">
              {STATUS.map((s) => (
                <button
                  key={s}
                  className={`filter-tab ${filter === s ? 'active' : ''}`}
                  onClick={() => setFilter(s)}
                >
                  <span>
                    {s === 'open' && '🧪 '}
                    {s === 'in_progress' && '⚗️ '}
                    {s === 'closed' && '🔮 '}
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
                顯示封印項目
              </label>
              <span>收錄 {filteredIssues.length} 帖法案</span>
            </div>
          </div>

          {err && (
            <div style={{ margin: '12px 16px', padding: '10px 14px', background: '#261210', border: '1px solid #78281f', borderRadius: 8, fontSize: 12.5, color: '#fca5a5' }}>
              ⚠️ {err}
            </div>
          )}

          {/* 議題法典捲軸列表 */}
          <div className="issues-scroll-area">
            {filteredIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-parchment-muted)', fontSize: 13.5, fontStyle: 'italic' }}>
                秘庫中無相符之法案記載
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
                          style={{ transform: isGroupOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease', color: 'var(--gold-runic)' }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span style={{ color: 'var(--potion-green)' }}>🜔</span>
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
                                  {it.status === 'open' && '🧪 待調配'}
                                  {it.status === 'in_progress' && '⚗️ 蒸餾中'}
                                  {it.status === 'closed' && '🔮 已煉成'}
                                </span>
                                {it.source && (
                                  <span className="badge source">
                                    🜂 {it.source.toUpperCase()}
                                  </span>
                                )}
                                {it.archived && (
                                  <span className="badge archived">🜏 封印</span>
                                )}
                              </div>

                              <div className="card-meta">
                                {it.reporter && (
                                  <div className="meta-item" title={`撰寫術士：${it.reporter}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                      <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <span>{it.reporter}</span>
                                  </div>
                                )}
                                {it.view_name && (
                                  <div className="meta-item" title={`模型星象視圖：${it.view_name}`}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                      <circle cx="12" cy="12" r="3" />
                                      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                                    </svg>
                                    <span style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

        {/* ── 右側：煉金詳情祭壇 ── */}
        <main className="detail-area">
          {/* 背景旋轉魔法陣 */}
          <MagicCircleBackground />

          {!detail ? (
            <div className="empty-state">
              <div className="empty-sigil-altar">
                <PotionFlaskIcon size={52} glow />
              </div>
              <h3 style={{ fontFamily: 'var(--font-decorative)', fontSize: 22, fontWeight: 700, color: '#fff9ea', letterSpacing: 1.2 }}>
                請自法典中翻選一帖議題
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-parchment-muted)', maxWidth: 440, textAlign: 'center', lineHeight: 1.8 }}>
                點選左側法典清單中的項目，即可啟動幾何透視，查閱與 BIM 模型構件繫結的空間位標、截圖與流轉鍊態。
              </p>
              <AlchemicalDivider />
            </div>
          ) : (
            <div className="detail-container">
              {/* 詳情主頭部卡片 */}
              <div className="detail-header-card">
                <div className="detail-header-top">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="issue-id-badge" style={{ fontSize: 13.5, padding: '4px 12px' }}>
                      #{detail.id} 秘儀
                    </span>
                    <h2 className="detail-title">{detail.title}</h2>
                  </div>
                  <span className={`badge ${detail.status}`} style={{ fontSize: 13, padding: '5px 14px' }}>
                    {detail.status === 'open' && '🧪 待調配'}
                    {detail.status === 'in_progress' && '⚗️ 蒸餾萃取中'}
                    {detail.status === 'closed' && '🔮 賢者結案'}
                  </span>
                </div>

                <AlchemicalDivider />

                {detail.description && (
                  <div className="detail-desc">
                    {detail.description}
                  </div>
                )}
              </div>

              {/* 構件與模型屬性資訊網格 */}
              <div className="info-grid">
                <div className="info-card">
                  <span className="info-label">
                    <span>🜁</span>
                    所屬模型寶典
                  </span>
                  <span className="info-value">{detail.model_name || '未分類領域'}</span>
                </div>

                <div className="info-card">
                  <span className="info-label">
                    <span>🜂</span>
                    Revit 觀測視角
                  </span>
                  <span className="info-value">{detail.view_name || '無指定視圖'}</span>
                </div>

                <div className="info-card">
                  <span className="info-label">
                    <span>🜔</span>
                    Revit 構件印記 ID
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
                    <span>🜍</span>
                    紀錄術士
                  </span>
                  <span className="info-value">{detail.reporter || '匿名術士'}</span>
                </div>
              </div>

              {/* 截圖黑曜石透鏡 */}
              <div className="screenshot-section">
                <div className="screenshot-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--potion-green)' }}>✦</span>
                    模型透鏡顯影 (Revit View Snapshot)
                  </span>
                  {detail.screenshot && (
                    <a
                      href={`/screenshots/${detail.screenshot}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn"
                      style={{ fontSize: 12, padding: '5px 12px' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                      全屏檢視原圖
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
                  <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-parchment-muted)', fontSize: 13.5, background: '#090e0b', borderRadius: 8, fontStyle: 'italic', border: '1px dashed var(--border-grimoire)' }}>
                    此法案尚未注入模型透鏡截圖
                  </div>
                )}
              </div>

              {/* 操作轉移工作列 */}
              <div className="action-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontFamily: 'var(--font-runic)', fontSize: 13.5, fontWeight: 700, color: 'var(--gold-runic)', letterSpacing: 0.5 }}>
                    流轉狀態躍遷：
                  </span>
                  <div className="status-buttons">
                    <button
                      className="btn btn-open"
                      onClick={() => onPatch('open')}
                      disabled={detail.status === 'open'}
                      title="重設為待調配原質"
                    >
                      <RawMateriaIcon size={14} />
                      待調配
                    </button>
                    <button
                      className="btn btn-prog"
                      onClick={() => onPatch('in_progress')}
                      disabled={detail.status === 'in_progress'}
                      title="推進為蒸餾萃取處理中"
                    >
                      <PotionFlaskIcon size={14} />
                      蒸餾中
                    </button>
                    <button
                      className="btn btn-closed"
                      onClick={() => onPatch('closed')}
                      disabled={detail.status === 'closed'}
                      title="完成煉成結案"
                    >
                      <CrystalSigilIcon size={14} />
                      賢者結案
                    </button>
                  </div>
                </div>

                <button className="btn" onClick={onToggleArchive}>
                  {detail.archived ? '🜔 解除封印' : '🜏 封印入庫'}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── 刻寫新法案 Modal ── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                <PotionFlaskIcon size={20} />
                手動刻寫 RFI 議題法案
              </h3>
              <button
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gold-runic)', fontSize: 20 }}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={onCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">法案標題 (議題名稱) *</label>
                  <input
                    name="title"
                    className="form-input"
                    placeholder="例如：3F 機電管線與大樑碰撞干涉"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">秘術筆記 (細節說明與工程備註)</label>
                  <textarea
                    name="description"
                    className="form-textarea"
                    placeholder="記述衝突構件高程、法術干涉及建議協同修正方向..."
                    rows={3}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">紀錄術士 (回報者)</label>
                    <input name="reporter" className="form-input" placeholder="例如：chino12030o" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Revit 構件 ID</label>
                    <input name="revit_element_id" className="form-input" placeholder="例如：1240472" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">IFC 萬國秘鑰 (Global ID)</label>
                  <input name="ifc_global_id" className="form-input" placeholder="例如：3b$eX4..." />
                </div>

                <div className="form-group">
                  <label className="form-label">附錄顯影截圖 (Screenshot)</label>
                  <input type="file" name="screenshot" accept="image/*" className="form-input" style={{ padding: '6px' }} />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  作罷返回
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '符印鐫刻中...' : '鐫刻入庫'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
