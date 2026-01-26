<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Electra: Smart Training System</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap');
        
        :root {
            --brand-blue: #1e40af;
            --brand-dark: #0f172a;
        }

        body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            background-color: #f8fafc; 
            color: var(--brand-dark);
            margin: 0;
            -webkit-tap-highlight-color: transparent;
        }

        .sticky-header-wrapper {
            position: sticky;
            top: 0;
            z-index: 100;
        }

        .glass-header {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
            position: relative;
        }

        .floating-nav {
            transform: translateY(50%);
            z-index: 110;
        }

        .card-shadow {
            box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .tab-content { display: none; }
        .tab-content.active { display: block; animation: fadeIn 0.3s ease-out; }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .content-margin { margin-top: 3.5rem; }

        .details-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.4s cubic-bezier(0, 1, 0, 1);
        }
        .details-content.open {
            max-height: 2000px;
            margin-top: 1rem;
            transition: max-height 0.8s ease-in-out;
        }

        .nav-btn {
            touch-action: manipulation;
            min-width: 85px;
        }

        .step-badge {
            @apply bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold mr-2 uppercase flex-shrink-0;
        }

        .exercise-variant {
            @apply border-l-4 border-blue-500 pl-3 py-3 my-3 bg-blue-50/50 rounded-r-xl border-opacity-30;
        }

        .theory-card {
            @apply bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-2;
        }

        input[type="number"] {
            -moz-appearance: textfield;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
    </style>
</head>
<body class="min-h-screen">

    <div class="sticky-header-wrapper">
        <header class="glass-header text-white pt-5 pb-12 px-5 shadow-lg">
            <div class="max-w-xl mx-auto text-center">
                <div class="flex items-center justify-center gap-2 mb-2">
                    <i class="fas fa-bolt text-yellow-400 text-xl"></i>
                    <h1 class="text-2xl font-extrabold tracking-tight">Electra</h1>
                </div>
                
                <div class="mb-3">
                    <span class="bg-blue-900/40 px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 uppercase tracking-tighter">
                        <i class="fas fa-calendar-alt mr-1 text-blue-300"></i>9 Dic 2025
                    </span>
                </div>

                <div class="bg-white/10 px-5 py-3 rounded-2xl border border-white/20 backdrop-blur-md inline-block w-full max-w-[260px]">
                    <p id="display-age-full" class="text-3xl font-black tracking-tighter leading-none mb-1">Calculando...</p>
                    <div id="display-age-sub" class="text-[9px] text-blue-200 font-bold uppercase tracking-widest leading-none">--</div>
                </div>
            </div>
        </header>

        <nav class="max-w-xl mx-auto px-3 absolute bottom-0 left-0 right-0 floating-nav">
            <div class="bg-white p-1 rounded-2xl shadow-xl flex overflow-x-auto gap-1 no-scrollbar border border-slate-200/50">
                <button onclick="switchTab('inicio', this)" class="nav-btn active flex-1 bg-blue-800 text-white px-3 py-3 rounded-xl font-bold text-[11px] transition-all whitespace-nowrap">
                    <i class="fas fa-home block mb-0.5 text-sm"></i>Inicio
                </button>
                <button onclick="switchTab('ejercicios', this)" class="nav-btn flex-1 text-slate-500 px-3 py-3 rounded-xl font-bold text-[11px] transition-all whitespace-nowrap">
                    <i class="fas fa-graduation-cap block mb-0.5 text-sm"></i>Entreno
                </button>
                <button onclick="switchTab('nutricion', this)" class="nav-btn flex-1 text-slate-500 px-3 py-3 rounded-xl font-bold text-[11px] transition-all whitespace-nowrap">
                    <i class="fas fa-utensils block mb-0.5 text-sm"></i>Dieta
                </button>
                <button onclick="switchTab('teoria', this)" class="nav-btn flex-1 text-slate-500 px-3 py-3 rounded-xl font-bold text-[11px] transition-all whitespace-nowrap">
                    <i class="fas fa-brain block mb-0.5 text-sm"></i>Teoría
                </button>
                <button onclick="switchTab('extra', this)" class="nav-btn flex-1 text-slate-500 px-3 py-3 rounded-xl font-bold text-[11px] transition-all whitespace-nowrap">
                    <i class="fas fa-star block mb-0.5 text-sm"></i>Tips
                </button>
            </div>
        </nav>
    </div>

    <main class="max-w-xl mx-auto px-4 content-margin pb-10">

        <!-- 1. INICIO -->
        <div id="inicio" class="tab-content active space-y-4">
            <div class="grid grid-cols-1 gap-3">
                <div class="bg-white p-4 rounded-2xl card-shadow border border-slate-100 flex items-center gap-4">
                    <div class="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div>
                        <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cerebro Collie</h3>
                        <p id="stat-learning" class="text-sm font-black text-slate-800 leading-none">Cargando...</p>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-2xl card-shadow border border-slate-100 flex items-center gap-4">
                    <div class="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div>
                        <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Prioridad</h3>
                        <p id="stat-tricks" class="text-sm font-black text-slate-800 leading-none">Cargando...</p>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-2xl card-shadow border border-slate-100 flex items-center gap-4">
                    <div class="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div>
                        <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ventana Atención</h3>
                        <p id="stat-focus" class="text-sm font-black text-slate-800 leading-none">Cargando...</p>
                    </div>
                </div>
            </div>

            <div class="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div class="relative z-10">
                    <h2 class="text-xl font-black mb-1 italic">"El genio se hace"</h2>
                    <p class="text-indigo-100 text-[11px]">Estás moldeando a la perra más inteligente. Cada minuto cuenta.</p>
                </div>
                <i class="fas fa-dog absolute -bottom-2 -right-2 text-7xl text-white/10 rotate-12"></i>
            </div>
        </div>

        <!-- 2. EJERCICIOS -->
        <div id="ejercicios" class="tab-content space-y-4">
            <h2 class="text-xl font-black text-slate-800 px-1">Guía de Entrenamiento</h2>

            <!-- NOMBRE -->
            <div class="bg-white p-5 rounded-2xl card-shadow border border-slate-100">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-base font-bold text-slate-800">1. Su Nombre</h3>
                    <i class="fas fa-id-card text-blue-200"></i>
                </div>
                
                <div class="bg-red-50 text-red-700 p-3 rounded-xl mb-4 border-l-4 border-red-500">
                    <p class="text-[10px] font-black uppercase mb-0.5">⚠️ Regla de Oro</p>
                    <p class="text-[10px] leading-tight">Nunca digas <strong>"¡No Electra!"</strong>. El nombre solo se usa para cosas positivas.</p>
                </div>

                <div class="exercise-variant">
                    <h4 class="font-bold text-blue-800 uppercase text-[10px]">Variante: El Imán</h4>
                    <p class="text-[11px] text-slate-600 mt-1">Di su nombre y aléjate corriendo. Cuando te alcance, premio triple.</p>
                </div>

                <button onclick="toggleDetails('det-nombre')" class="w-full mt-2 bg-slate-50 py-2 rounded-lg text-[10px] font-black uppercase text-slate-500 flex justify-center items-center gap-2">
                    <span id="text-det-nombre">Ver más detalles</span>
                    <i id="icon-det-nombre" class="fas fa-chevron-down transition-transform"></i>
                </button>

                <div id="det-nombre" class="details-content">
                    <div class="p-3 bg-slate-50 rounded-xl text-[11px] space-y-2 text-slate-600 border border-slate-200">
                        <p><strong>Ping-Pong:</strong> Dos personas se llaman alternadamente.</p>
                        <p><strong>Escondite:</strong> Escóndete y di su nombre 1 sola vez.</p>
                    </div>
                </div>
            </div>

            <!-- HIGIENE -->
            <div class="bg-white p-5 rounded-2xl card-shadow border border-slate-100">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-base font-bold text-slate-800">2. Higiene (Pedir sola)</h3>
                    <i class="fas fa-toilet-paper text-yellow-200"></i>
                </div>
                
                <div class="space-y-3">
                    <div class="bg-blue-50 p-3 rounded-xl border border-blue-100">
                        <p class="text-[10px] font-bold text-blue-800 uppercase mb-1 italic">¿Cómo hará para pedir?</p>
                        <p class="text-[11px] text-slate-600 leading-tight">Premia su intención: si la ves olfateando cerca de la salida, llévala rápido y premia.</p>
                    </div>
                    <div class="exercise-variant border-yellow-400 bg-yellow-50/30">
                        <h4 class="font-bold text-yellow-800 uppercase text-[10px]">El Cascabel</h4>
                        <p class="text-[11px] text-slate-600 mt-1">Cuelga un cascabel en la puerta. Haz que lo toque cada vez que salgan. Pronto lo tocará para avisar.</p>
                    </div>
                </div>
            </div>

            <!-- SENTADO -->
            <div class="bg-white p-5 rounded-2xl card-shadow border border-slate-100">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-base font-bold text-slate-800">3. Sentado (Control)</h3>
                    <i class="fas fa-dog text-purple-200"></i>
                </div>
                <p class="text-[11px] text-slate-500 italic mb-3">No premies si se sienta sola para hackear el sistema.</p>
                <div class="exercise-variant border-purple-400 bg-purple-50/30">
                    <h4 class="font-bold text-purple-800 uppercase text-[10px]">Sentado a Distancia</h4>
                    <p class="text-[11px] text-slate-600 mt-1">Da un paso atrás y dile "Sit". Debe quedarse donde está sin caminar hacia ti.</p>
                </div>
            </div>
        </div>

        <!-- 3. NUTRICION -->
        <div id="nutricion" class="tab-content space-y-4">
            <div class="bg-white rounded-2xl p-6 card-shadow border border-slate-100 text-center">
                <h2 class="text-xl font-black mb-4 text-slate-800">Plan de Comida</h2>
                <div class="max-w-[180px] mx-auto mb-6">
                    <label class="block text-[9px] font-black uppercase text-slate-400 mb-1">Gramos Totales / Día</label>
                    <input type="number" id="input-grams" value="160" class="w-full bg-slate-50 text-center text-4xl font-black py-3 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none">
                </div>

                <div class="space-y-3">
                    <div class="bg-blue-600 p-4 rounded-2xl text-white shadow-md text-left flex justify-between items-center">
                        <div>
                            <p class="text-[9px] uppercase font-bold opacity-80">Entrenamiento</p>
                            <p class="text-[10px] opacity-70">20 min antes de comer</p>
                        </div>
                        <p id="res-train" class="text-2xl font-black">--</p>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left flex justify-between items-center">
                        <div>
                            <p class="text-[9px] uppercase font-bold text-slate-400">Por Toma (x3)</p>
                            <p class="text-[10px] text-slate-400">Directo al plato</p>
                        </div>
                        <p id="res-meal" class="text-2xl font-black text-slate-800">--</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. TEORIA EXPANDIDA -->
        <div id="teoria" class="tab-content space-y-4">
            <h2 class="text-xl font-black text-slate-800 px-1">Psicología Collie</h2>
            
            <div class="theory-card">
                <div class="flex items-center gap-2 text-blue-600 mb-1">
                    <i class="fas fa-brain text-sm"></i>
                    <h3 class="font-bold uppercase text-[10px] tracking-wider">Instinto de Trabajo</h3>
                </div>
                <p class="text-[11px] text-slate-600 leading-normal">
                    Electra no quiere "jugar", quiere una misión. Dale un propósito diario o ella lo inventará mordiendo cables.
                </p>
            </div>

            <div class="theory-card border-l-4 border-l-green-500">
                <div class="flex items-center gap-2 text-green-600 mb-1">
                    <i class="fas fa-leaf text-sm"></i>
                    <h3 class="font-bold uppercase text-[10px] tracking-wider">Descompresión (Fase 1)</h3>
                </div>
                <p class="text-[11px] text-slate-600 leading-normal">
                    El cerebro de un cachorro se sobrecalienta. Por cada 5 minutos de estimulación, necesita 30 minutos de calma total. Si se pone "loca" o muerde mucho, está cansada, no activa.
                </p>
            </div>

            <div class="theory-card border-l-4 border-l-purple-500">
                <div class="flex items-center gap-2 text-purple-600 mb-1">
                    <i class="fas fa-hand-sparkles text-sm"></i>
                    <h3 class="font-bold uppercase text-[10px] tracking-wider">Captura de Calma</h3>
                </div>
                <p class="text-[11px] text-slate-600 leading-normal">
                    Si ves a Electra echada tranquila <strong>sin que se lo pidas</strong>, deja caer un premio entre sus patas en silencio. Estás premiando su "estado mental" de calma.
                </p>
            </div>

            <div class="theory-card">
                <div class="flex items-center gap-2 text-orange-600 mb-1">
                    <i class="fas fa-eye text-sm"></i>
                    <h3 class="font-bold uppercase text-[10px] tracking-wider">El Ojo del Collie</h3>
                </div>
                <p class="text-[11px] text-slate-600 leading-normal">
                    Si te mira fijamente, te pide instrucciones. No ignores su mirada, es su conexión directa contigo.
                </p>
            </div>

            <div class="theory-card border-l-4 border-l-red-500">
                <div class="flex items-center gap-2 text-red-600 mb-1">
                    <i class="fas fa-stopwatch text-sm"></i>
                    <h3 class="font-bold uppercase text-[10px] tracking-wider">La Regla de los 3 Segundos</h3>
                </div>
                <p class="text-[11px] text-slate-600 leading-normal">
                    Tienes exactamente 3 segundos para premiar o corregir un comportamiento. Pasado ese tiempo, Electra ya no asocia tu reacción con su acción.
                </p>
            </div>
        </div>

        <!-- 5. EXTRA / TIPS EXPANDIDOS -->
        <div id="extra" class="tab-content space-y-4">
            <h2 class="text-xl font-black text-slate-800 px-1">Tips de Oro (Avanzado)</h2>
            
            <div class="bg-white p-4 rounded-2xl card-shadow border-l-4 border-yellow-400 flex gap-3 items-center">
                <i class="fas fa-hourglass-half text-yellow-400"></i>
                <div>
                    <h4 class="font-bold text-slate-800 text-xs">Sesiones Cortas</h4>
                    <p class="text-[11px] text-slate-500">Máximo 3 minutos. Es mejor hacer 5 sesiones de 2 minutos que una de 10.</p>
                </div>
            </div>

            <div class="bg-white p-4 rounded-2xl card-shadow border-l-4 border-red-400 flex gap-3 items-center">
                <i class="fas fa-meat text-red-400"></i>
                <div>
                    <h4 class="font-bold text-slate-800 text-xs">Hambre Motivadora</h4>
                    <p class="text-[11px] text-slate-500">Entrena antes de comer. El alimento es el sueldo por su trabajo.</p>
                </div>
            </div>

            <div class="bg-white p-4 rounded-2xl card-shadow border-l-4 border-blue-400 flex gap-3 items-center">
                <i class="fas fa-socks text-blue-400"></i>
                <div>
                    <h4 class="font-bold text-slate-800 text-xs">Morder: "El Árbol"</h4>
                    <p class="text-[11px] text-slate-500">Si muerde tus manos, quédate quieto como un árbol y cruza los brazos. El juego muere cuando ella muerde piel.</p>
                </div>
            </div>

            <div class="bg-white p-4 rounded-2xl card-shadow border-l-4 border-green-400 flex gap-3 items-center">
                <i class="fas fa-wind text-green-400"></i>
                <div>
                    <h4 class="font-bold text-slate-800 text-xs">Socialización Pasiva</h4>
                    <p class="text-[11px] text-slate-500">No tiene que jugar con todos los perros. Ver perros pasar desde lejos mientras come premios es mucho más valioso.</p>
                </div>
            </div>

            <div class="bg-white p-4 rounded-2xl card-shadow border-l-4 border-indigo-400 flex gap-3 items-center">
                <i class="fas fa-volume-up text-indigo-400"></i>
                <div>
                    <h4 class="font-bold text-slate-800 text-xs">Comando "Shh"</h4>
                    <p class="text-[11px] text-slate-500">Los Border Collie son muy vocales. Premia el silencio en situaciones de excitación.</p>
                </div>
            </div>

            <div class="bg-slate-800 p-6 rounded-3xl text-white mt-6">
                <h3 class="text-sm font-bold mb-2 flex items-center gap-2">
                    <i class="fas fa-quote-left text-blue-400"></i>
                    Recuerda...
                </h3>
                <p class="text-[11px] italic opacity-80 leading-relaxed">
                    "Un perro cansado es un perro feliz, pero un Border Collie sobre-estimulado es un perro estresado. La clave no es correr kilómetros, es pensar soluciones."
                </p>
            </div>
        </div>

    </main>

    <script>
        // Fecha de nacimiento de Electra
        const BIRTH_DATE = new Date(2025, 11, 9); // Mes es 0-indexado (11 = Diciembre)

        function toggleDetails(id) {
            const content = document.getElementById(id);
            const icon = document.getElementById('icon-' + id);
            const text = document.getElementById('text-' + id);
            const isOpen = content.classList.contains('open');

            if(isOpen) {
                content.classList.remove('open');
                icon.style.transform = "rotate(0deg)";
                if (text) text.innerText = "Ver más detalles";
            } else {
                content.classList.add('open');
                icon.style.transform = "rotate(180deg)";
                if (text) text.innerText = "Cerrar detalles";
            }
        }

        function updateEverything() {
            const now = new Date();
            const diff = now - BIRTH_DATE;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            const weeks = Math.floor(days / 7);
            const remainingDays = days % 7;

            document.getElementById('display-age-full').innerText = `${days} DÍAS`;
            document.getElementById('display-age-sub').innerText = `${weeks} SEMANAS Y ${remainingDays} DÍAS`;

            const stLearning = document.getElementById('stat-learning');
            const stTricks = document.getElementById('stat-tricks');
            const stFocus = document.getElementById('stat-focus');

            // Lógica de evolución según días
            if (days < 60) {
                stLearning.innerText = "Nivel: Biónico";
                stTricks.innerText = "Socialización y Calma";
                stFocus.innerText = "2 - 3 Min";
            } else if (days < 120) {
                stLearning.innerText = "Nivel: Esponja";
                stTricks.innerText = "Comandos Básicos";
                stFocus.innerText = "5 - 8 Min";
            } else {
                stLearning.innerText = "Nivel: Trabajo";
                stTricks.innerText = "Trucos Complejos";
                stFocus.innerText = "10+ Min";
            }

            calculateNutrition();
        }

        function calculateNutrition() {
            const input = document.getElementById('input-grams');
            const total = parseFloat(input.value) || 160;
            const trainPercent = 0.25; // 25% para entrenar
            const trainTotal = total * trainPercent; 
            const restPerMeal = (total - trainTotal) / 3;

            document.getElementById('res-train').innerText = `${Math.round(trainTotal)}g`;
            document.getElementById('res-meal').innerText = `${Math.round(restPerMeal)}g`;
        }

        function switchTab(tabId, btn) {
            // Ocultar todos los contenidos
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');

            // Resetear botones
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.classList.remove('bg-blue-800', 'text-white', 'active');
                b.classList.add('text-slate-500');
            });
            
            // Activar botón actual
            btn.classList.add('bg-blue-800', 'text-white', 'active');
            btn.classList.remove('text-slate-500');
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        document.getElementById('input-grams').addEventListener('input', calculateNutrition);

        // Init
        updateEverything();
        setInterval(updateEverything, 60000); // Actualizar cada minuto
    </script>
</body>
</html>
