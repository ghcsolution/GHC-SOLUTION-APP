export interface PhotoField {
  id: string;
  label: string;
}

export interface PhotoSection {
  title: string;
  fields: PhotoField[];
}

export const VISTORIA_PHOTO_SECTIONS: PhotoSection[] = [
  {
    title: 'SOLO',
    fields: [
      { id: '5_1', label: 'FOTO 5.1 PANORAMICA ENTRADA SITE' },
      { id: '5_2', label: 'FOTO 5.2 PORTÃO DO SITE' },
      { id: '5_3', label: 'FOTO 5.3 PROTECIONAL MURO (Concertina / Mandíbula)' },
      { id: '5_4', label: 'FOTO 5.4 CADEADO ACESSO PRINCIPAL' },
      { id: '5_5', label: 'FOTO 5.5 PLACA DA TORRE' },
      { id: '5_6', label: 'FOTO 5.6 COORDENADAS GPS' },
      { id: '5_7', label: 'FOTO 5.7 ENTRADA DE ENERGIA' },
      { id: '5_8', label: 'FOTO 5.8 PROTEÇÃO MEDIDOR' },
      { id: '5_9', label: 'FOTO 5.9 MEDIDOR LEGIVEL' },
      { id: '5_10', label: 'FOTO 5.10 POSTE DE ENTRADA ENERGIA' },
      { id: '5_11', label: 'FOTO 5.11 BENGALA ENTRADA DE FO' },
      { id: '5_12', label: 'FOTO 5.12 GERAL SITE VISTA PORTÃO ABERTO' },
      { id: '5_13', label: 'FOTO 5.13 FOTO TORRE PARA CANTO "A"' },
      { id: '5_14', label: 'FOTO 5.13 FOTO TORRE PARA CANTO "B"' },
      { id: '5_15', label: 'FOTO 5.15 FOTO TORRE PARA CANTO "C"' },
      { id: '5_16', label: 'FOTO 5.16 FOTO TORRE PARA CANTO "D"' },
      { id: '5_17', label: 'FOTO 5.17 FOTO CANTO PARA TORRE "A"' },
      { id: '5_18', label: 'FOTO 5.18 FOTO CANTO PARA TORRE "B"' },
      { id: '5_19', label: 'FOTO 5.19 FOTO CANTO PARA TORRE "C"' },
      { id: '5_20', label: 'FOTO 5.20 FOTO CANTO PARA TORRE "D"' },
      { id: '5_21', label: 'FOTO 5.21 FOTO BASE DA TORRE' },
      { id: '5_22', label: 'FOTO 5.22 FOTO GABINETE / GRADIL FECHADO' },
      { id: '5_23', label: 'FOTO 5.23 FOTO CADEADO GRADIL' },
      { id: '5_24', label: 'FOTO 5.24 FOTO GABINETE / GRADIL ABERTO' },
      { id: '5_25', label: 'FOTO 5.25 FOTO QM / GRADIL FECHADO' },
      { id: '5_26', label: 'FOTO 5.26 FOTO CADEADO QM' },
      { id: '5_27', label: 'FOTO 5.27 FOTO QM / GRADIL ABERTO' },
      { id: '5_28', label: 'FOTO 5.28 FOTO DISJUNTOR GERAL QM' },
      { id: '5_29', label: 'FOTO 5.29 FOTO DISJUNTOR CLARO QM' },
      { id: '5_30', label: 'FOTO 5.30 FOTO QTM / GRADIL FECHADO' },
      { id: '5_31', label: 'FOTO 5.31 FOTO CADEADO QTM' },
      { id: '5_32', label: 'FOTO 5.32 FOTO QTM / GRADIL ABERTO' },
      { id: '5_33', label: 'FOTO 5.33 FOTO DISJUNTOR GERAL QTM' },
      { id: '5_34', label: 'FOTO 5.34 FOTO DISJUNTOR CLARO QTM' },
      { id: '5_35', label: 'FOTO 5.35 Posição dos gabinetes e RRUs 1' },
      { id: '5_36', label: 'FOTO 5.36 Posição dos gabinetes e RRUs 2' },
      { id: '5_37', label: 'FOTO 5.37 Posição dos gabinetes e RRUs 3' },
      { id: '5_38', label: 'FOTO 5.38 Foto aproximada portas da BB/DU 1' },
      { id: '5_39', label: 'FOTO 5.39 Foto aproximada portas da BB/DU 2' },
      { id: '5_40', label: 'FOTO 5.40 Foto aproximada portas da BB/DU 3' },
      { id: '5_41', label: 'FOTO 5.41 Foto aproximada portas da BB/DU 4' },
      { id: '5_42', label: 'FOTO 5.42 Foto aproximada portas da BB/DU 5' },
      { id: '5_43', label: 'FOTO 5.43 PASSAGEM DE CABOS HORIZONTAL 1' },
      { id: '5_44', label: 'FOTO 5.44 PASSAGEM DE CABOS HORIZONTAL 2' },
      { id: '5_45', label: 'FOTO 5.45 PASSAGEM DE CABOS HORIZONTAL 3' },
      { id: '5_46', label: 'FOTO 5.46 PASSAGEM DE CABOS HORIZONTAL 4' },
      { id: '5_47', label: 'FOTO 5.47 PASSAGEM DE CABOS VERTICAL 1' },
      { id: '5_48', label: 'FOTO 5.48 PASSAGEM DE CABOS VERTICAL 2' },
      { id: '5_49', label: 'FOTO 5.49 PASSAGEM DE CABOS VERTICAL 3' },
      { id: '5_50', label: 'FOTO 5.50 PASSAGEM DE CABOS VERTICAL 4' },
      { id: '5_51', label: 'FOTO 5.51 Transmissão - ROUTER 1' },
      { id: '5_52', label: 'FOTO 5.52 Transmissão - ROUTER 2' },
      { id: '5_53', label: 'FOTO 5.53 Transmissão - DGO 1' },
      { id: '5_54', label: 'FOTO 5.54 Transmissão - DGO 2' },
      { id: '5_55', label: 'FOTO 5.55 Transmissão - MW 1' },
      { id: '5_56', label: 'FOTO 5.56 Transmissão - MW 2' },
      { id: '5_57', label: 'FOTO 5.57 EXTRA 1' },
      { id: '5_58', label: 'FOTO 5.58 EXTRA 2' },
      { id: '5_59', label: 'FOTO 5.59 EXTRA 3' },
      { id: '5_60', label: 'FOTO 5.60 EXTRA 4' },
      { id: '5_61', label: 'FOTO 5.61 EXTRA 5' },
    ]
  },
  {
    title: 'ENERGIA',
    fields: [
      { id: '6_1', label: 'FOTO 6.1 ENTRADA DE ENERGIA' },
      { id: '6_2', label: 'FOTO 6.2 DIAGRAMA UNIFILIAR DE AC' },
      { id: '6_3', label: 'FOTO 6.3 MEDIDOR LEGIVEL' },
      { id: '6_4', label: 'FOTO 6.4 DISJUNTO GERAL AMPERAGEM VISIVEL' },
      { id: '6_5', label: 'FOTO 6.5 DISJUNTOR GERAL CONSUMO FASE "R"' },
      { id: '6_6', label: 'FOTO 6.5 DISJUNTOR GERAL CONSUMO FASE "S"' },
      { id: '6_7', label: 'FOTO 6.7 DISJUNTOR GERAL CONSUMO FASE "T"' },
      { id: '6_8', label: 'FOTO 6.8 DISJUNTOR GERAL TENSÃO FASE "R-S"' },
      { id: '6_9', label: 'FOTO 6.9 DISJUNTOR GERAL TENSÃO FASE "S-T"' },
      { id: '6_10', label: 'FOTO 6.10 DISJUNTOR GERAL TENSÃO FASE "T-R"' },
      { id: '6_11', label: 'FOTO 6.11 DISJUNTOR GERAL TENSÃO FASE "R-N"' },
      { id: '6_12', label: 'FOTO 6.12 DISJUNTOR GERAL TENSÃO FASE "S-N"' },
      { id: '6_13', label: 'FOTO 6.13 DISJUNTOR GERAL TENSÃO FASE "T-N"' },
      { id: '6_14', label: 'FOTO 6.14 DISJUNTOR QTM AMPERAGEM VISIVEL' },
      { id: '6_15', label: 'FOTO 6.15 DISJUNTOR QTM<>GAB.1 CONSUMO FASE "R"' },
      { id: '6_16', label: 'FOTO 6.16 DISJUNTOR QTM<>GAB.1 CONSUMO FASE "S"' },
      { id: '6_17', label: 'FOTO 6.17 DISJUNTOR QTM<>GAB.1 CONSUMO FASE "T"' },
      { id: '6_18', label: 'FOTO 6.18 DISJUNTOR QTM<>GAB.2 CONSUMO FASE "R"' },
      { id: '6_19', label: 'FOTO 6.19 DISJUNTOR QTM<>GAB.2 CONSUMO FASE "S"' },
      { id: '6_20', label: 'FOTO 6.20 DISJUNTOR QTM<>GAB.2 CONSUMO FASE "T"' },
      { id: '6_21', label: 'FOTO 6.21 GAB.1 VISTA FRONTAL FONTE POSIÇÕES DOS RETIFICADORES E CONTROLADORA' },
      { id: '6_22', label: 'FOTO 6.22 GAB.1 VISTA FRONTAL CONTROLADORA CONSUMO' },
      { id: '6_23', label: 'FOTO 6.23 GAB.1 VISTA FRONTAL DISJUNTORES' },
      { id: '6_24', label: 'FOTO 6.24 GAB.1 VISTA FRONTAL DISJUNTORES RESERVADOS' },
      { id: '6_25', label: 'FOTO 6.25 DISJUNTOR BATERIAS' },
      { id: '6_26', label: 'FOTO 6.26 BANCO DE BATERIAS' },
      { id: '6_27', label: 'FOTO 6.27 MODELO BATERIA/ALARMES' },
      { id: '6_28', label: 'FOTO 6.28 TIPO TROCADOR DE CALOR' },
      { id: '6_29', label: 'FOTO 6.29 GAB.2 VISTA FRONTAL DISJUNTORES' },
      { id: '6_30', label: 'FOTO 6.30 GAB.2 VISTA FRONTAL DISJUNTORES RESERVADOS' },
      { id: '6_31', label: 'FOTO 6.31 GAB.2 DISJUNTOR BATERIAS' },
      { id: '6_32', label: 'FOTO 6.32 GAB.2 BANCO DE BATERIAS' },
      { id: '6_33', label: 'FOTO 6.33 GAB.2 MODELO BATERIA/ALARMES' },
      { id: '6_34', label: 'FOTO 6.34 GAB.2 TIPO TROCADOR DE CALOR' },
    ]
  },
  {
    title: 'TORRE - FACES (BAIXO PARA CIMA)',
    fields: [
      { id: '4_17', label: 'FOTO 4.17 FACE "A"' },
      { id: '4_18', label: 'FOTO 4.18 FACE "B"' },
      { id: '4_19', label: 'FOTO 4.19 FACE "C"' },
      { id: '4_20', label: 'FOTO 4.20 FACE "D" ou "Extra"' },
      { id: '4_26', label: 'FOTO 4.26 LINHA DE VIDA SOLO' },
    ]
  },
  {
    title: 'TORRE - FACES (CIMA PARA BAIXO)',
    fields: [
      { id: '4_13', label: 'FOTO 4.13 FACE "A"' },
      { id: '4_14', label: 'FOTO 4.14 FACE "B"' },
      { id: '4_15', label: 'FOTO 4.15 FACE "C"' },
      { id: '4_16', label: 'FOTO 4.16 FACE "D" ou "Extra"' },
      { id: '4_21', label: 'FOTO 4.21 Vista de cima (Frente site)' },
      { id: '4_22', label: 'FOTO 4.22 Vista de cima (Fundo site)' },
    ]
  },
  {
    title: 'TORRE - PANORAMICA (TOPO)',
    fields: [
      { id: '4_1', label: 'FOTO 4.1 0º' },
      { id: '4_2', label: 'FOTO 4.2 30º' },
      { id: '4_3', label: 'FOTO 4.3 60º' },
      { id: '4_4', label: 'FOTO 4.4 90º' },
      { id: '4_5', label: 'FOTO 4.5 120º' },
      { id: '4_6', label: 'FOTO 4.6 150º' },
      { id: '4_7', label: 'FOTO 4.7 180º' },
      { id: '4_8', label: 'FOTO 4.8 210º' },
      { id: '4_9', label: 'FOTO 4.9 240º' },
      { id: '4_10', label: 'FOTO 4.10 270º' },
      { id: '4_11', label: 'FOTO 4.11 300º' },
      { id: '4_12', label: 'FOTO 4.12 330º' },
    ]
  },
  {
    title: 'TORRE - ESTRUTURA',
    fields: [
      { id: '4_23', label: 'FOTO 4.23 ATERRAMENTO' },
      { id: '4_24', label: 'FOTO 4.24 BAIZAMENTO' },
      { id: '4_25', label: 'FOTO 4.24 PARA RAIO' },
      { id: '4_27', label: 'FOTO 4.27 LINHA DE VIDA TOPO' },
    ]
  },
  {
    title: 'ANTENA 1 - SETOR 1',
    fields: [
      { id: '1_1', label: 'FOTO 1.1 CONTRA VISADA SETOR 1' },
      { id: '1_2', label: 'FOTO 1.2 CONTRA VISADA (COM ZOOM) SETOR 1' },
      { id: '1_3', label: 'FOTO 1.3 VISADA SETOR 1' },
      { id: '1_4', label: 'FOTO 1.4 TILT MECANICO SETOR 1' },
      { id: '1_5', label: 'FOTO 1.5 RRU EXISTENTE 1' },
      { id: '1_6', label: 'FOTO 1.6 RRU EXISTENTE 2' },
      { id: '1_7', label: 'FOTO 1.7 ALTURA ANTENA' },
    ]
  },
  {
    title: 'ANTENA 1 - SETOR 2',
    fields: [
      { id: '2_1', label: 'FOTO 2.1 CONTRA VISADA SETOR 2' },
      { id: '2_2', label: 'FOTO 2.2 CONTRA VISADA (COM ZOOM) SETOR 2' },
      { id: '2_3', label: 'FOTO 2.3 VISADA SETOR 2' },
      { id: '2_4', label: 'FOTO 2.4 TILT MECANICO SETOR 2' },
      { id: '2_5', label: 'FOTO 2.5 RRU EXISTENTE 1' },
      { id: '2_6', label: 'FOTO 2.6 RRU EXISTENTE 2' },
      { id: '2_7', label: 'FOTO 2.7 ALTURA ANTENA' },
    ]
  },
  {
    title: 'ANTENA 1 - SETOR 3',
    fields: [
      { id: '3_1', label: 'FOTO 3.1 CONTRA VISADA SETOR 3' },
      { id: '3_2', label: 'FOTO 3.2 CONTRA VISADA (COM ZOOM) SETOR 3' },
      { id: '3_3', label: 'FOTO 3.3 VISADA SETOR 3' },
      { id: '3_4', label: 'FOTO 3.4 TILT MECANICO SETOR 3' },
      { id: '3_5', label: 'FOTO 3.5 RRU EXISTENTE 1' },
      { id: '3_6', label: 'FOTO 3.6 RRU EXISTENTE 2' },
      { id: '3_7', label: 'FOTO 3.7 ALTURA ANTENA' },
    ]
  },
  {
    title: 'ANTENA 2 - SETOR 1',
    fields: [
      { id: '1_21', label: 'FOTO 1.21 CONTRA VISADA SETOR 1' },
      { id: '1_22', label: 'FOTO 1.22 CONTRA VISADA (COM ZOOM) SETOR 1' },
      { id: '1_23', label: 'FOTO 1.23 VISADA SETOR 1' },
      { id: '1_24', label: 'FOTO 1.24 TILT MECANICO SETOR 1' },
      { id: '1_25', label: 'FOTO 1.25 RRU EXISTENTE 1' },
      { id: '1_26', label: 'FOTO 1.26 RRU EXISTENTE 2' },
      { id: '1_27', label: 'FOTO 1.27 ALTURA ANTENA' },
    ]
  },
  {
    title: 'ANTENA 2 - SETOR 2',
    fields: [
      { id: '2_21', label: 'FOTO 2.21 CONTRA VISADA SETOR 2' },
      { id: '2_22', label: 'FOTO 2.22 CONTRA VISADA (COM ZOOM) SETOR 2' },
      { id: '2_23', label: 'FOTO 2.23 VISADA SETOR 2' },
      { id: '2_24', label: 'FOTO 2.24 TILT MECANICO SETOR 2' },
      { id: '2_25', label: 'FOTO 2.25 RRU EXISTENTE 1' },
      { id: '2_26', label: 'FOTO 2.26 RRU EXISTENTE 2' },
      { id: '2_27', label: 'FOTO 2.27 ALTURA ANTENA' },
    ]
  },
  {
    title: 'ANTENA 2 - SETOR 3',
    fields: [
      { id: '3_21', label: 'FOTO 3.21 CONTRA VISADA SETOR 3' },
      { id: '3_22', label: 'FOTO 3.22 CONTRA VISADA (COM ZOOM) SETOR 3' },
      { id: '3_23', label: 'FOTO 3.23 VISADA SETOR 3' },
      { id: '3_24', label: 'FOTO 3.24 TILT MECANICO SETOR 3' },
      { id: '3_25', label: 'FOTO 3.25 RRU EXISTENTE 1' },
      { id: '3_26', label: 'FOTO 3.26 RRU EXISTENTE 2' },
      { id: '3_27', label: 'FOTO 3.27 ALTURA ANTENA' },
    ]
  },
  {
    title: 'ANTENA 3 - SETOR 1',
    fields: [
      { id: '1_31', label: 'FOTO 1.31 CONTRA VISADA SETOR 1' },
      { id: '1_32', label: 'FOTO 1.32 CONTRA VISADA (COM ZOOM) SETOR 1' },
      { id: '1_33', label: 'FOTO 1.33 VISADA SETOR 1' },
      { id: '1_34', label: 'FOTO 1.34 TILT MECANICO SETOR 1' },
      { id: '1_35', label: 'FOTO 1.35 RRU EXISTENTE 1' },
      { id: '1_36', label: 'FOTO 1.36 RRU EXISTENTE 2' },
      { id: '1_37', label: 'FOTO 1.37 ALTURA ANTENA' },
    ]
  },
  {
    title: 'ANTENA 3 - SETOR 2',
    fields: [
      { id: '2_31', label: 'FOTO 2.31 CONTRA VISADA SETOR 2' },
      { id: '2_32', label: 'FOTO 2.32 CONTRA VISADA (COM ZOOM) SETOR 2' },
      { id: '2_33', label: 'FOTO 2.33 VISADA SETOR 2' },
      { id: '2_34', label: 'FOTO 2.34 TILT MECANICO SETOR 2' },
      { id: '2_35', label: 'FOTO 2.35 RRU EXISTENTE 1' },
      { id: '2_36', label: 'FOTO 2.36 RRU EXISTENTE 2' },
      { id: '2_37', label: 'FOTO 2.37 ALTURA ANTENA' },
    ]
  },
  {
    title: 'ANTENA 3 - SETOR 3',
    fields: [
      { id: '3_31', label: 'FOTO 3.31 CONTRA VISADA SETOR 3' },
      { id: '3_32', label: 'FOTO 3.32 CONTRA VISADA (COM ZOOM) SETOR 3' },
      { id: '3_33', label: 'FOTO 3.33 VISADA SETOR 3' },
      { id: '3_34', label: 'FOTO 3.34 TILT MECANICO SETOR 3' },
      { id: '3_35', label: 'FOTO 3.35 RRU EXISTENTE 1' },
      { id: '3_36', label: 'FOTO 3.36 RRU EXISTENTE 2' },
      { id: '3_37', label: 'FOTO 3.37 ALTURA ANTENA' },
    ]
  }
];
