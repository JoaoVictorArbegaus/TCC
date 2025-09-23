/* === Dados vindos do data.js === */
const { meta, classes, teachers, subjects, initialAllocations, initialUnallocated } = window.EDITOR_DATA;

/* === Estado de cards não alocados (clonamos para não mutar o data.js) === */
let unallocatedLessons = JSON.parse(JSON.stringify(initialUnallocated || []));

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
  return `<div class="text-center leading-tight"><div class="font-bold text-sm">${abbr}</div></div>`;
}

/* === Estado === */
const mapCells = {};                 // mapCells[turmaId][day][period] = elemento
let selectedLessonId = null;         // seleção de card (na área de não alocadas)
let pickedFromGrid = null;           // { turmaId, day, startPeriod, cells, lesson, group } quando “pegamos” da grade
let gidCounter = 1;
const newGroupId = () => `g${gidCounter++}`;

/* ----------------- Cabeçalho de períodos ----------------- */
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

/* ----------------- Render cards (não alocadas) ----------------- */
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

    // clicar em card: seleciona/deseleciona o card
    card.addEventListener('click', ()=>{
      selectedLessonId = (selectedLessonId===lesson.id)? null : lesson.id;
      // se havia uma aula “pegada” da grade e clicou em card, não tem efeito de descarte.
      // O descarte para não alocadas é clicando no fundo da área (ver abaixo).
      renderUnallocated();
    });

    list.appendChild(card);
  });

  document.getElementById('unalloc-count').textContent = `${unallocatedLessons.length} pendente(s)`;
}

/* ----------------- Helpers de bloco ----------------- */
function canPlaceBlock(turmaId, day, startPeriod, duration){
  if (startPeriod + duration > P) return false;
  for (let k=0;k<duration;k++){
    const cell = mapCells[turmaId][day][startPeriod+k];
    if (!cell || cell.classList.contains('occupied')) return false;
  }
  return true;
}
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
  for (let k = 0; k < lesson.duration; k++){
    const cell = mapCells[turmaId][day][startPeriod + k];
    cell.classList.add('occupied');
    cell.dataset.group  = group;
    cell.dataset.lesson = JSON.stringify(lesson);

    if (k === 0) {
      cell.classList.add('block-head');
      cell.style.gridColumnEnd = `span ${lesson.duration}`;
      cell.innerHTML = lessonMarkup(lesson);
      cell.title = cellTitle(lesson);
      cell.style.display = '';
    } else {
      cell.classList.add('block-tail');
      cell.innerHTML = '';
      cell.title = '';
      cell.style.display = 'none';
      cell.style.gridColumnEnd = 'span 1';
    }
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
    c.classList.remove('occupied','block-head','block-tail', 'ring-2', 'ring-amber-400');
    c.style.gridColumnEnd = 'span 1';
    c.style.display = '';
    c.innerHTML = '';
    c.title = `${classById[c.dataset.turmaId]?.name ?? c.dataset.turmaId} - Clique para alocar`;
    delete c.dataset.group;
    delete c.dataset.lesson;
  });
}

/* ----------------- Pick (pegar da grade), mover e soltar ----------------- */
function highlightPicked(cells){
  // destaca apenas a cabeça do bloco
  const head = cells.find(c=>c.classList.contains('block-head')) || cells[0];
  head.classList.add('ring-2','ring-amber-400');
}
function clearPickedHighlight(){
  if (!pickedFromGrid) return;
  pickedFromGrid.cells.forEach(c=>c.classList.remove('ring-2','ring-amber-400'));
}

function pickFromGrid(cell){
  const info = getGroupCells(cell);
  pickedFromGrid = info;
  highlightPicked(info.cells);
}
function cancelPick(){
  clearPickedHighlight();
  pickedFromGrid = null;
}

function movePickedToCell(targetCell){
  if (!pickedFromGrid) return;

  const { turmaId: oldTurma, day: oldDay, startPeriod: oldStart, cells: oldCells, lesson, group } = pickedFromGrid;

  const turmaId = targetCell.dataset.turmaId;
  const day     = Number(targetCell.dataset.dia);
  const startP  = Number(targetCell.dataset.periodo);

  // tentar mover (permitindo overwrite, ignorando o próprio grupo)
  if (!canPlaceBlockOverwrite(turmaId, day, startP, lesson.duration, group) || lesson.classId !== turmaId){
    // feedback e mantém pick
    targetCell.classList.add('ring-2','ring-red-400');
    setTimeout(()=>targetCell.classList.remove('ring-2','ring-red-400'), 350);
    return;
  }

  // remove antigo, coloca no novo
  clearPickedHighlight();
  removeGroupCells(oldCells);
  placeBlock(turmaId, day, startP, lesson);
  pickedFromGrid = null;
}

