/* === Dados base (placeholders) === */
const meta = {
  days: ['SEG','TER','QUA','QUI','SEX','SAB'],
  periods: [
    { code:'M1', start:'07:00', band:'M' }, { code:'M2', start:'07:50', band:'M' },
    { code:'M3', start:'08:40', band:'M' }, { code:'M4', start:'09:30', band:'M' },
    { code:'T1', start:'13:00', band:'T' }, { code:'T2', start:'13:50', band:'T' },
    { code:'T3', start:'14:40', band:'T' }, { code:'T4', start:'15:30', band:'T' },
    { code:'N1', start:'19:00', band:'N' }, { code:'N2', start:'19:50', band:'N' },
    { code:'N3', start:'20:40', band:'N' }, { code:'N4', start:'21:30', band:'N' }
  ]
};

const classes = [
  { id:'CC1', name:'CC1' }, { id:'CC2', name:'CC2' },
  { id:'CC3', name:'CC3' }, { id:'CC4', name:'CC4' },
  { id:'CC5', name:'CC5' }, { id:'CC6', name:'CC6' },
  { id:'CC7', name:'CC7' }, { id:'CC8', name:'CC8' },
];

const teachers = [
  { id:'t1', name:'Prof. Silva' }, { id:'t2', name:'Prof. Santos' },
  { id:'t3', name:'Prof. Costa' }, { id:'t4', name:'Prof. Lima'  },
  { id:'t5', name:'Prof. Oliveira' }, { id:'t6', name:'Prof. Ferreira' },
  { id:'t7', name:'Prof. Almeida' }, { id:'t8', name:'Prof. Rocha' }
];

const subjects = [
  { id:'mat', name:'Matemática', abbr:'MAT' },
  { id:'por', name:'Português',  abbr:'POR' },
  { id:'his', name:'História',   abbr:'HIS' },
  { id:'geo', name:'Geografia',  abbr:'GEO' },
  { id:'cie', name:'Ciências',   abbr:'CIE' },
  { id:'ing', name:'Inglês',     abbr:'ING' },
  { id:'edf', name:'Ed. Física', abbr:'EDF' },
  { id:'art', name:'Artes',      abbr:'ART' },
];


// Alocações iniciais simples (índices lineares: dia*12 + período)
const initialAllocations = { 0:[0,12,24,36], 1:[1,13,25,37], 2:[16,28,40,52], 3:[8,20,32,44] };

// Cards de aulas não alocadas (com durações variadas)
let unallocatedLessons = [
  { id:'u1', classId:'CC1', subjectId:'mat', teacherIds:['t1'], duration:2 },
  { id:'u2', classId:'CC2', subjectId:'por', teacherIds:['t2'], duration:1 },
  { id:'u3', classId:'CC3', subjectId:'his', teacherIds:['t3'], duration:3 },
  { id:'u4', classId:'CC4', subjectId:'geo', teacherIds:['t4'], duration:2 },
  { id:'u5', classId:'CC5', subjectId:'cie', teacherIds:['t5'], duration:1 },
  { id:'u6', classId:'CC6', subjectId:'ing', teacherIds:['t6'], duration:2 },
];

/* === Utilitários === */
const P = meta.periods.length;
const teacherById = Object.fromEntries(teachers.map(t => [t.id, t]));
const subjectById = Object.fromEntries(subjects.map(s => [s.id, s]));
const classById   = Object.fromEntries(classes.map(c => [c.id, c]));

function bandColor(b){ return b==='M' ? 'bg-green-500' : (b==='T' ? 'bg-yellow-500' : 'bg-purple-500'); }
function cellTitle(lesson){
  const cls = classById[lesson.classId]?.name ?? lesson.classId;
  const subj = subjectById[lesson.subjectId]?.name ?? lesson.subjectId;
  const profs = (lesson.teacherIds||[]).map(id => teacherById[id]?.name ?? id).join(', ');
  return `${cls} • ${profs} • ${subj} (dur: ${lesson.duration})`;
}
function lessonMarkup(lesson){
  const subj  = subjectById[lesson.subjectId];
  const abbr = subj?.abbr || (subj?.name?.slice(0,3) ?? '---').toUpperCase();
  return `<div class="text-center leading-tight">
            <div class="font-bold text-sm">${abbr}</div>
          </div>`;
}


/* === Estado === */
const mapCells = {};                 // mapCells[turmaId][day][period] = elemento
let selectedLessonId = null;         // id do card selecionado
let gidCounter = 1;
const newGroupId = () => `g${gidCounter++}`;

/* --------- Cabeçalho de períodos --------- */
function renderPeriodsHeader(){
  const header = document.getElementById('periods-header');
  while (header.children.length > 1) header.removeChild(header.lastChild);

  for (let d=0; d<meta.days.length; d++){
    const col = document.createElement('div');
    col.className = 'day-column';
    for (const p of meta.periods){
      const slot = document.createElement('div');
      slot.className = `${bandColor(p.band)} text-white text-xs p-2 text-center font-medium period-label`;
      slot.innerHTML = `${p.code}<br>${p.start}`;
      col.appendChild(slot);
    }
    header.appendChild(col);
  }
}

