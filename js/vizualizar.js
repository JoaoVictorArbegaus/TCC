/* === Visualização do cronograma consolidado (read-only) === */

function bandColor(b){
  return b === 'M' ? 'bg-green-500'
       : b === 'T' ? 'bg-yellow-500'
       :              'bg-purple-500';
}

function loadConsolidated(){
  const raw = localStorage.getItem('consolidatedSchedule');
  if (!raw){
    alert("Nenhum cronograma consolidado encontrado.\nVolte para a página de edição e consolide.");
    return null;
  }
  return JSON.parse(raw);
}

function lessonMarkup(lesson, subjectById){
  const subj  = subjectById[lesson.subjectId];
  const abbr = subj?.abbr || (subj?.name?.slice(0,3) ?? '---').toUpperCase();
  return `<div class="text-center leading-tight font-bold text-sm">${abbr}</div>`;
}

function cellTitle(lesson, classById, subjectById, teacherById){
  const cls = classById[lesson.classId]?.name ?? lesson.classId;
  const subj = subjectById[lesson.subjectId]?.name ?? lesson.subjectId;
  const profs = (lesson.teacherIds||[]).map(id => teacherById[id]?.name ?? id).join(', ');
  return `${cls} • ${profs} • ${subj} (dur: ${lesson.duration})`;
}