/* ----------------- Grade ----------------- */
function criarGrade(){
  const grid = document.getElementById('schedule-grid');
  grid.innerHTML = '';

  classes.forEach(t=>{ mapCells[t.id] = Array.from({length: meta.days.length}, ()=>Array(P).fill(null)); });

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
        const cell = document.createElement('div');
        cell.className = 'time-slot flex items-center justify-center text-xs';
        cell.dataset.turmaId = turma.id;
        cell.dataset.dia = String(dia);
        cell.dataset.periodo = String(periodo);

        // ancora cada período na sua coluna (importante para span)
        cell.style.gridColumnStart = String(periodo+1);
        cell.style.gridColumnEnd = 'span 1';

        mapCells[turma.id][dia][periodo] = cell;

        // pré-alocações iniciais (exemplo dur=1)
        if (initialAllocations?.[turmaIndex]?.includes(dia*P + periodo)){
          const lesson = {
            id: `init-${turma.id}-${dia}-${periodo}`,
            classId: turma.id,
            subjectId: subjects[(turmaIndex + periodo) % subjects.length].id,
            teacherIds: [teachers[(dia+periodo) % teachers.length].id],
            duration: 1
          };
          placeBlock(turma.id, dia, periodo, lesson);
        } else {
          cell.title = `${turma.name} - Clique para alocar`;
        }

        // Clique no slot
        cell.addEventListener('click', ()=>{
          // 1) se estou com uma aula “pegada” da grade => tentar mover para este slot
          if (pickedFromGrid){
            movePickedToCell(cell);
            return;
          }

          // 2) se tenho um card selecionado => tentar alocar/overwrite a partir do card
          if (selectedLessonId){
            const lesson = unallocatedLessons.find(l=>l.id===selectedLessonId);
            if (!lesson) return;
            // slot ocupado => overwrite (usa a regra normal)
            if (cell.classList.contains('occupied')){
              const { group } = getGroupCells(cell);
              if (!canPlaceBlockOverwrite(cell.dataset.turmaId, Number(cell.dataset.dia), Number(cell.dataset.periodo), lesson.duration, group)
                  || lesson.classId !== cell.dataset.turmaId){
                cell.classList.add('ring-2','ring-red-400');
                setTimeout(()=>cell.classList.remove('ring-2','ring-red-400'), 350);
                return;
              }
              const { cells: oldCells, lesson: oldLesson } = getGroupCells(cell);
              removeGroupCells(oldCells);
              placeBlock(cell.dataset.turmaId, Number(cell.dataset.dia), Number(cell.dataset.periodo), lesson);
              // remove card e devolve antigo
              const idx = unallocatedLessons.findIndex(l=>l.id===lesson.id);
              if (idx !== -1) unallocatedLessons.splice(idx,1);
              unallocatedLessons.push(oldLesson);
              selectedLessonId = null;
              renderUnallocated();
              return;
            }

            // slot vazio => alocar
            if (lesson.classId !== cell.dataset.turmaId || !canPlaceBlock(cell.dataset.turmaId, Number(cell.dataset.dia), Number(cell.dataset.periodo), lesson.duration)){
              cell.classList.add('ring-2','ring-red-400');
              setTimeout(()=>cell.classList.remove('ring-2','ring-red-400'), 350);
              return;
            }
            placeBlock(cell.dataset.turmaId, Number(cell.dataset.dia), Number(cell.dataset.periodo), lesson);
            const idx = unallocatedLessons.findIndex(l=>l.id===selectedLessonId);
            if (idx !== -1) unallocatedLessons.splice(idx,1);
            selectedLessonId = null;
            renderUnallocated();
            return;
          }

          // 3) sem card e clicou em bloco ocupado => “pegar da grade”
          if (cell.classList.contains('occupied') && cell.dataset.group){
            const info = getGroupCells(cell);
            // se clicar de novo no mesmo bloco enquanto já está pickado => cancela
            if (pickedFromGrid && pickedFromGrid.group === info.group){
              cancelPick();
            } else {
              cancelPick(); // limpa qualquer pick anterior
              pickFromGrid(cell);
            }
            return;
          }

          // 4) slot vazio e nada selecionado => feedback leve
          cell.classList.add('ring-2','ring-blue-400');
          setTimeout(()=>cell.classList.remove('ring-2','ring-blue-400'), 250);
        });

        dayColumn.appendChild(cell);
      }
      turmaRow.appendChild(dayColumn);
    }
    grid.appendChild(turmaRow);
  });

  // clique na área de “Aulas não alocadas” (fundo) descarta a aula pickada para os cards
  const unallocArea = document.getElementById('unallocated-list');
  if (unallocArea){
    unallocArea.addEventListener('click', (e)=>{
      // Só considera clique no fundo da área, não em um card:
      if (e.target !== unallocArea) return;
      if (!pickedFromGrid) return;
      const { lesson, cells } = pickedFromGrid;
      clearPickedHighlight();
      removeGroupCells(cells);
      unallocatedLessons.push(lesson);
      pickedFromGrid = null;
      renderUnallocated();
    });
  }
}

/* ----------------- Boot ----------------- */
function init(){
  renderPeriodsHeader();
  criarGrade();
  renderUnallocated();
}
init();

/* ----------------- Consolidação ----------------- */
function consolidar(){
  // Se estiver com uma aula pickada, “solta” antes consolidar (mantém onde está)
  cancelPick();

  const allocations = [];
  classes.forEach(t=>{
    for (let d=0; d<meta.days.length; d++){
      for (let p=0; p<P; p++){
        const cell = mapCells[t.id][d][p];
        if (cell && cell.classList.contains('occupied') && cell.dataset.lesson){
          const lesson = JSON.parse(cell.dataset.lesson);
          if (cell.classList.contains('block-head')){
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
    }
  });

  const consolidated = { meta, classes, teachers, subjects, allocations };
  localStorage.setItem('consolidatedSchedule', JSON.stringify(consolidated));
  window.location.href = 'vizualizar.html';
}

// --- Confirmação antes de consolidar ---
const btnConsolidar = document.getElementById('btn-consolidar');
if (btnConsolidar){
  btnConsolidar.addEventListener('click', () => {
    const ok = window.confirm('Você tem certeza que deseja consolidar? Esta ação é irreversível.');
    if (!ok) return;
    consolidar();
  }, { once: true });
}