/* --------- Cards (não alocadas) --------- */
function renderUnallocated(){
  const list = document.getElementById('unallocated-list');
  list.innerHTML = '';

  unallocatedLessons.forEach(lesson=>{
    const cls = classById[lesson.classId]?.name ?? lesson.classId;
    const subj = subjectById[lesson.subjectId]?.name ?? lesson.subjectId;
    const profs = (lesson.teacherIds||[]).map(id=>teacherById[id]?.name??id).join(', ');

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'text-left bg-white border border-gray-300 rounded-lg p-3 hover:shadow transition focus:outline-none focus:ring-2 focus:ring-blue-500';
    card.dataset.lessonId = lesson.id;
    card.innerHTML = `
      <div class="text-sm font-semibold">${cls} • ${subj}</div>
      <div class="text-xs text-gray-600">${profs}</div>
      <div class="mt-1 inline-flex items-center gap-2">
        <span class="px-2 py-0.5 text-[10px] rounded bg-gray-200">dur: ${lesson.duration}</span>
        <span class="px-2 py-0.5 text-[10px] rounded bg-gray-200">id: ${lesson.id}</span>
      </div>`;

    if (selectedLessonId === lesson.id) card.classList.add('card-selected');

    card.addEventListener('click', ()=>{
      selectedLessonId = (selectedLessonId===lesson.id)? null : lesson.id;
      renderUnallocated();
    });

    list.appendChild(card);
  });

  document.getElementById('unalloc-count').textContent = `${unallocatedLessons.length} pendente(s)`;
}

/* --------- Helpers de bloco --------- */
// checa se cabe (sem ignorar ninguém)
function canPlaceBlock(turmaId, day, startPeriod, duration){
  if (startPeriod + duration > P) return false;
  for (let k=0;k<duration;k++){
    const cell = mapCells[turmaId][day][startPeriod+k];
    if (!cell || cell.classList.contains('occupied')) return false;
  }
  return true;
}

// checa se cabe ignorando um grupo específico (para validar overwrite SEM remover ainda)
function canPlaceBlockOverwrite(turmaId, day, startPeriod, duration, groupToIgnore){
  if (startPeriod + duration > P) return false;
  for (let k=0;k<duration;k++){
    const cell = mapCells[turmaId][day][startPeriod+k];
    if (!cell) return false;
    const occupied = cell.classList.contains('occupied');
    const sameGroup = occupied && cell.dataset.group === groupToIgnore;
    if (occupied && !sameGroup) return false;
  }
  return true;
}

function placeBlock(turmaId, day, startPeriod, lesson){
  const group = newGroupId();
  for (let k=0;k<lesson.duration;k++){
    const cell = mapCells[turmaId][day][startPeriod+k];
    cell.classList.add('occupied');
    cell.innerHTML = lessonMarkup(lesson);
    cell.title = cellTitle(lesson);
    cell.dataset.group = group;
    cell.dataset.lesson = JSON.stringify(lesson);
  }
  return group;
}

function getGroupCells(cell){
  const turmaId = cell.dataset.turmaId;
  const day = Number(cell.dataset.dia);
  const group = cell.dataset.group;
  const cells = [];
  for (let p=0;p<P;p++){
    const c = mapCells[turmaId][day][p];
    if (c && c.dataset.group === group) cells.push(c);
  }
  const startPeriod = Math.min(...cells.map(c=>Number(c.dataset.periodo)));
  const lesson = JSON.parse(cells[0].dataset.lesson);
  return { turmaId, day, startPeriod, cells, lesson, group };
}

function removeGroupCells(cells){
  cells.forEach(c=>{
    c.classList.remove('occupied');
    c.innerHTML = '';
    c.title = `${classById[c.dataset.turmaId]?.name ?? c.dataset.turmaId} - Clique para alocar`;
    delete c.dataset.group;
    delete c.dataset.lesson;
  });
}

