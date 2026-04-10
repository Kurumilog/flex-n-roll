"use client"

import { useState, useEffect, useMemo } from "react"
import { ExternalLink, Copy, CheckCircle2, User, Phone, Loader2, MapPin, Calendar, Activity, Search, Building2, ChevronRight, Edit2, Check, X, RefreshCw } from "lucide-react"

export default function ManagerPortal() {
  const [managers, setManagers] = useState<any[]>([])
  const [managerId, setManagerId] = useState<number>(13) 
  const [identifier, setIdentifier] = useState<string>("")
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null)
  const [editedPlanData, setEditedPlanData] = useState<any>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://kurumi.software/api"
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || "hackathon-secret-key-2024"

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${apiUrl}/tracking/manager/${managerId}`, {
        headers: { "x-api-key": apiKey }
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch(`${apiUrl}/tracking/manager/${managerId}/clients`, {
        headers: { "x-api-key": apiKey }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const fetchManagers = async () => {
    try {
      const res = await fetch(`${apiUrl}/employees/available`, {
        headers: { "x-api-key": apiKey }
      });
      if (res.ok) {
        const json = await res.json();
        setManagers(json.data.employees || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const [isSyncing, setIsSyncing] = useState(false);
  const handleSyncClients = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`${apiUrl}/sync/leads`, {
        method: "POST",
        headers: { "x-api-key": apiKey }
      });
      if (res.ok) {
        await fetchClients();
        alert("Мои клиенты успешно обновлены из Bitrix24!");
      } else {
        alert("Ошибка при вызове синхронизации");
      }
    } catch (e) {
      console.error(e);
      alert("Сетевая ошибка обновления");
    } finally {
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    fetchManagers();
  }, [apiUrl, apiKey]);

  useEffect(() => {
    fetchPlans();
    fetchClients();
  }, [managerId]);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/tracking/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey
        },
        body: JSON.stringify({ identifier, managerId })
      });
      
      if (res.ok) {
        await res.json();
        await fetchPlans();
        setIdentifier(""); // Reset after success
      } else {
        const error = await res.json();
        alert("Ошибка генерации: " + JSON.stringify(error));
      }
    } catch (e) {
      alert("Сетевая ошибка: " + String(e));
    } finally {
      setLoading(false);
    }
  }

  const handleSavePlan = async (id: string, trackingNumber: string) => {
    setSaveLoading(true);
    try {
      // Parse timeline if it's string
      let payload = { ...editedPlanData };
      if (typeof payload.timelineEvents === 'string') {
        try { payload.timelineEvents = JSON.parse(payload.timelineEvents); } 
        catch(e) { alert('Ошибка JSON в фазах!'); return; }
      }
      const res = await fetch(`${apiUrl}/tracking/${trackingNumber}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditingPlanId(null);
        await fetchPlans();
      }
    } catch (e) {
      alert("Ошибка при сохранении");
    } finally {
      setSaveLoading(false);
    }
  }

  const startEditing = (p: any) => {
    setEditingPlanId(p.id);
    setEditedPlanData({
      currentStatus: p.currentStatus,
      expectedDate: new Date(p.expectedDate).toISOString().split('T')[0],
      fromLocation: p.fromLocation,
      toLocation: p.toLocation,
      timelineEvents: JSON.stringify(p.timelineEvents || [], null, 2)
    });
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Смарт-поиск по клиентам
  const filteredClients = useMemo(() => {
    if (!identifier) return clients;
    const query = identifier.toLowerCase();
    return clients.filter(c => 
      (c.name?.toLowerCase() || "").includes(query) ||
      (c.company?.toLowerCase() || "").includes(query) ||
      (c.phone || "").includes(query) ||
      (c.email?.toLowerCase() || "").includes(query)
    );
  }, [clients, identifier]);

  // Генерация инициалов
  const getInitials = (name: string) => {
    if (!name) return "??";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 md:p-12 font-sans text-slate-900 selection:bg-blue-100">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/60 relative z-40">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Портал Менеджера</h1>
            <p className="text-slate-500 mt-1.5 text-sm md:text-base max-w-xl">
              Управляйте отправлениями ваших клиентов и генерируйте смарт-планы логистики через ИИ.
            </p>
          </div>
          
          <div className="relative min-w-[260px]">
            {/* Clickable Area Overlay to close dropdown when clicking outside could go here, but omitted for simplicity or handled via blur if possible. A better approach is a true Select, but we building standard React */}
            {isManagerDropdownOpen && (
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsManagerDropdownOpen(false)}
              />
            )}
            
            <button 
              onClick={() => setIsManagerDropdownOpen(!isManagerDropdownOpen)}
              className={`relative z-50 w-full flex items-center gap-3 bg-white p-2 pr-4 rounded-full border shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-blue-600/10 active:scale-[0.98] ${isManagerDropdownOpen ? 'border-blue-300 ring-4 ring-blue-600/10 shadow-md' : 'border-slate-200/80 hover:border-slate-300 hover:shadow-md'}`}
            >
              <div className="bg-blue-600 p-2 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="leading-tight flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 tracking-tight">
                    {managers.find(m => m.id === managerId)?.name || 'Галина'} {managers.find(m => m.id === managerId)?.lastName || 'Зиневич'}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isManagerDropdownOpen ? 'rotate-90' : ''}`} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">ID: {managerId}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isManagerDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-3 w-full bg-white rounded-2xl border border-slate-200/80 shadow-[0_20px_25px_-5px_rgb(0,0,0,0.1),0_8px_10px_-6px_rgb(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400/80">Выберите аккаунт</span>
                </div>
                <div className="max-h-[320px] overflow-y-auto p-1.5 flex flex-col gap-0.5">
                  {managers.length === 0 && (
                    <button className="flex items-center w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors" onClick={() => { setManagerId(13); setIsManagerDropdownOpen(false); }}>
                      <div className="font-bold text-[13px] text-slate-900">Галина Зиневич</div>
                    </button>
                  )}
                  {managers.map(m => (
                    <button 
                      key={m.id} 
                      onClick={() => { setManagerId(m.id); setIsManagerDropdownOpen(false); }}
                      className={`group flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-left transition-colors ${managerId === m.id ? 'bg-blue-50/80' : 'hover:bg-slate-50 active:bg-slate-100'}`}
                    >
                      <div>
                        <div className={`font-bold text-[13px] tracking-tight ${managerId === m.id ? 'text-blue-700' : 'text-slate-800 group-hover:text-blue-600'}`}>
                          {m.name} {m.lastName}
                        </div>
                        <div className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${managerId === m.id ? 'text-blue-400' : 'text-slate-400'}`}>
                          ID: {m.id}
                        </div>
                      </div>
                      {managerId === m.id && <CheckCircle2 className="w-[18px] h-[18px] text-blue-600 shadow-sm rounded-full" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Smart Search & Actions */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-[calc(100vh-12rem)] max-h-[800px] sticky top-8">
              
              {/* Input Header */}
              <div className="p-5 border-b border-slate-100 bg-white z-20">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Создать отправление</h2>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-[18px] w-[18px] text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  </div>
                  <input 
                    id="identifier" 
                    placeholder="Имя, телефон или компания..." 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 focus:bg-white transition-all"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="off"
                  />
                  {identifier && (
                    <button 
                      onClick={() => setIdentifier("")} 
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <span className="text-xs font-bold leading-none bg-slate-200 rounded-full h-5 w-5 flex items-center justify-center">×</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Clients List area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 bg-slate-50/30">
                <div className="px-3 pt-2 pb-2 flex justify-between items-center border-b border-slate-100/50 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Клиенты ({filteredClients.length})
                  </span>
                  <button 
                    onClick={handleSyncClients}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50/70 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 ring-1 ring-blue-600/10 shadow-sm"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} />
                    Обновить CRM
                  </button>
                </div>
                
                {filteredClients.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                      <User className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Клиенты не найдены</p>
                    <p className="text-xs text-slate-400 mt-1">Текст будет использован как новый идентификатор.</p>
                  </div>
                ) : (
                  filteredClients.map((c, idx) => {
                    const matchVal = c.phone || c.email || c.name;
                    const isActive = identifier && identifier.toLowerCase() === matchVal.toLowerCase();
                    
                    return (
                      <button 
                        key={idx}
                        onClick={() => setIdentifier(matchVal)}
                        className={`w-full text-left group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 
                          ${isActive 
                            ? "bg-blue-50 border-blue-200 shadow-[inset_0_2px_4px_rgba(59,130,246,0.05)] ring-1 ring-blue-600" 
                            : "bg-white border-white hover:bg-slate-50 hover:border-slate-200/60 shadow-sm border"
                          }`}
                      >
                        <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-white
                          ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700"}
                        `}>
                          {getInitials(c.name)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-sm truncate ${isActive ? "text-blue-900" : "text-slate-800"}`}>
                            {c.name}
                          </h3>
                          
                          {c.company && (
                            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5 truncate">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span className="truncate">{c.company}</span>
                            </p>
                          )}
                          
                          <div className={`mt-2 flex flex-wrap gap-2 ${identifier ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                            {c.phone && (
                              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md
                                ${isActive ? "bg-blue-100/50 text-blue-700" : "bg-slate-100 text-slate-600"}
                              `}>
                                <Phone className="w-2.5 h-2.5" />
                                {c.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        {isActive && (
                          <div className="shrink-0 pt-2">
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              {/* Action Button */}
              <div className="p-4 bg-white border-t border-slate-100/80 z-20">
                <button 
                  onClick={generatePlan} 
                  disabled={loading || !identifier} 
                  className="group relative w-full overflow-hidden rounded-xl bg-blue-600 hover:bg-blue-700 focus:bg-blue-800 disabled:bg-slate-100/80 disabled:text-slate-400 disabled:border-slate-200/60 disabled:border text-white tracking-tight font-bold py-[14px] px-6 flex items-center justify-center transition-all shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_16px_rgba(37,99,235,0.3)] active:scale-[0.98] active:shadow-md disabled:shadow-none"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <Loader2 className="mr-2 h-[18px] w-[18px] animate-spin" />
                      Анализ диалогов...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Сгенерировать трек-номер
                      <ChevronRight className="ml-1 -mr-1 h-5 w-5 opacity-70 group-hover:translate-x-1 group-disabled:hidden transition-transform" />
                    </span>
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="flex items-center justify-between pl-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                История отправлений
                <span className="ml-3 inline-flex items-center justify-center bg-slate-200 text-slate-600 h-6 w-6 rounded-full text-xs font-bold">
                  {plans.length}
                </span>
              </h2>
            </div>
            
            {plans.length === 0 ? (
              <div className="border-2 border-dashed border-slate-200/80 rounded-2xl bg-white/50 flex flex-col justify-center items-center h-64 text-slate-400">
                <div className="bg-slate-100/50 p-4 rounded-full mb-4">
                  <Activity className="w-10 h-10 text-slate-300" />
                </div>
                <p className="font-medium text-slate-500">Нет сгенерированных трек-номеров.</p>
                <p className="text-sm mt-1">Выберите клиента слева чтобы создать отправление.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {plans.map((p) => {
                  const trackingUrl = typeof window !== 'undefined' ? `${window.location.origin}/?tracking=${p.trackingNumber}` : '';
                  return (
                    <div key={p.id} className="bg-white rounded-2xl border border-slate-200/70 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col sm:flex-row group">
                      
                      {/* Tracking ID Badge Pane */}
                      <div className="bg-slate-50/50 p-6 border-b border-slate-100 sm:border-b-0 sm:border-r border-slate-100 flex flex-col justify-center items-center sm:w-1/3 min-w-[200px]">
                        <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mb-2">Трекинг</span>
                        <span className="font-mono text-lg font-bold text-blue-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm group-hover:border-blue-200 group-hover:shadow-blue-600/10 transition-colors">
                          {p.trackingNumber}
                        </span>
                        <div className="text-[11px] font-medium text-slate-400 mt-4 flex justify-center items-center gap-1.5 focus:outline-none">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(p.createdAt).toLocaleDateString("ru-RU", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}
                        </div>
                      </div>
                        
                      {/* Contents Pane */}
                      <div className="p-6 flex-1 flex flex-col justify-center space-y-5">
                        
                        {/* Header line info */}
                        {editingPlanId === p.id ? (
                          <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div>
                              <label className="text-[11px] font-bold uppercase text-slate-500 mb-1 block">Текущий статус</label>
                              <input value={editedPlanData.currentStatus} onChange={e => setEditedPlanData({...editedPlanData, currentStatus: e.target.value})} className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold uppercase text-slate-500 mb-1 block">Откуда → Куда</label>
                              <div className="flex gap-2">
                                <input value={editedPlanData.fromLocation} onChange={e => setEditedPlanData({...editedPlanData, fromLocation: e.target.value})} className="w-1/2 text-sm p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 outline-none" />
                                <input value={editedPlanData.toLocation} onChange={e => setEditedPlanData({...editedPlanData, toLocation: e.target.value})} className="w-1/2 text-sm p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 outline-none" />
                              </div>
                            </div>
                            <div>
                              <label className="text-[11px] font-bold uppercase text-slate-500 mb-1 block">Дата доставки</label>
                              <input type="date" value={editedPlanData.expectedDate} onChange={e => setEditedPlanData({...editedPlanData, expectedDate: e.target.value})} className="w-full text-sm p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 outline-none" />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold uppercase text-slate-500 mb-1 block">Фазы (JSON-массив)</label>
                              <textarea rows={6} value={editedPlanData.timelineEvents} onChange={e => setEditedPlanData({...editedPlanData, timelineEvents: e.target.value})} className="w-full font-mono text-xs p-2 bg-white border border-slate-200 rounded-lg focus:ring-2 outline-none" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-wrap lg:flex-nowrap justify-between items-start gap-4">
                              <div>
                                <h3 className="font-bold tracking-tight text-slate-900 flex items-center gap-2 text-base">
                                  {p.clientPhone}
                                </h3>
                                <p className="text-[13px] font-medium text-slate-500 mt-1">
                                  Доставка: {new Date(p.expectedDate).toLocaleDateString("ru-RU")}
                                </p>
                              </div>
                              <span className="inline-flex items-center rounded-full border border-slate-200/70 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-slate-50 text-slate-600 self-start">
                                {p.currentStatus}
                              </span>
                            </div>
                              
                            {/* Route Info */}
                            <div className="flex items-center bg-[#F8FAFC] border border-slate-100 p-3 rounded-xl">
                              <div className="flex items-center gap-3 text-[13px] w-full">
                                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 w-full">
                                  <span className="font-bold text-slate-700 truncate min-w-0">{p.fromLocation}</span>
                                  <span className="text-slate-300 hidden sm:inline px-1">→</span>
                                  <span className="text-slate-300 sm:hidden">↓</span>
                                  <span className="font-bold text-slate-700 truncate min-w-0">{p.toLocation}</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Actions */}
                        <div className="pt-2 flex flex-wrap sm:flex-nowrap gap-3">
                          {editingPlanId === p.id ? (
                            <>
                              <button onClick={() => handleSavePlan(p.id, p.trackingNumber)} disabled={saveLoading} className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white tracking-tight font-bold h-10 px-4 rounded-xl text-[13px] flex items-center justify-center transition-all active:scale-[0.98] shadow-sm">
                                {saveLoading ? 'Сохранение...' : <><Check className="w-4 h-4 mr-2 shrink-0"/> Сохранить</>}
                              </button>
                              <button onClick={() => setEditingPlanId(null)} className="bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 tracking-tight font-bold h-10 px-4 rounded-xl text-[13px] flex items-center justify-center transition-all active:scale-95">
                                <X className="w-4 h-4 mr-1 shrink-0" />
                                Отмена
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEditing(p)} className="flex-1 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm active:bg-slate-100 text-slate-700 tracking-tight font-bold h-10 px-3 rounded-xl text-[13px] flex items-center justify-center transition-all active:scale-[0.98] outline-none">
                                <Edit2 className="w-4 h-4 mr-2 text-slate-400 shrink-0" /> Редакт.
                              </button>
                              <button 
                                onClick={() => copyToClipboard(trackingUrl, p.id)}
                                className="flex-1 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm active:bg-slate-100 text-slate-700 tracking-tight font-bold h-10 px-3 rounded-xl text-[13px] flex items-center justify-center transition-all active:scale-[0.98] focus:ring-4 focus:ring-slate-100 outline-none"
                              >
                                {copiedId === p.id ? (
                                  <><CheckCircle2 className="w-4 h-4 mr-2 text-green-500 shrink-0" /> Скоп.</>
                                ) : (
                                  <><Copy className="w-4 h-4 mr-2 text-slate-400 shrink-0" /> Ссылка</>
                                )}
                              </button>
                              <button 
                                onClick={() => window.open(trackingUrl, "_blank")}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 active:bg-black text-white tracking-tight font-bold h-10 px-3 rounded-xl text-[13px] flex items-center justify-center transition-all shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1)] hover:shadow-[0_10px_15px_-3px_rgb(0,0,0,0.15)] active:scale-[0.98] focus:ring-4 focus:ring-slate-200 outline-none"
                              >
                                Портал
                                <ExternalLink className="w-4 h-4 ml-1.5 opacity-70 shrink-0" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
