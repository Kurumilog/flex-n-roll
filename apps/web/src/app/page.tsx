import Image from "next/image";

export default function Home() {
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
          <button className="bg-blue-500 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20 active:scale-95">
            Войти
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-16 md:py-24 max-w-4xl flex flex-col gap-16">
        
        {/* Hero Section */}
        <section className="text-center flex flex-col items-center gap-6">
          <h1 className="text-5xl md:text-7xl font-extrabold text-blue-400 tracking-tight">
            Отследить заказ
          </h1>
          <p className="text-slate-500 text-lg md:text-xl">
            Введите уникальный номер для получения актуальной информации о доставке.
          </p>
          
          <div className="bg-white p-2 rounded-full shadow-lg shadow-black/5 w-full max-w-2xl flex border border-slate-100 transition-shadow focus-within:shadow-xl mt-4">
            <input 
              type="text"
              placeholder="Введите номер (напр. FL-9823-XYZ)"
              className="flex-1 bg-transparent px-6 text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button className="bg-blue-500 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-600 transition-transform active:scale-95">
              Найти
            </button>
          </div>
        </section>

        {/* Tracking Status */}
        <section className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-black/5 border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between mb-12 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Текущий статус</p>
              <h2 className="text-3xl font-bold text-slate-900">В пути</h2>
            </div>
            <div className="md:text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Ожидаемая доставка</p>
              <h2 className="text-3xl font-bold text-green-500">24 Октября, 2026</h2>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative mt-8">
            {/* Background Line */}
            <div className="absolute left-[24px] md:left-1/2 top-4 bottom-4 w-1 bg-slate-100 -translate-x-1/2 rounded-full"></div>
            {/* Progress Line */}
            <div className="absolute left-[24px] md:left-1/2 top-4 bottom-[38%] w-1 bg-[#95c623] -translate-x-1/2 rounded-full"></div>

            <div className="flex flex-col gap-12 relative w-full">
              {/* Step 1: Left */}
              <div className="flex justify-start md:justify-center items-center w-full relative">
                <div className="hidden md:flex w-1/2 pr-12 flex-col items-end text-right">
                  <h3 className="text-xl font-bold text-slate-900">Заказ оформлен</h3>
                  <p className="text-sm text-slate-500 mt-1">Заявка принята в работу.</p>
                  <p className="text-xs font-bold text-[#95c623] mt-2">20 Октября, 09:42</p>
                </div>
                <div className="absolute left-[24px] md:left-1/2 size-12 bg-[#95c623] rounded-full border-4 border-white shadow-md flex items-center justify-center -translate-x-1/2 z-10">
                  <div className="size-3 bg-white rounded-full"></div>
                </div>
                <div className="ml-[72px] md:hidden flex flex-col items-start text-left w-full">
                  <h3 className="text-xl font-bold text-slate-900">Заказ оформлен</h3>
                  <p className="text-sm text-slate-500 mt-1">Заявка принята в работу.</p>
                  <p className="text-xs font-bold text-[#95c623] mt-2">20 Октября, 09:42</p>
                </div>
                <div className="hidden md:block w-1/2 pl-12"></div>
              </div>

              {/* Step 2: Right */}
              <div className="flex justify-start md:justify-center items-center w-full relative">
                <div className="hidden md:block w-1/2 pr-12"></div>
                <div className="absolute left-[24px] md:left-1/2 size-12 bg-[#95c623] rounded-full border-4 border-white shadow-md flex items-center justify-center -translate-x-1/2 z-10">
                  <div className="size-3 bg-white rounded-full"></div>
                </div>
                <div className="ml-[72px] md:ml-0 md:w-1/2 md:pl-12 flex flex-col items-start text-left w-full">
                  <h3 className="text-xl font-bold text-slate-900">В производстве</h3>
                  <p className="text-sm text-slate-500 mt-1">Изготовление и печать этикеток.</p>
                  <p className="text-xs font-bold text-[#95c623] mt-2">21 Октября, 14:15</p>
                </div>
              </div>

              {/* Step 3: Left (Active) */}
              <div className="flex justify-start md:justify-center items-center w-full relative">
                <div className="hidden md:flex w-1/2 pr-12 flex-col items-end text-right">
                  <h3 className="text-xl font-bold text-blue-500">В пути</h3>
                  <p className="text-sm text-slate-500 mt-1">Доставка до логистического центра.</p>
                  <p className="text-xs font-bold text-blue-500 mt-2">Сегодня - Live</p>
                </div>
                <div className="absolute left-[24px] md:left-1/2 size-12 bg-blue-500 rounded-full border-4 border-white shadow-[0_0_0_4px_rgba(59,130,246,0.2)] flex items-center justify-center -translate-x-1/2 z-10">
                  <div className="size-4 bg-white rounded-full animate-pulse"></div>
                </div>
                <div className="ml-[72px] md:hidden flex flex-col items-start text-left w-full">
                  <h3 className="text-xl font-bold text-blue-500">В пути</h3>
                  <p className="text-sm text-slate-500 mt-1">Доставка до логистического центра.</p>
                  <p className="text-xs font-bold text-blue-500 mt-2">Сегодня - Live</p>
                </div>
                <div className="hidden md:block w-1/2 pl-12"></div>
              </div>

              {/* Step 4: Right (Pending) */}
              <div className="flex justify-start md:justify-center items-center w-full relative opacity-40">
                <div className="hidden md:block w-1/2 pr-12"></div>
                <div className="absolute left-[24px] md:left-1/2 size-12 bg-slate-200 rounded-full border-4 border-white shadow-sm flex items-center justify-center -translate-x-1/2 z-10">
                  <div className="size-3 bg-slate-400 rounded-full"></div>
                </div>
                <div className="ml-[72px] md:ml-0 md:w-1/2 md:pl-12 flex flex-col items-start text-left w-full">
                  <h3 className="text-xl font-bold text-slate-900">Прибыл в пункт назначения</h3>
                  <p className="text-sm text-slate-500 mt-1">Ожидание передачи курьеру.</p>
                  <p className="text-xs font-bold text-slate-500 mt-2">24 Октября - Ожидается</p>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                  Текущая локация
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