/* --------- Grade --------- */
function criarGrade(){
  const grid = document.getElementById('schedule-grid');
  grid.innerHTML = '';

  // prepara mapa
  classes.forEach(t=>{
    mapCells[t.id] = Array.from({length: meta.days.length}, ()=>Array(P).fill(null));
  });

  classes.forEach((turma, turmaIndex)=>{
    const turmaRow = document.createElement('div');
    turmaRow.className = 'turma-row';

    const turmaCell = document.createElement('div');
    turmaCell.className = 'bg-gray-100 p-3 font-medium text-sm border-2 border-gray-300 flex items-center rounded-lg';
    turmaCell.textContent = turma.name;
    turmaRow.appendChild(turmaCell);

    for (let dia=0; dia<meta.days.length; dia++){
      const dayColumn = document.createElement('div');
      dayColumn.className = 'day-column';

      for (let periodo=0; periodo<P; periodo++){
        const linearIndex = dia * P + periodo;
        const cell = document.createElement('div');
        cell.className = 'time-slot flex items-center justify-center text-xs';
        cell.dataset.turmaId = turma.id;
        cell.dataset.dia = String(dia);
        cell.dataset.periodo = String(periodo);

        mapCells[turma.id][dia][periodo] = cell;

        // pré-alocações iniciais (como blocos de 1 período)
        if (initialAllocations?.[turmaIndex]?.includes(linearIndex)){
          const lesson = {
            id: `init-${turma.id}-${linearIndex}`,
            classId: turma.id,
            subjectId: subjects[turmaIndex % subjects.length].id,
            teacherIds: [teachers[turmaIndex % teachers.length].id],
            duration: 1
          };
          placeBlock(turma.id, dia, periodo, lesson);
        } else {
          cell.title = `${turma.name} - Clique para alocar`;
        }

        // Clique com suporte a overwrite
        cell.addEventListener('click', ()=>{
          const turmaId = cell.dataset.turmaId;
          const day = Number(cell.dataset.dia);
          const startP = Number(cell.dataset.periodo);

          // Slot OCUPADO
          if (cell.classList.contains('occupied') && cell.dataset.group){
            if (selectedLessonId){
              // OVERWRITE: validar, remover antigo e alocar novo
              const idxSel = unallocatedLessons.findIndex(l=>l.id===selectedLessonId);
              if (idxSel === -1) return;
              const sel = unallocatedLessons[idxSel];

              if (sel.classId !== turmaId){
                cell.classList.add('ring-2','ring-red-400');
                setTimeout(()=>cell.classList.remove('ring-2','ring-red-400'),400);
                return;
              }

              // dados do bloco atual
              const { cells: oldCells, lesson: oldLesson, group: oldGroup } = getGroupCells(cell);

              // 1) valida se o novo CABE ignorando o grupo antigo
              if (!canPlaceBlockOverwrite(turmaId, day, startP, sel.duration, oldGroup)){
                cell.classList.add('ring-2','ring-red-400');
                setTimeout(()=>cell.classList.remove('ring-2','ring-red-400'),400);
                return;
              }

              // 2) remove o antigo
              removeGroupCells(oldCells);

              // 3) aloca o novo
              placeBlock(turmaId, day, startP, sel);

              // 4) manda o antigo para os cards e remove o selecionado
              unallocatedLessons.push(oldLesson);
              unallocatedLessons.splice(idxSel,1);
              selectedLessonId = null;
              renderUnallocated();
              return;
            }

            // Sem card selecionado → remover bloco e mandar para os cards
            const { cells: grpCells, lesson } = getGroupCells(cell);
            removeGroupCells(grpCells);
            unallocatedLessons.push(lesson);
            renderUnallocated();
            return;
          }

          // Slot VAZIO → tenta alocar card selecionado
          if (!selectedLessonId){
            cell.classList.add('ring-2','ring-blue-400');
            setTimeout(()=>cell.classList.remove('ring-2','ring-blue-400'),300);
            return;
          }
          const idx = unallocatedLessons.findIndex(l=>l.id===selectedLessonId);
          if (idx===-1) return;
          const lesson = unallocatedLessons[idx];

          if (lesson.classId !== turmaId || !canPlaceBlock(turmaId, day, startP, lesson.duration)){
            cell.classList.add('ring-2','ring-red-400');
            setTimeout(()=>cell.classList.remove('ring-2','ring-red-400'),400);
            return;
          }

          placeBlock(turmaId, day, startP, lesson);
          unallocatedLessons.splice(idx,1);
          selectedLessonId = null;
          renderUnallocated();
        });

        dayColumn.appendChild(cell);
      } // <<< fecha o for (periodo)
      turmaRow.appendChild(dayColumn);
    } // <<< fecha o for (dia)

    grid.appendChild(turmaRow);
  }); // <<< fecha o classes.forEach(...)
} // <<< fecha function criarGrade


/* --------- Boot --------- */
function init(){
  renderPeriodsHeader();
  criarGrade();
  renderUnallocated();
}
init();

/* --------- Consolidação --------- */
function consolidar(){
  // Monta estrutura de JSON consolidado
  const allocations = [];

  classes.forEach(t=>{
    for (let d=0; d<meta.days.length; d++){
      for (let p=0; p<P; p++){
        const cell = mapCells[t.id][d][p];
        if (cell && cell.classList.contains('occupied') && cell.dataset.lesson){
          const lesson = JSON.parse(cell.dataset.lesson);
          allocations.push({
            classId: t.id,
            day: d,
            start: p,
            duration: lesson.duration,
            subjectId: lesson.subjectId,
            teacherIds: lesson.teacherIds || []
          });
        }
      }
    }
  });

  const consolidated = {
    meta,
    classes,
    teachers,
    subjects,
    allocations
  };

  // Salva no localStorage (por enquanto, depois podemos trocar para backend/API)
  localStorage.setItem('consolidatedSchedule', JSON.stringify(consolidated));

  // Redireciona para página de visualização
  window.location.href = 'vizualizar.html';
}

// Liga o botão ao consolidar
document.getElementById('btn-consolidar')
        .addEventListener('click', consolidar);

