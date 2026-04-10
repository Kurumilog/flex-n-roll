"use client"

import { useState, useEffect, FormEvent } from "react";
import { Loader2, Package, MapPin, AlertCircle, Search } from "lucide-react";

export default function Home() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://kurumi.software/api";

  useEffect(() => {
    // Check for query param ?tracking=FL-...
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const trackingRaw = urlParams.get("tracking");
      if (trackingRaw) {
        setTrackingNumber(trackingRaw);
        fetchTracking(trackingRaw);
      }
    }
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      fetchTracking(trackingNumber.trim());
    }
  }

  const fetchTracking = async (id: string) => {
    setLoading(true);
    setError(null);
    setTrackingData(null);
    try {
      const res = await fetch(`${apiUrl}/tracking/${id}`);
      const json = await res.json();
      
      if (res.ok && json.success) {
        setTrackingData(json.data);
      } else {
        setError(json.message || "Трек-номер не найден");
      }
    } catch (e) {
      setError("Ошибка сети при обращении к серверу");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff] font-sans text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-slate-200">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-bold text-xl text-slate-900 tracking-tight">Flex-N-Roll PRO</div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-500 transition-colors">Отслеживание</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-500 transition-colors">Услуги</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-500 transition-colors">О нас</a>
          </nav>
            <a href="/manager" className="bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20 active:scale-95 flex items-center justify-center">
              Вы менеджер?
            </a>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-6 py-12 md:py-16 max-w-4xl flex flex-col gap-12">
          {/* Hero Section */}
          <section className="text-center flex flex-col items-center gap-6">
            <h1 className="text-5xl md:text-7xl font-extrabold text-blue-400 tracking-tight">
              Отследить заказ
          </h1>
          <p className="text-slate-500 text-lg md:text-xl">
            Введите уникальный номер для получения актуальной информации о доставке.
          </p>
          
          <form onSubmit={handleSearch} className="bg-white p-2 rounded-[2rem] md:rounded-full shadow-lg shadow-black/5 w-full max-w-2xl flex flex-col md:flex-row border border-slate-100 transition-shadow focus-within:shadow-xl mt-4 gap-2 md:gap-0">
            <div className="flex-1 flex items-center px-4 md:pl-6 py-2 md:py-0 min-w-0">
              <Search className="w-5 h-5 text-slate-400 mr-2 md:mr-3 shrink-0" />
              <input 
                type="text"
                placeholder="Трек-номер (напр. FL-9473-13)"
                className="w-full bg-transparent text-base md:text-md text-slate-700 outline-none placeholder:text-slate-400 truncate"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !trackingNumber.trim()}
              className="bg-blue-500 text-white px-6 md:px-8 py-3.5 md:py-3 rounded-2xl md:rounded-full font-bold hover:bg-blue-600 transition-transform active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center w-full md:w-auto shrink-0 md:min-w-[120px] ml-0 md:ml-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" /> : "Найти"}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center justify-center gap-2 max-w-2xl w-full mx-auto border border-red-100 shadow-sm">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          )}
        </section>

        {/* Tracking Status */}
        {trackingData && (
          <section className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-black/5 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 border-b border-slate-100 pb-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              
              {/* Route */}
              <div className="flex flex-col items-center md:items-start pt-4 md:pt-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                   Маршрут
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="font-bold text-lg text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-center break-words">{trackingData.fromLocation}</span>
                  <span className="text-slate-300">→</span>
                  <span className="font-bold text-lg text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-center break-words">{trackingData.toLocation}</span>
                </div>
              </div>
              
              {/* Status */}
              <div className="flex flex-col items-center md:items-start pt-6 md:pt-0 md:pl-8">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Статус заказа</p>
                <h2 className="text-2xl md:text-3xl font-extrabold text-blue-500 text-center md:text-left leading-tight break-words">
                  {trackingData.currentStatus}
                </h2>
              </div>
              
              {/* Date */}
              <div className="flex flex-col items-center md:items-start pt-6 md:pt-0 md:pl-8">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ожидаемая доставка</p>
                <h2 className="text-2xl font-bold text-[#95c623] text-center md:text-left leading-tight">
                  {new Date(trackingData.expectedDate).toLocaleDateString("ru-RU", { day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
              </div>
            </div>

            {/* Timeline - Left Aligned for better mobile & desktop readability */}
            <div className="relative mt-10 md:pl-4">
              {/* Background Line */}
              <div className="absolute left-[24px] md:left-[28px] top-6 bottom-6 w-1 bg-slate-100 rounded-full z-0"></div>

              <div className="flex flex-col gap-10 relative w-full z-10">
                {(trackingData.timelineEvents || []).map((step: any, index: number) => {
                  const isActive = step.isActive;
                  const isPast = !isActive && index < (trackingData.timelineEvents || []).findIndex((e: any) => e.isActive);
                  const isFuture = !isActive && !isPast;
                  
                  let dotColor = "bg-slate-100 border-white";
                  let titleColor = "text-slate-400";
                  
                  if (isActive) {
                    dotColor = "bg-blue-500 border-blue-50 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]";
                    titleColor = "text-blue-600";
                  } else if (isPast) {
                    dotColor = "bg-[#95c623] border-white shadow-sm";
                    titleColor = "text-slate-900";
                  }

                  return (
                    <div key={index} className={`flex items-start w-full relative ${isFuture ? 'opacity-50' : ''}`}>
                      
                      {/* Center Dot */}
                      <div className={`relative z-20 size-12 md:size-14 rounded-full border-4 flex-shrink-0 flex items-center justify-center transition-colors ${dotColor}`}>
                        <div className={`size-3 md:size-3.5 rounded-full ${isActive ? 'bg-white animate-pulse size-4 md:size-4' : isPast ? 'bg-white' : 'bg-slate-300'}`}></div>
                      </div>
                      
                      {/* Content */}
                      <div className="ml-5 md:ml-8 flex flex-col items-start text-left w-full mt-1 md:mt-2">
                        <h3 className={`text-lg md:text-xl font-bold tracking-tight ${titleColor}`}>{step.status}</h3>
                        <p className="text-sm md:text-base text-slate-500 mt-1.5 leading-snug">{step.description}</p>
                        <p className={`text-xs md:text-sm font-bold mt-2.5 ${isActive ? 'text-blue-500' : isPast ? 'text-[#95c623]' : 'text-slate-400'}`}>
                          {new Date(step.date).toLocaleString("ru-RU", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}
                          {isActive ? " — Активный статус" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Call to action & Map */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-8 flex flex-col justify-between items-start gap-8">
            <div>
              <h3 className="text-xl font-bold text-blue-500 mb-4">Нужна помощь?</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Служба поддержки Flex-N-Roll работает 24/7 для приоритетных отправлений.
              </p>
            </div>
            <a 
              href="https://t.me/flexnrollchattbot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-blue-500 w-full text-center text-white px-6 py-3.5 rounded-full font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 active:scale-95 block"
            >
              Связаться с нами
            </a>
          </div>
          <div className="md:col-span-2 bg-slate-100 rounded-3xl overflow-hidden relative min-h-[300px] border border-slate-200 pointer-events-none">
             {/* Map placeholder */}
             <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d150493.59393189917!2d27.433890288825862!3d53.88478491871408!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x46dbcfd35b1e6ad3%3A0xb61b853ddb570d9!2z0JzQuNC90YHGsQ!5e0!3m2!1sru!2sby!4v1714227092305!5m2!1sru!2sby" 
                className="absolute inset-0 w-full h-full border-0 opacity-80 mix-blend-luminosity grayscale-[50%]" 
                allowFullScreen={false} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade">
             </iframe>
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent"></div>
             <div className="absolute bottom-8 left-8 text-white z-10">
                <p className="text-sm font-semibold opacity-90 flex items-center gap-2 mb-1">
                  <span className="size-2.5 rounded-full bg-[#95c623] animate-pulse inline-block shadow-[0_0_8px_#95c623]"></span>
                  Центральный офис
                </p>
                <h4 className="font-extrabold text-2xl tracking-tight text-white drop-shadow-md">Минск, Беларусь</h4>
             </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-50 mt-auto border-t border-slate-200">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-bold text-slate-800">Flex-N-Roll PRO</div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
             <a href="#" className="hover:text-blue-500 transition-colors">Политика конфеденциальности</a>
             <a href="#" className="hover:text-blue-500 transition-colors">Условия использования</a>
          </div>
          <div className="text-sm text-slate-400">© 2026 Flex-N-Roll Pro. Все права защищены.</div>
        </div>
      </footer>
    </div>
  );
}