/* ---------- Headers dinâmicos ---------- */
function renderHeadersFull(meta){
  // Linha: TURMAS | dias da semana
  const days = document.getElementById('days-header');
  days.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'bg-gray-800 text-white p-3 font-bold text-center rounded-lg';
  title.textContent = 'TURMAS';
  days.appendChild(title);

  const dayNames = ['SEGUNDA-FEIRA','TERÇA-FEIRA','QUARTA-FEIRA','QUINTA-FEIRA','SEXTA-FEIRA','SÁBADO'];
  for (const dn of dayNames){
    const d = document.createElement('div');
    d.className = 'bg-blue-600 text-white p-3 font-bold text-center rounded-lg header-day';
    d.textContent = dn;
    days.appendChild(d);
  }

  // Cabeçalho dos períodos (12 por dia)
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

// Reaproveitamos o mesmo header para "modo single" (turma ou professor)
function renderHeadersSingle(meta, subtitleText){
  // Subtítulo
  const sub = document.getElementById('viz-subtitle');
  if (sub) sub.textContent = subtitleText || '';

  // Topo: apenas a FAIXA AZUL "PERÍODOS" ocupando a COLUNA 2 (CSS faz grid-column: 2/3)
  const days = document.getElementById('days-header');
  days.innerHTML = '';
  const faixa = document.createElement('div');
  faixa.className = 'bg-blue-600 text-white p-3 font-bold text-center rounded-lg header-day';
  faixa.textContent = 'PERÍODOS';
  days.appendChild(faixa);

  // Linha abaixo: "DIAS" (coluna 1) | rótulos dos 12 períodos (coluna 2)
  const header = document.getElementById('periods-header');
  header.innerHTML = '';

  const diasCell = document.createElement('div');
  diasCell.className = 'bg-gray-800 text-white p-3 font-bold text-center rounded-lg';
  diasCell.textContent = 'DIAS';
  header.appendChild(diasCell);

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

/* ---------- Grid: todas as turmas ---------- */
function renderGridFull(data){
  const grid = document.getElementById('viz-grid');
  grid.innerHTML = '';

  const { classes, subjects, teachers, meta, allocations } = data;
  const subjectById = Object.fromEntries(subjects.map(s => [s.id, s]));
  const teacherById = Object.fromEntries(teachers.map(t => [t.id, t]));
  const classById   = Object.fromEntries(classes.map(c => [c.id, c]));
  const P = meta.periods.length;

  const allocIndex = {};
  allocations.forEach(a => { allocIndex[`${a.classId}-${a.day}-${a.start}`] = a; });

  classes.forEach(turma=>{
    const turmaRow = document.createElement('div');
    turmaRow.className = 'turma-row';

    const turmaCell = document.createElement('div');
    turmaCell.className = 'bg-gray-100 p-3 font-medium text-sm border-2 border-gray-300 flex items-center rounded-lg';
    turmaCell.textContent = turma.name;
    turmaRow.appendChild(turmaCell);

    for (let dia=0; dia<meta.days.length; dia++){
      const dayColumn = document.createElement('div');
      dayColumn.className = 'day-column';
      for (let p=0; p<P; p++){
        const cell = document.createElement('div');
        cell.className = 'time-slot flex items-center justify-center text-xs';

        const key = `${turma.id}-${dia}-${p}`;
        if (allocIndex[key]){
          const lesson = allocIndex[key];
          cell.classList.add('occupied');
          cell.innerHTML = lessonMarkup(lesson, subjectById);
          cell.title = cellTitle(lesson, classById, subjectById, teacherById);
        }
        dayColumn.appendChild(cell);
      }
      turmaRow.appendChild(dayColumn);
    }
    grid.appendChild(turmaRow);
  });
}

/* ---------- Grid: turma única ---------- */
function renderGridSingleClass(data, classId){
  const grid = document.getElementById('viz-grid');
  grid.innerHTML = '';

  const { classes, subjects, teachers, meta, allocations } = data;
  const subjectById = Object.fromEntries(subjects.map(s => [s.id, s]));
  const teacherById = Object.fromEntries(teachers.map(t => [t.id, t]));
  const classById   = Object.fromEntries(classes.map(c => [c.id, c]));
  const P = meta.periods.length;

  const allocIndex = {};
  allocations
    .filter(a => a.classId === classId)
    .forEach(a => { allocIndex[`${a.day}-${a.start}`] = a; });

  const dayNamesFull = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  for (let dia=0; dia<meta.days.length; dia++){
    const row = document.createElement('div');
    row.className = 'turma-row';

    // Coluna esquerda: nome do dia
    const dayName = document.createElement('div');
    dayName.className = 'bg-gray-100 p-3 font-bold text-lg border-2 border-gray-300 flex items-center justify-center rounded-lg';
    dayName.textContent = dayNamesFull[dia];
    row.appendChild(dayName);

    // Coluna direita: 12 períodos
    const periodsCol = document.createElement('div');
    periodsCol.className = 'day-column';

    for (let p=0; p<P; p++){
      const cell = document.createElement('div');
      cell.className = 'time-slot flex items-center justify-center text-xs';

      const key = `${dia}-${p}`;
      if (allocIndex[key]){
        const lesson = allocIndex[key];
        cell.classList.add('occupied');
        cell.innerHTML = lessonMarkup(lesson, subjectById);
        cell.title = cellTitle(lesson, classById, subjectById, teacherById);
      }

      periodsCol.appendChild(cell);
    }

    row.appendChild(periodsCol);
    grid.appendChild(row);
  }
}

/* ---------- Grid: professor único ---------- */
function renderGridSingleTeacher(data, teacherId){
  const grid = document.getElementById('viz-grid');
  grid.innerHTML = '';

  const { classes, subjects, teachers, meta, allocations } = data;
  const subjectById = Object.fromEntries(subjects.map(s => [s.id, s]));
  const teacherById = Object.fromEntries(teachers.map(t => [t.id, t]));
  const classById   = Object.fromEntries(classes.map(c => [c.id, c]));
  const P = meta.periods.length;

  // indexa por (dia, início) todas as aulas onde teacherId participa
  const allocIndex = {};
  allocations
    .filter(a => Array.isArray(a.teacherIds) && a.teacherIds.includes(teacherId))
    .forEach(a => { allocIndex[`${a.day}-${a.start}`] = a; });

  const dayNamesFull = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  for (let dia=0; dia<meta.days.length; dia++){
    const row = document.createElement('div');
    row.className = 'turma-row';

    // Coluna esquerda: nome do dia
    const dayName = document.createElement('div');
    dayName.className = 'bg-gray-100 p-3 font-bold text-lg border-2 border-gray-300 flex items-center justify-center rounded-lg';
    dayName.textContent = dayNamesFull[dia];
    row.appendChild(dayName);

    // Coluna direita: 12 períodos
    const periodsCol = document.createElement('div');
    periodsCol.className = 'day-column';

    for (let p=0; p<P; p++){
      const cell = document.createElement('div');
      cell.className = 'time-slot flex items-center justify-center text-xs';

      const key = `${dia}-${p}`;
      if (allocIndex[key]){
        const lesson = allocIndex[key];
        cell.classList.add('occupied');

        // Mostra a sigla da matéria; se quiser, dá pra incluir a turma menor abaixo:
        cell.innerHTML = lessonMarkup(lesson, subjectById);
        cell.title = cellTitle(lesson, classById, subjectById, teacherById);
      }

      periodsCol.appendChild(cell);
    }

    row.appendChild(periodsCol);
    grid.appendChild(row);
  }
}

/* ---------- Filtros ---------- */
function populateClassFilter(classes){
  const sel = document.getElementById('f-class');
  if (!sel) return;
  sel.innerHTML = '<option value="">Todas</option>' +
    classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function populateTeacherFilter(teachers){
  const sel = document.getElementById('f-teacher');
  if (!sel) return;
  sel.innerHTML = '<option value="">Todos</option>' +
    teachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
}

function wireFilters(data){
  const selClass   = document.getElementById('f-class');
  const selTeacher = document.getElementById('f-teacher');

  let isInternal = false; // evita reentrância ao sincronizar selects

  function renderState(effectiveClassId, effectiveTeacherId){
    if (effectiveTeacherId){
      document.body.classList.add('single-view');
      const prof = data.teachers.find(t=>t.id===effectiveTeacherId)?.name || effectiveTeacherId;
      renderHeadersSingle(data.meta, `Professor: ${prof}`);
      renderGridSingleTeacher(data, effectiveTeacherId);
      return;
    }
    if (effectiveClassId){
      document.body.classList.add('single-view');
      const turma = data.classes.find(c=>c.id===effectiveClassId)?.name || effectiveClassId;
      renderHeadersSingle(data.meta, `Turma: ${turma}`);
      renderGridSingleClass(data, effectiveClassId);
      return;
    }
    document.body.classList.remove('single-view');
    const sub = document.getElementById('viz-subtitle');
    if (sub) sub.textContent = '';
    renderHeadersFull(data.meta);
    renderGridFull(data);
  }

  function apply(source){
    if (isInternal) return;

    const classId   = selClass?.value   || '';
    const teacherId = selTeacher?.value || '';

    // prioridade pelo seletor que disparou
    let effectiveClassId   = '';
    let effectiveTeacherId = '';
    if (source === 'teacher' && teacherId){
      effectiveTeacherId = teacherId;
    } else if (source === 'class' && classId){
      effectiveClassId = classId;
    } else {
      // reset ou inicial
      if (teacherId) effectiveTeacherId = teacherId;
      else if (classId) effectiveClassId = classId;
    }

    renderState(effectiveClassId, effectiveTeacherId);

    // sincroniza selects sem “piscar”
    isInternal = true;
    if (effectiveTeacherId){
      if (selClass) selClass.value = '';
    } else if (effectiveClassId){
      if (selTeacher) selTeacher.value = '';
    } else {
      if (selClass)   selClass.value   = '';
      if (selTeacher) selTeacher.value = '';
    }
    isInternal = false;
  }

  if (selClass)   selClass.addEventListener('change', ()=>apply('class'));
  if (selTeacher) selTeacher.addEventListener('change', ()=>apply('teacher'));

  // >>> lida com ambos os botões "Mostrar tudo"
  const resetButtons = document.querySelectorAll('.js-reset-all, #f-reset, #f-reset2');
  resetButtons.forEach(btn => {
    if (!btn.getAttribute('type')) btn.setAttribute('type', 'button');
    btn.addEventListener('click', () => apply('reset'));
  });

  // estado inicial
  apply('init');
}



/* ---------- Boot ---------- */
function initViz(){
  const data = loadConsolidated();
  if (!data) return;

  populateClassFilter(data.classes);
  populateTeacherFilter(data.teachers);
  wireFilters(data); // já renderiza conforme o estado dos selects
}

initViz();
