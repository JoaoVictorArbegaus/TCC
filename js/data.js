/* js/data.js — fonte única de dados da TELA DE EDIÇÃO
   - meta (dias/turnos)
   - classes (turmas)
   - subjects (com sigla abbr)
   - teachers
   - rooms (NOVO)
   - initialAllocations (por índice de turma)
   - initialUnallocated (cards não alocados, agora com roomId)
*/

window.EDITOR_DATA = (function(){
  const meta = {
    days: ['SEG','TER','QUA','QUI','SEX','SAB'],
    periods: [
      { code:'M1', start:'08:00', band:'M' }, { code:'M2', start:'08:55', band:'M' },
      { code:'M3', start:'10:10', band:'M' }, { code:'M4', start:'11:05', band:'M' },
      { code:'T1', start:'13:30', band:'T' }, { code:'T2', start:'14:25', band:'T' },
      { code:'T3', start:'15:40', band:'T' }, { code:'T4', start:'16:35', band:'T' },
      { code:'N1', start:'19:00', band:'N' }, { code:'N2', start:'19:45', band:'N' },
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

  // NOVO: salas (placeholders)
  const rooms = [
    { id:'R101', name:'Sala 101' },
    { id:'R102', name:'Sala 102' },
    { id:'R201', name:'Sala 201' },
    { id:'LAB1', name:'Laboratório 1' },
    { id:'AUD',  name:'Auditório' }
  ];

  const subjects = [
    { id:'prg', name:'Programação',                abbr:'PRG' },
    { id:'red', name:'Redes de Computadores',      abbr:'RED' },
    { id:'eso', name:'Engenharia de Software',     abbr:'ESO' },
    { id:'cal', name:'Cálculo',                    abbr:'CAL' },
    { id:'cmp', name:'Compiladores',               abbr:'CMP' },
    { id:'sis', name:'Sistemas Operacionais',      abbr:'SO'  },
    { id:'ban', name:'Banco de Dados',             abbr:'BD'  },
    { id:'ia',  name:'Inteligência Artificial',    abbr:'IA'  },
    { id:'alg', name:'Algoritmos',                 abbr:'ALG' },
    { id:'seg', name:'Segurança da Informação',    abbr:'SEG' },
    { id:'arq', name:'Arquitetura de Computadores',abbr:'ARQ' },
    { id:'ppi', name:'Projeto e Prática Integrada',abbr:'PPI' },
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

  // Cards de aulas não alocadas iniciais (agora com roomId)
  const initialUnallocated = [
    { id:'u1',  classId:'CC1', subjectId:'prg', teacherIds:['t1'],  roomId:'R101', duration:3 },
    { id:'u2',  classId:'CC2', subjectId:'red', teacherIds:['t2'],  roomId:'R102', duration:1 },
    { id:'u3',  classId:'CC3', subjectId:'eso', teacherIds:['t3'],  roomId:'R201', duration:2 },
    { id:'u4',  classId:'CC4', subjectId:'cal', teacherIds:['t4'],  roomId:'R101', duration:1 },
    { id:'u5',  classId:'CC5', subjectId:'cmp', teacherIds:['t5'],  roomId:'LAB1', duration:1 },
    { id:'u6',  classId:'CC6', subjectId:'sis', teacherIds:['t6'],  roomId:'R102', duration:2 },
    { id:'u7',  classId:'CC7', subjectId:'ban', teacherIds:['t10'], roomId:'LAB1', duration:1 },
    { id:'u8',  classId:'CC8', subjectId:'ia',  teacherIds:['t9'],  roomId:'LAB1', duration:2 },
    { id:'u9',  classId:'CC1', subjectId:'alg', teacherIds:['t11'], roomId:'R201', duration:1 },
    { id:'u10', classId:'CC2', subjectId:'seg', teacherIds:['t8'],  roomId:'AUD',  duration:1 },
    { id:'u11', classId:'CC3', subjectId:'arq', teacherIds:['t7'],  roomId:'AUD',  duration:1 },
    { id:'u12', classId:'CC4', subjectId:'ppi', teacherIds:['t2'],  roomId:'R101', duration:1 },
  ];

  return { meta, classes, teachers, subjects, rooms, initialAllocations, initialUnallocated };
})();
