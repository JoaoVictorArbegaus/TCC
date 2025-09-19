/* js/data.js — fonte única de dados da TELA DE EDIÇÃO
   - meta (dias/turnos)
   - classes (turmas)
   - subjects (com sigla abbr)
   - teachers
   - initialAllocations (por índice de turma)
   - initialUnallocated (cards não alocados)
*/

window.EDITOR_DATA = (function(){
  const meta = {
    days: ['SEG','TER','QUA','QUI','SEX','SAB'],
    periods: [
      { code:'M1', start:'08:00', band:'M' }, { code:'M2', start:'08:55', band:'M' },
      { code:'M3', start:'10:10', band:'M' }, { code:'M4', start:'11:00', band:'M' },
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
    { id:'t1',  name:'Prof. Silva'    },
    { id:'t2',  name:'Prof. Santos'   },
    { id:'t3',  name:'Prof. Costa'    },
    { id:'t4',  name:'Prof. Lima'     },
    { id:'t5',  name:'Prof. Oliveira' },
    { id:'t6',  name:'Prof. Ferreira' },
    { id:'t7',  name:'Prof. Almeida'  },
    { id:'t8',  name:'Prof. Rocha'    },
    { id:'t9',  name:'Prof. Azevedo'  },
    { id:'t10', name:'Prof. Pereira'  },
    { id:'t11', name:'Prof. Barbosa'  },
    { id:'t12', name:'Prof. Nunes'    },
  ];

  const subjects = [
    { id:'mat', name:'Matemática',      abbr:'MAT' },
    { id:'por', name:'Português',       abbr:'POR' },
    { id:'his', name:'História',        abbr:'HIS' },
    { id:'geo', name:'Geografia',       abbr:'GEO' },
    { id:'cie', name:'Ciências',        abbr:'CIE' },
    { id:'ing', name:'Inglês',          abbr:'ING' },
    { id:'edf', name:'Ed. Física',      abbr:'EDF' },
    { id:'art', name:'Artes',           abbr:'ART' },
    { id:'fis', name:'Física',          abbr:'FIS' },
    { id:'qui', name:'Química',         abbr:'QUI' },
    { id:'bio', name:'Biologia',        abbr:'BIO' },
    { id:'soc', name:'Sociologia',      abbr:'SOC' },
  ];

  // Pré-alocações iniciais por ÍNDICE da turma (0..7).
  // Os valores são índices lineares: (dia * 12) + período
  const initialAllocations = {
    0: [0, 12, 24, 36, 48, 60],     // CC1
    1: [1, 13, 25, 37, 49, 61],     // CC2
    2: [2, 14, 26, 38, 50, 62],     // CC3
    3: [3, 15, 27, 39, 51, 63],     // CC4
    4: [16, 28, 40, 52],            // CC5 (tarde)
    5: [17, 29, 41, 53],            // CC6
    6: [8, 20, 32, 44],             // CC7 (noite)
    7: [9, 21, 33, 45],             // CC8
  };

  // Cards de aulas não alocadas iniciais (diversas)
  const initialUnallocated = [
    { id:'u1',  classId:'CC1', subjectId:'mat', teacherIds:['t1'],  duration:2 },
    { id:'u2',  classId:'CC2', subjectId:'por', teacherIds:['t2'],  duration:1 },
    { id:'u3',  classId:'CC3', subjectId:'his', teacherIds:['t3'],  duration:2 },
    { id:'u4',  classId:'CC4', subjectId:'geo', teacherIds:['t4'],  duration:1 },
    { id:'u5',  classId:'CC5', subjectId:'cie', teacherIds:['t5'],  duration:1 },
    { id:'u6',  classId:'CC6', subjectId:'ing', teacherIds:['t6'],  duration:2 },
    { id:'u7',  classId:'CC7', subjectId:'fis', teacherIds:['t10'], duration:1 },
    { id:'u8',  classId:'CC8', subjectId:'qui', teacherIds:['t9'],  duration:2 },
    { id:'u9',  classId:'CC1', subjectId:'bio', teacherIds:['t11'], duration:1 },
    { id:'u10', classId:'CC2', subjectId:'art', teacherIds:['t8'],  duration:1 },
    { id:'u11', classId:'CC3', subjectId:'edf', teacherIds:['t7'],  duration:1 },
    { id:'u12', classId:'CC4', subjectId:'soc', teacherIds:['t2'],  duration:1 },
  ];

  return { meta, classes, teachers, subjects, initialAllocations, initialUnallocated };
})();
