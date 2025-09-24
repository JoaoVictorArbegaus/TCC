// js/ag-adapter.js
(function () {
    const DAY_INDEX = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 };

    function makeAbbr(name) {
        if (!name) return '---';
        // tenta pegar as 3 primeiras letras significativas
        const clean = name.normalize('NFD').replace(/\p{Diacritic}/gu, '');
        // pega iniciais se for nome composto (ex: "Eletrônica Digital" -> ED)
        const words = clean.split(/\s+/).filter(Boolean);
        if (words.length >= 2) {
            const ab = (words[0][0] + words[1][0] + (words[2]?.[0] || '')).toUpperCase();
            if (ab.length >= 2) return ab.slice(0, 3);
        }
        return clean.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase();
    }

    function uniquePush(map, list, key, mkObj) {
        if (!map.has(key)) {
            const obj = mkObj(key);
            map.set(key, obj);
            list.push(obj);
        }
        return map.get(key);
    }

    /** 
     * Adapta o payload do AG para o formato do EDITOR (placeholders).
     * Mantém seu meta atual (períodos) vindo do data.js – então passe meta como argumento.
     */
    function adaptAGForEditor(meta, agPayload) {
        // coletores
        const classes = [];
        const teachers = [];
        const subjects = [];
        const rooms = [];

        const subjMap = new Map();    // name -> subject obj
        const teacherMap = new Map(); // name -> teacher obj
        const roomMap = new Map();    // name -> room obj
        const classMap = new Map();   // id -> class obj

        // 1) classes
        (agPayload.classes || []).forEach(c => {
            uniquePush(classMap, classes, String(c.class_id), id => ({
                id, name: c.class_name || String(c.class_id)
            }));
        });

        // 2) varrer aulas p/ coletar professores/salas/disciplinas
        (agPayload.classes || []).forEach(c => {
            (c.days || []).forEach(d => {
                (d.lessons || []).forEach(lesson => {
                    // subjects (lista de nomes)
                    (lesson.subject_names || []).forEach(sname => {
                        uniquePush(subjMap, subjects, sname, name => ({
                            id: 'S:' + name, name, abbr: makeAbbr(name)
                        }));
                    });
                    // teachers (lista de nomes)
                    (lesson.teachers || []).forEach(tname => {
                        uniquePush(teacherMap, teachers, tname, name => ({
                            id: 'T:' + name, name
                        }));
                    });
                    // rooms (lista de nomes)
                    (lesson.classrooms || []).forEach(rname => {
                        uniquePush(roomMap, rooms, rname, name => ({
                            id: 'R:' + name, name
                        }));
                    });
                });
            });
        });

        // 3) initialAllocations: só marca o INÍCIO de cada bloco (dur=1) pra grid saber onde tem algo;
        //    a fusão e duração > 1 continuam sendo tratadas quando você clicar/editar. Para pré-visualizar,
        //    vamos usar initialUnallocated vazio (ou você pode gerar cards das “sobras”, se vier no AG).
        const P = meta.periods.length;
        const classIndexById = Object.fromEntries(classes.map((c, idx) => [c.id, idx]));
        const initialAllocations = {};

        (agPayload.classes || []).forEach(c => {
            const ci = classIndexById[String(c.class_id)];
            if (ci == null) return;
            const indices = [];
            (c.days || []).forEach(d => {
                const dayIdx = DAY_INDEX[d.day];
                (d.lessons || []).forEach(lesson => {
                    const pStart = Number(lesson.period_start_index || 0);
                    const linear = (dayIdx * P) + pStart;
                    indices.push(linear);
                });
            });
            initialAllocations[ci] = indices;
        });

        // 4) initialUnallocated (vazio por enquanto)
        const initialUnallocated = [];

        return { meta, classes, teachers, subjects, rooms, initialAllocations, initialUnallocated };
    }

    /**
     * Converte o payload do AG para o formato do vizualizar (consolidatedSchedule no localStorage).
     * Usa o "meta" (seu arquivo local) para saber quantos períodos existem e manter cores/labels.
     */
    function adaptAGForViewer(meta, agPayload) {
        // monta allocations no formato do viz: { classId, day, start, duration, subjectId, teacherIds, roomId }
        // mas aqui usaremos nomes diretos (mantendo compatibilidade com vizualizar.js atual que lê title via nomes).
        const classes = [];
        const teachers = [];
        const subjects = [];
        const rooms = [];

        const subjMap = new Map();
        const teacherMap = new Map();
        const roomMap = new Map();
        const classMap = new Map();

        (agPayload.classes || []).forEach(c => {
            uniquePush(classMap, classes, String(c.class_id), id => ({
                id, name: c.class_name || String(c.class_id)
            }));
        });

        (agPayload.classes || []).forEach(c => {
            (c.days || []).forEach(d => {
                (d.lessons || []).forEach(lesson => {
                    (lesson.subject_names || []).forEach(sname => {
                        uniquePush(subjMap, subjects, sname, name => ({
                            id: 'S:' + name, name, abbr: makeAbbr(name)
                        }));
                    });
                    (lesson.teachers || []).forEach(tname => {
                        uniquePush(teacherMap, teachers, tname, name => ({
                            id: 'T:' + name, name
                        }));
                    });
                    (lesson.classrooms || []).forEach(rname => {
                        uniquePush(roomMap, rooms, rname, name => ({
                            id: 'R:' + name, name
                        }));
                    });
                });
            });
        });

        const teacherIdByName = Object.fromEntries(teachers.map(t => [t.name, t.id]));
        const roomIdByName = Object.fromEntries(rooms.map(r => [r.name, r.id]));
        const subjIdByName = Object.fromEntries(subjects.map(s => [s.name, s.id]));
        const P = meta.periods.length;

        const allocations = [];
        (agPayload.classes || []).forEach(c => {
            const classId = String(c.class_id);
            (c.days || []).forEach(d => {
                const dayIdx = DAY_INDEX[d.day];
                (d.lessons || []).forEach(lesson => {
                    const start = Number(lesson.period_start_index || 0);
                    const duration = Number(lesson.duration_periods || 1);
                    const subjName = (lesson.subject_names && lesson.subject_names[0]) || '---';
                    const subjectId = subjIdByName[subjName] || ('S:' + subjName);
                    const teacherIds = (lesson.teachers || []).map(n => teacherIdByName[n] || ('T:' + n));
                    const roomId = lesson.classrooms?.[0] ? (roomIdByName[lesson.classrooms[0]] || ('R:' + lesson.classrooms[0])) : undefined;

                    allocations.push({
                        classId,
                        day: dayIdx,
                        start,
                        duration,
                        subjectId,
                        teacherIds,
                        roomId
                    });
                });
            });
        });

        return { meta, classes, teachers, subjects, rooms, allocations };
    }

    // expõe no window para uso no app/viz
    window.AG_ADAPTER = {
        adaptAGForEditor,
        adaptAGForViewer
    };
})();
