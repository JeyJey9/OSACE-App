/**
 * Normalized building data and rooms index for OSACE Indoor Map.
 * Auto-generated from OSACE_building.json with corrections applied.
 */

export const MAP_DIMENSIONS = {
  width: 1346.8,
  height: 1392.0,
  viewBox: "0 0 1346.8 1392.0",
};

export const ROOM_TYPE_COLORS = {
  light: {
    classroom: '#d6e7fb',
    laboratory: '#d6e7fb',
    office: '#e3f3e6',
    cabinet: '#e3f3e6',
    amphitheatre: '#ece4fb',
    'student-space': '#fdf3cd',
    entrance: '#dcfce7',
    service: '#f0f2f5',
    'other-public-space': '#f0f2f5',
    technical: '#f4f5f7',
    corridor: '#eef4fa',
    default: '#f8fafc',
    stroke: '#8a93a3',
    selectedFill: '#0284c7',
    selectedStroke: '#0369a1',
  },
  dark: {
    classroom: '#1e3a5f',
    laboratory: '#1e3a5f',
    office: '#1a3d2e',
    cabinet: '#1a3d2e',
    amphitheatre: '#362359',
    'student-space': '#4d3d14',
    entrance: '#064e3b',
    service: '#2a2f3a',
    'other-public-space': '#2a2f3a',
    technical: '#252932',
    corridor: '#1c2433',
    default: '#1e293b',
    stroke: '#475569',
    selectedFill: '#38bdf8',
    selectedStroke: '#7dd3fc',
  },
};

export const buildingFloors = {
  "B": {
    "id": "B",
    "name": "Demisol",
    "shortName": "B",
    "order": 0,
    "page": 1,
    "svg": "OSACE_B_Demisol.svg",
    "rooms": [
      {
        "id": "corridor-GD01",
        "code": "GD01",
        "name": "GD01 (Hol Demisol)",
        "type": "corridor",
        "floor": "B",
        "level": "-2.63",
        "area_plan_m2": 136.05,
        "area_calc_m2": 137.8,
        "confidence": "high",
        "labelPos": {
          "x": 340.0,
          "y": 880.0
        },
        "center": {
          "x": 340.0,
          "y": 880.0
        },
        "bounds": {
          "minX": 14.5,
          "minY": 822.7,
          "maxX": 567.2,
          "maxY": 942.4,
          "width": 552.7,
          "height": 119.7
        },
        "pathData": "M 14.5 822.7 L 14.5 942.4 L 567.2 942.4 L 567.2 889.8 L 552.7 889.8 L 552 887.3 L 434.8 887.3 L 434.1 879.9 L 419.6 879.9 L 419 889.8 L 409.1 889.8 L 408 876.7 L 408.3 822.7 L 355.8 822.7 L 355.8 829 L 350.1 830.1 L 265.1 829.8 L 264.3 824.8 L 156 824.8 L 155.3 829.8 L 145.4 829.8 L 144.7 824.8 L 36 824.8 L 36 829 L 32.1 829.8 L 31.4 848.8 L 29.6 848.1 L 29.6 829.8 L 24.7 829 L 24.7 822.7 Z",
        "wing": "Corp G",
        "isCorridor": true,
        "isTechnical": false
      },
      {
        "id": "room-GD04",
        "code": "GD04",
        "name": "Intrarea Principală",
        "type": "entrance",
        "floor": "B",
        "level": "-2.63",
        "area_plan_m2": 71.38,
        "area_calc_m2": 71.4,
        "confidence": "high",
        "labelPos": {
          "x": 389.0,
          "y": 990.0
        },
        "center": {
          "x": 389.0,
          "y": 1011.0
        },
        "bounds": {
          "minX": 269.3,
          "minY": 942.4,
          "maxX": 508.6,
          "maxY": 1079.7,
          "width": 239.3,
          "height": 137.3
        },
        "pathData": "M 269.3 942.4 L 508.6 942.4 L 508.6 1079.7 L 269.3 1079.7 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-GD02",
        "code": "GD02",
        "name": "ASOCIATIE STUDENTI",
        "type": "student-space",
        "floor": "B",
        "level": "-2.63",
        "area_plan_m2": 35.03,
        "area_calc_m2": 34.3,
        "confidence": "high",
        "labelPos": {
          "x": 89.6,
          "y": 1003.8
        },
        "center": {
          "x": 89.6,
          "y": 1003.8
        },
        "bounds": {
          "minX": 31.1,
          "minY": 944.8,
          "maxX": 148.2,
          "maxY": 1065.2,
          "width": 117.1,
          "height": 120.4
        },
        "pathData": "M 36 944.8 L 36 949 L 31.1 949.8 L 31.1 1058.1 L 36 1058.8 L 36 1065.2 L 140.5 1065.2 L 140.5 1045 L 148.2 1044.4 L 148.2 953.7 L 120.7 953.7 L 120 944.8 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-GD03",
        "code": "GD03",
        "name": "ASOCIATIE STUDENTI",
        "type": "student-space",
        "floor": "B",
        "level": "-2.63",
        "area_plan_m2": 34.9,
        "area_calc_m2": 34.2,
        "confidence": "high",
        "labelPos": {
          "x": 208.2,
          "y": 1002.7
        },
        "center": {
          "x": 208.2,
          "y": 1002.7
        },
        "bounds": {
          "minX": 152.1,
          "minY": 944.8,
          "maxX": 269.3,
          "maxY": 1065.2,
          "width": 117.2,
          "height": 120.4
        },
        "pathData": "M 152.1 953.7 L 152.1 1044.4 L 159.9 1045 L 159.9 1065.2 L 264.3 1065.2 L 264.3 1058.8 L 269.3 1058.1 L 269.3 1009.8 L 264.3 1009.1 L 264.3 998.8 L 269.3 998.1 L 269.3 949.8 L 265.1 949.8 L 264.3 944.8 L 180.4 944.8 L 179.6 953.7 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-GD05",
        "code": "GD05",
        "name": "COPIATOR",
        "type": "other-public-space",
        "floor": "B",
        "level": "-2.63",
        "area_plan_m2": 6.91,
        "area_calc_m2": 6.6,
        "confidence": "high",
        "labelPos": {
          "x": 530.1,
          "y": 1026.4
        },
        "center": {
          "x": 530.1,
          "y": 1026.4
        },
        "bounds": {
          "minX": 508.6,
          "minY": 1004.8,
          "maxX": 552,
          "maxY": 1065.2,
          "width": 43.4,
          "height": 60.4
        },
        "pathData": "M 508.6 1004.8 L 508.6 1065.2 L 548.1 1065.2 L 548.1 1058.8 L 552 1058.1 L 552 1004.8 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "corridor-ID01",
        "code": "ID01",
        "name": "HOL",
        "type": "corridor",
        "floor": "B",
        "level": "-2.63",
        "area_plan_m2": 99.26,
        "area_calc_m2": 70.6,
        "confidence": "medium",
        "labelPos": {
          "x": 849.9,
          "y": 936.3
        },
        "center": {
          "x": 849.9,
          "y": 936.3
        },
        "bounds": {
          "minX": 556.0,
          "minY": 884.8,
          "maxX": 920.5,
          "maxY": 1031.3,
          "width": 364.5,
          "height": 146.5
        },
        "pathData": "M 556.0 885.2 L 769.0 885.2 L 769.0 889.8 L 778.6 889.8 L 779.3 884.8 L 827.6 884.8 L 828.4 889.8 L 838.6 889.8 L 839.3 884.8 L 920.5 884.8 L 920.5 998.1 L 887.7 998.8 L 887.7 1031.3 L 838.9 1031.3 L 839.3 998.8 L 829 998.1 L 828.4 981.2 L 779.3 981.2 L 778.6 938.5 L 556.0 938.5 Z",
        "wing": "Corp I",
        "isCorridor": true,
        "isTechnical": false
      },
      {
        "id": "corridor-ID02",
        "code": "ID02",
        "name": "HOL",
        "type": "corridor",
        "floor": "B",
        "level": "-3.33",
        "area_plan_m2": 38.67,
        "area_calc_m2": 32.6,
        "confidence": "high",
        "labelPos": {
          "x": 983.3,
          "y": 962.8
        },
        "center": {
          "x": 983.3,
          "y": 962.8
        },
        "bounds": {
          "minX": 920.5,
          "minY": 884.1,
          "maxX": 1067.3,
          "maxY": 1031.3,
          "width": 146.8,
          "height": 147.2
        },
        "pathData": "M 920.5 884.1 L 1045 884.1 L 1045 986.8 L 1067.3 1009.4 L 1067.3 1031.3 L 1019 1031.3 L 1019 998.8 L 1008.3 998.1 L 1007.7 1031.3 L 958.9 1031.3 L 958.3 998.1 L 920.5 998.1 Z",
        "wing": "Corp I",
        "isCorridor": true,
        "isTechnical": false
      },
      {
        "id": "room-ID03",
        "code": "ID03",
        "name": "LABORATOR MULTIMEDIA",
        "type": "laboratory",
        "floor": "B",
        "level": "-2.63",
        "area_plan_m2": 44.17,
        "area_calc_m2": 40.3,
        "confidence": "high",
        "labelPos": {
          "x": 660.7,
          "y": 1003.8
        },
        "center": {
          "x": 660.7,
          "y": 1003.8
        },
        "bounds": {
          "minX": 577.8,
          "minY": 942.4,
          "maxX": 715.4,
          "maxY": 1068.4,
          "width": 137.6,
          "height": 126
        },
        "pathData": "M 715.4 949.8 L 708.7 949.8 L 708 942.4 L 659.3 942.4 L 658.6 949.8 L 577.8 949.8 L 577.8 998.1 L 599.3 998.8 L 598.6 1009.8 L 577.8 1009.4 L 577.8 1058.1 L 599.7 1058.1 L 600.3 1068.4 L 648 1068.4 L 648.7 1058.1 L 658.6 1058.1 L 659.3 1068.4 L 708 1068.4 L 708 1058.8 L 715.4 1058.1 Z",
        "wing": "Corp I",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-ID04",
        "code": "ID04",
        "name": "BIROU",
        "type": "office",
        "floor": "B",
        "level": "-2.63",
        "area_plan_m2": 16.58,
        "area_calc_m2": 15.4,
        "confidence": "high",
        "labelPos": {
          "x": 747.2,
          "y": 977.7
        },
        "center": {
          "x": 747.2,
          "y": 977.7
        },
        "bounds": {
          "minX": 719.3,
          "minY": 949.8,
          "maxX": 775.4,
          "maxY": 1068.4,
          "width": 56.1,
          "height": 118.6
        },
        "pathData": "M 719.3 949.8 L 719.3 1068.4 L 762.7 1068.4 L 763.4 1065.2 L 767.7 1065.2 L 767.7 998.8 L 775.4 998.1 L 775.4 949.8 Z",
        "wing": "Corp I",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-ID09",
        "code": "ID09",
        "name": "BIROU",
        "type": "office",
        "floor": "B",
        "level": "-3.33",
        "area_plan_m2": 7,
        "area_calc_m2": 6.7,
        "confidence": "high",
        "labelPos": {
          "x": 1059.5,
          "y": 1059.5
        },
        "center": {
          "x": 1059.5,
          "y": 1059.5
        },
        "bounds": {
          "minX": 1017.5,
          "minY": 1036.2,
          "maxX": 1082.8,
          "maxY": 1101.5,
          "width": 65.3,
          "height": 65.3
        },
        "pathData": "M 1028.8 1036.2 L 1017.5 1047.5 L 1071.9 1101.5 L 1082.8 1090.2 L 1082.8 1067.6 L 1080 1067 L 1080 1060.9 L 1082.8 1060.2 L 1082.8 1036.2 L 1058.8 1036.2 L 1058.1 1039.1 L 1051.8 1039.1 L 1051.1 1036.2 Z",
        "wing": "Corp I",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-B-amfiteatru",
        "code": "ACB",
        "name": "Aula Constantin Belea",
        "type": "amphitheatre",
        "floor": "B",
        "level": "",
        "area_plan_m2": 202.3,
        "area_calc_m2": 205.7,
        "confidence": "low",
        "labelPos": {
          "x": 934.4,
          "y": 1182.4
        },
        "center": {
          "x": 934.4,
          "y": 1182.4
        },
        "bounds": {
          "minX": 782.0,
          "minY": 1032.7,
          "maxX": 1086.7,
          "maxY": 1332,
          "width": 304.7,
          "height": 299.3
        },
        "pathData": "M 782.0 1032.7 L 782.0 1332 L 1086.7 1332 L 1086.7 1032.7 Z",
        "wing": "Corp Central",
        "isCorridor": false,
        "isTechnical": false
      }
    ],
    "stairs": [
      {
        "id": "stair-B-01",
        "annotation": "3 Tr.",
        "steps": 3,
        "connector_id": null,
        "x": 339.1,
        "y": 1110.5,
        "type": "level-change"
      },
      {
        "id": "stair-B-02",
        "annotation": "3 Tr.",
        "steps": 3,
        "connector_id": null,
        "x": 482.8,
        "y": 1111.9,
        "type": "level-change"
      },
      {
        "id": "stair-B-03",
        "annotation": "15 Tr.",
        "steps": 15,
        "connector_id": "vc-01",
        "x": 378.6,
        "y": 790.6,
        "type": "vertical-connector"
      },
      {
        "id": "stair-B-04",
        "annotation": "16 Tr.",
        "steps": 16,
        "connector_id": null,
        "x": 513.6,
        "y": 831.8,
        "type": "level-change"
      },
      {
        "id": "stair-B-05",
        "annotation": "15 Tr.",
        "steps": 15,
        "connector_id": null,
        "x": 334.6,
        "y": 120.8,
        "type": "level-change"
      },
      {
        "id": "stair-B-06",
        "annotation": "4 Tr.",
        "steps": 4,
        "connector_id": null,
        "x": 1150.6,
        "y": 855.5,
        "type": "level-change"
      },
      {
        "id": "stair-B-08",
        "annotation": "Intrare Aula",
        "steps": null,
        "connector_id": null,
        "x": 802.0,
        "y": 990.0,
        "type": "poi"
      },
      {
        "id": "stair-B-09",
        "annotation": "3 Tr.",
        "steps": 3,
        "connector_id": null,
        "x": 800.5,
        "y": 986,
        "type": "level-change"
      },
      {
        "id": "stair-B-10",
        "annotation": "15 Tr.",
        "steps": 15,
        "connector_id": "vc-04",
        "x": 945,
        "y": 901.3,
        "type": "vertical-connector"
      }
    ]
  },
  "P": {
    "id": "P",
    "name": "Parter",
    "shortName": "P",
    "order": 1,
    "page": 2,
    "svg": "OSACE_P_Parter.svg",
    "rooms": [
      {
        "id": "room-G003",
        "code": "G003",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "+1.05",
        "area_plan_m2": 17.11,
        "area_calc_m2": 11.6,
        "confidence": "medium",
        "labelPos": {
          "x": 308.8,
          "y": 1039.6
        },
        "center": {
          "x": 308.8,
          "y": 1039.6
        },
        "bounds": {
          "minX": 268.2,
          "minY": 1009.9,
          "maxX": 338.5,
          "maxY": 1079.8,
          "width": 70.3,
          "height": 69.9
        },
        "pathData": "M 268.2 1009.9 L 268.2 1043.8 L 279.9 1044.5 L 279.9 1068.1 L 278.8 1069.6 L 268.9 1069.6 L 268.9 1079.8 L 338.5 1079.8 L 338.5 1009.9 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G004",
        "code": "G004",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "+1.05",
        "area_plan_m2": 17.38,
        "area_calc_m2": 11.8,
        "confidence": "medium",
        "labelPos": {
          "x": 373.4,
          "y": 1041
        },
        "center": {
          "x": 373.4,
          "y": 1041
        },
        "bounds": {
          "minX": 342.4,
          "minY": 1009.9,
          "maxX": 412.2,
          "maxY": 1079.8,
          "width": 69.8,
          "height": 69.9
        },
        "pathData": "M 342.4 1009.9 L 342.4 1079.8 L 412.2 1079.8 L 412.2 1069.6 L 404.1 1068.9 L 404.1 1044.5 L 412.2 1043.8 L 412.2 1009.9 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G005",
        "code": "G005",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "+1.05",
        "area_plan_m2": 17.41,
        "area_calc_m2": 11.9,
        "confidence": "medium",
        "labelPos": {
          "x": 454.6,
          "y": 1041.3
        },
        "center": {
          "x": 454.6,
          "y": 1041.3
        },
        "bounds": {
          "minX": 416.1,
          "minY": 1009.9,
          "maxX": 486,
          "maxY": 1079.8,
          "width": 69.9,
          "height": 69.9
        },
        "pathData": "M 416.1 1009.9 L 416.1 1043.8 L 423.5 1044.5 L 423.5 1068.9 L 416.1 1069.6 L 416.1 1079.8 L 486 1079.8 L 486 1009.9 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G006",
        "code": "G006",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "+1.05",
        "area_plan_m2": 17.12,
        "area_calc_m2": 11.7,
        "confidence": "medium",
        "labelPos": {
          "x": 519.5,
          "y": 1039.6
        },
        "center": {
          "x": 519.5,
          "y": 1039.6
        },
        "bounds": {
          "minX": 489.9,
          "minY": 1009.9,
          "maxX": 561.2,
          "maxY": 1079.8,
          "width": 71.3,
          "height": 69.9
        },
        "pathData": "M 489.9 1009.9 L 489.9 1079.8 L 559.1 1079.8 L 559.1 1069.6 L 548.1 1068.9 L 548.1 1044.5 L 561.2 1043.8 L 561.2 1009.9 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "corridor-G007",
        "code": "G007",
        "name": "CORIDOR",
        "type": "corridor",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 92.82,
        "area_calc_m2": 82.4,
        "confidence": "high",
        "labelPos": {
          "x": 380.8,
          "y": 223.2
        },
        "center": {
          "x": 380.8,
          "y": 223.2
        },
        "bounds": {
          "minX": 352.9,
          "minY": 87,
          "maxX": 408.3,
          "maxY": 686.6,
          "width": 55.4,
          "height": 599.6
        },
        "pathData": "M 355.8 87 L 355.8 210.5 L 353.3 211.2 L 352.9 684.1 L 355.1 684.1 L 355.8 686.6 L 408.3 686.6 L 408.3 87 Z",
        "wing": "Corp G",
        "isCorridor": true,
        "isTechnical": false
      },
      {
        "id": "room-G008",
        "code": "G008",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 11.54,
        "area_calc_m2": 10.4,
        "confidence": "high",
        "labelPos": {
          "x": 296.5,
          "y": 598.7
        },
        "center": {
          "x": 296.5,
          "y": 598.7
        },
        "bounds": {
          "minX": 268.9,
          "minY": 570.9,
          "maxX": 349.4,
          "maxY": 627,
          "width": 80.5,
          "height": 56.1
        },
        "pathData": "M 268.9 573.3 L 268.9 621.7 L 275 621.7 L 275.6 627 L 349.4 627 L 349.4 611.8 L 340.2 611.1 L 340.2 570.9 L 275.6 570.9 L 275 573.3 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G-san-sud",
        "code": "GR. SAN.",
        "name": "GRUP SANITAR",
        "type": "service",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 11.5,
        "area_calc_m2": 10.8,
        "confidence": "high",
        "labelPos": {
          "x": 309.1,
          "y": 657.5
        },
        "center": {
          "x": 309.1,
          "y": 657.5
        },
        "bounds": {
          "minX": 268.9,
          "minY": 630.6,
          "maxX": 349.4,
          "maxY": 684.3,
          "width": 80.5,
          "height": 53.7
        },
        "pathData": "M 268.9 630.6 L 268.9 684.3 L 349.4 684.3 L 349.4 630.6 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G009",
        "code": "G009",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 22.98,
        "area_calc_m2": 21.3,
        "confidence": "high",
        "labelPos": {
          "x": 308.8,
          "y": 486.8
        },
        "center": {
          "x": 308.8,
          "y": 486.8
        },
        "bounds": {
          "minX": 268.9,
          "minY": 450.9,
          "maxX": 344.8,
          "maxY": 567,
          "width": 75.9,
          "height": 116.1
        },
        "pathData": "M 268.9 453.3 L 268.9 502 L 275.6 502.7 L 275.6 512.6 L 268.9 513.3 L 268.9 562 L 275 562 L 275.6 567 L 340.2 567 L 340.2 506.6 L 344.8 505.9 L 344.8 450.9 L 275.6 450.9 L 275 453.3 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G010",
        "code": "G010",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 11.6,
        "area_calc_m2": 10.4,
        "confidence": "high",
        "labelPos": {
          "x": 296.5,
          "y": 418.7
        },
        "center": {
          "x": 296.5,
          "y": 418.7
        },
        "bounds": {
          "minX": 268.9,
          "minY": 390.8,
          "maxX": 349.4,
          "maxY": 447,
          "width": 80.5,
          "height": 56.2
        },
        "pathData": "M 268.9 393.3 L 268.9 442 L 275 442 L 275.6 447 L 349.4 447 L 349.4 431.8 L 340.2 431.1 L 340.2 390.8 L 275.6 390.8 L 275 393.3 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G011",
        "code": "G011",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 11.6,
        "area_calc_m2": 10.3,
        "confidence": "high",
        "labelPos": {
          "x": 296.5,
          "y": 359.1
        },
        "center": {
          "x": 296.5,
          "y": 359.1
        },
        "bounds": {
          "minX": 268.9,
          "minY": 331.2,
          "maxX": 349.4,
          "maxY": 387,
          "width": 80.5,
          "height": 55.8
        },
        "pathData": "M 268.9 333.7 L 268.9 382 L 275 382 L 275.6 387 L 340.2 387 L 340.2 346.7 L 349.4 346 L 349.4 331.2 L 275.6 331.2 L 275 333.7 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G-san-nord-1",
        "code": "GR. SAN.",
        "name": "GRUP SANITAR",
        "type": "service",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 9.5,
        "area_calc_m2": 12.1,
        "confidence": "high",
        "labelPos": {
          "x": 309.1,
          "y": 241.0
        },
        "center": {
          "x": 309.1,
          "y": 241.0
        },
        "bounds": {
          "minX": 268.9,
          "minY": 211.0,
          "maxX": 349.4,
          "maxY": 271.0,
          "width": 80.5,
          "height": 60.0
        },
        "pathData": "M 268.9 211.0 L 268.9 271.0 L 349.4 271.0 L 349.4 211.0 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G-san-nord-2",
        "code": "GR. SAN.",
        "name": "GRUP SANITAR",
        "type": "service",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 9.9,
        "area_calc_m2": 12.1,
        "confidence": "high",
        "labelPos": {
          "x": 309.1,
          "y": 301.0
        },
        "center": {
          "x": 309.1,
          "y": 301.0
        },
        "bounds": {
          "minX": 268.9,
          "minY": 271.0,
          "maxX": 349.4,
          "maxY": 331.0,
          "width": 80.5,
          "height": 60.0
        },
        "pathData": "M 268.9 271.0 L 268.9 331.0 L 349.4 331.0 L 349.4 271.0 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G012",
        "code": "G012",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 91.94,
        "area_calc_m2": 91.1,
        "confidence": "high",
        "labelPos": {
          "x": 490.2,
          "y": 717.3
        },
        "center": {
          "x": 490.2,
          "y": 717.3
        },
        "bounds": {
          "minX": 412.2,
          "minY": 597.3,
          "maxX": 559.1,
          "maxY": 813.7,
          "width": 146.9,
          "height": 216.4
        },
        "pathData": "M 423.5 597.3 L 485.4 597.3 L 485.3 629.8 L 552 629.8 L 552.7 633.3 L 559.1 633.3 L 559.1 681.7 L 552 682.4 L 552 692.3 L 559.1 693 L 559.1 741.7 L 552 742.4 L 552 752.2 L 559.1 753 L 559.1 801.7 L 552 802.4 L 552 813.7 L 423.5 813.7 L 423.5 618.1 L 412.2 618.1 L 412.2 599.1 L 422.1 598.4 L 423.5 597.3 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G013",
        "code": "G013",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 10.3,
        "area_calc_m2": 9.9,
        "confidence": "high",
        "labelPos": {
          "x": 516.7,
          "y": 597.7
        },
        "center": {
          "x": 516.7,
          "y": 597.7
        },
        "bounds": {
          "minX": 488.5,
          "minY": 569.5,
          "maxX": 559.1,
          "maxY": 625.9,
          "width": 70.6,
          "height": 56.4
        },
        "pathData": "M 488.5 569.5 L 488.5 625.9 L 552 625.9 L 552.7 621.7 L 559.1 621.7 L 559.1 573.3 L 552.7 573.3 L 552 569.5 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G014",
        "code": "G014",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 62.43,
        "area_calc_m2": 58.9,
        "confidence": "high",
        "labelPos": {
          "x": 490.2,
          "y": 417.7
        },
        "center": {
          "x": 490.2,
          "y": 417.7
        },
        "bounds": {
          "minX": 423.5,
          "minY": 330.5,
          "maxX": 559.1,
          "maxY": 504.8,
          "width": 135.6,
          "height": 174.3
        },
        "pathData": "M 423.5 330.5 L 423.5 504.8 L 552 504.8 L 552.7 502 L 559.1 502 L 559.1 453.3 L 552 452.6 L 552 442.7 L 559.1 442 L 559.1 393.3 L 552 392.6 L 552 382.7 L 559.1 382 L 559.1 333.7 L 552.7 333.7 L 552 330.5 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G015",
        "code": "G015",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 62.35,
        "area_calc_m2": 58.9,
        "confidence": "high",
        "labelPos": {
          "x": 490.2,
          "y": 238
        },
        "center": {
          "x": 490.2,
          "y": 238
        },
        "bounds": {
          "minX": 423.5,
          "minY": 150.8,
          "maxX": 559.1,
          "maxY": 325.2,
          "width": 135.6,
          "height": 174.4
        },
        "pathData": "M 423.5 150.8 L 423.5 325.2 L 552 325.2 L 552.7 322 L 559.1 322 L 559.1 273.7 L 552 273 L 552 263.1 L 559.1 262.4 L 559.1 213.7 L 552 213 L 552 203.1 L 559.1 202.4 L 559.1 153.7 L 552.7 153.7 L 552 150.8 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G016",
        "code": "G016",
        "name": "TABLOU ELECTRIC GENERAL",
        "type": "technical",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 21.56,
        "area_calc_m2": 20,
        "confidence": "high",
        "labelPos": {
          "x": 452.5,
          "y": 115.9
        },
        "center": {
          "x": 452.5,
          "y": 115.9
        },
        "bounds": {
          "minX": 419.6,
          "minY": 87,
          "maxX": 559.1,
          "maxY": 145.2,
          "width": 139.5,
          "height": 58.2
        },
        "pathData": "M 419.6 87 L 419.6 109.9 L 423.5 110.6 L 423.5 145.2 L 552 145.2 L 552.7 142.4 L 559.1 142.4 L 559.1 93.7 L 552.7 93.7 L 552 87 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": true
      },
      {
        "id": "room-G002",
        "code": "G002",
        "name": "BIBLIOTECA",
        "type": "other-public-space",
        "floor": "P",
        "level": "+1.05",
        "area_plan_m2": 71.89,
        "area_calc_m2": 67.6,
        "confidence": "high",
        "labelPos": {
          "x": 94.6,
          "y": 1007.4
        },
        "center": {
          "x": 94.6,
          "y": 1007.4
        },
        "bounds": {
          "minX": 28.9,
          "minY": 942.5,
          "maxX": 264.3,
          "maxY": 1065.3,
          "width": 235.4,
          "height": 122.8
        },
        "pathData": "M 28.9 949.9 L 28.9 1058.3 L 35.3 1058.3 L 36 1065.3 L 140.5 1065.3 L 141.2 1044.1 L 159.9 1044.9 L 159.9 1065.3 L 264.3 1065.3 L 264.3 951.3 L 202.6 951.3 L 201.9 942.5 L 185.3 942.5 L 184.6 952.4 L 112.2 952.4 L 111.5 942.5 L 86.1 942.5 L 85.4 951.3 L 62.5 951.3 L 61.8 942.5 L 36 942.5 L 36 949.2 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "corridor-G001",
        "code": "G001",
        "name": "HOL",
        "type": "corridor",
        "floor": "P",
        "level": "+1.05",
        "area_plan_m2": 176.04,
        "area_calc_m2": 170.2,
        "confidence": "high",
        "labelPos": {
          "x": 342,
          "y": 902.6
        },
        "center": {
          "x": 342,
          "y": 902.6
        },
        "bounds": {
          "minX": 31.1,
          "minY": 816.1,
          "maxX": 566.1,
          "maxY": 998.3,
          "width": 535,
          "height": 182.2
        },
        "pathData": "M 566.1 998.3 L 566.1 949.9 L 552 949.2 L 552 939.3 L 556.9 938.6 L 556.9 889.9 L 552.7 889.9 L 552 887.8 L 419.6 887.8 L 419 889.9 L 409.1 889.9 L 408 887.1 L 408.3 822.8 L 405.2 822.2 L 405.2 816.1 L 358.6 816.1 L 357.9 822.8 L 350.1 822.8 L 349.4 816.1 L 322.6 816.1 L 323 823.2 L 321.9 829.9 L 265.1 829.9 L 264.3 822.8 L 156 822.8 L 155.3 829.9 L 145.1 829.9 L 144.3 822.8 L 36 822.8 L 36 829.2 L 31.1 829.9 L 31.1 938.6 L 275 938.6 L 275.6 998.3 Z",
        "wing": "Corp G",
        "isCorridor": true,
        "isTechnical": false
      },
      {
        "id": "room-K001",
        "code": "K001",
        "name": "LABORATOR E.L.F.",
        "type": "laboratory",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 43.12,
        "area_calc_m2": 41,
        "confidence": "high",
        "labelPos": {
          "x": 1246.9,
          "y": 806.3
        },
        "center": {
          "x": 1246.9,
          "y": 806.3
        },
        "bounds": {
          "minX": 1176.7,
          "minY": 745.9,
          "maxX": 1319.3,
          "maxY": 866.6,
          "width": 142.6,
          "height": 120.7
        },
        "pathData": "M 1186.6 746.3 L 1186.6 810.1 L 1176.7 810.9 L 1176.7 841.6 L 1186.6 842.3 L 1187 866.6 L 1319.3 866.6 L 1319.3 745.9 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K002",
        "code": "K002",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 20.6,
        "area_calc_m2": 19.2,
        "confidence": "high",
        "labelPos": {
          "x": 1209.2,
          "y": 713.8
        },
        "center": {
          "x": 1209.2,
          "y": 713.8
        },
        "bounds": {
          "minX": 1181.7,
          "minY": 686.3,
          "maxX": 1319.3,
          "maxY": 741.7,
          "width": 137.6,
          "height": 55.4
        },
        "pathData": "M 1181.7 691.2 L 1181.7 739.5 L 1185.9 739.5 L 1186.6 741.7 L 1319.3 741.7 L 1319.3 686.3 L 1186.6 686.3 L 1186.6 690.5 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K003",
        "code": "K003",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 20.25,
        "area_calc_m2": 18.6,
        "confidence": "high",
        "labelPos": {
          "x": 1214.1,
          "y": 653.8
        },
        "center": {
          "x": 1214.1,
          "y": 653.8
        },
        "bounds": {
          "minX": 1186.6,
          "minY": 626.3,
          "maxX": 1319.3,
          "maxY": 681.7,
          "width": 132.7,
          "height": 55.4
        },
        "pathData": "M 1186.6 626.3 L 1186.6 681.7 L 1319.3 681.7 L 1319.3 626.3 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K004",
        "code": "K004",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 20.76,
        "area_calc_m2": 19.4,
        "confidence": "high",
        "labelPos": {
          "x": 1209.5,
          "y": 591.7
        },
        "center": {
          "x": 1209.5,
          "y": 591.7
        },
        "bounds": {
          "minX": 1181.7,
          "minY": 563.8,
          "maxX": 1319.3,
          "maxY": 619.9,
          "width": 137.6,
          "height": 56.1
        },
        "pathData": "M 1181.7 571.2 L 1181.7 619.9 L 1319.3 619.9 L 1319.3 563.8 L 1186.6 563.8 L 1186.6 570.5 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K005",
        "code": "K005",
        "name": "LABORATOR SERVOSIST.",
        "type": "laboratory",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 41.11,
        "area_calc_m2": 38.7,
        "confidence": "high",
        "labelPos": {
          "x": 1242.7,
          "y": 503.8
        },
        "center": {
          "x": 1242.7,
          "y": 503.8
        },
        "bounds": {
          "minX": 1181.7,
          "minY": 447.7,
          "maxX": 1319.3,
          "maxY": 559.9,
          "width": 137.6,
          "height": 112.2
        },
        "pathData": "M 1181.7 451.5 L 1181.7 499.9 L 1186.6 500.6 L 1186.6 510.5 L 1181.7 511.2 L 1181.7 559.9 L 1319.3 559.9 L 1319.3 447.7 L 1186.6 447.7 L 1185.9 451.5 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K006",
        "code": "K006",
        "name": "CABINET M.E.",
        "type": "cabinet",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 48.93,
        "area_calc_m2": 46.3,
        "confidence": "high",
        "labelPos": {
          "x": 1242.7,
          "y": 387.7
        },
        "center": {
          "x": 1242.7,
          "y": 387.7
        },
        "bounds": {
          "minX": 1181.7,
          "minY": 271.6,
          "maxX": 1319.3,
          "maxY": 443.8,
          "width": 137.6,
          "height": 172.2
        },
        "pathData": "M 1181.7 271.6 L 1181.7 320.2 L 1186.6 321 L 1186.6 330.9 L 1181.7 331.5 L 1181.7 380.3 L 1186.6 381 L 1186.6 390.8 L 1181.7 391.6 L 1181.7 439.9 L 1185.9 439.9 L 1186.6 443.8 L 1319.3 443.8 L 1319.3 331.5 L 1233.9 331.5 L 1233.2 271.6 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K007",
        "code": "K007",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 12.88,
        "area_calc_m2": 11.7,
        "confidence": "high",
        "labelPos": {
          "x": 1264.9,
          "y": 299.4
        },
        "center": {
          "x": 1264.9,
          "y": 299.4
        },
        "bounds": {
          "minX": 1237.1,
          "minY": 271.6,
          "maxX": 1319.3,
          "maxY": 327.7,
          "width": 82.2,
          "height": 56.1
        },
        "pathData": "M 1237.1 271.6 L 1237.1 327.7 L 1319.3 327.7 L 1319.3 271.6 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "corridor-K009",
        "code": "K009",
        "name": "CORIDOR",
        "type": "corridor",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 180.13,
        "area_calc_m2": 166.5,
        "confidence": "high",
        "labelPos": {
          "x": 1124.1,
          "y": 295.9
        },
        "center": {
          "x": 1124.1,
          "y": 295.9
        },
        "bounds": {
          "minX": 1071.9,
          "minY": 24.8,
          "maxX": 1175.3,
          "maxY": 869.4,
          "width": 103.4,
          "height": 844.6
        },
        "pathData": "M 1117.4 24.8 L 1117.4 215.1 L 1071.9 215.4 L 1071.9 260.3 L 1078.9 261 L 1078.9 270.8 L 1071.9 271.6 L 1071.9 320.2 L 1075.8 319.9 L 1078.9 321 L 1078.9 390.8 L 1071.9 391.6 L 1071.9 439.9 L 1078.9 440.6 L 1078.9 450.9 L 1071.9 451.5 L 1071.9 499.9 L 1078.9 500.6 L 1078.9 570.5 L 1071.9 571.2 L 1071.9 619.9 L 1078.9 620.6 L 1078.9 630.5 L 1071.9 631.2 L 1071.9 675.7 L 1117.4 676.4 L 1117.4 779.1 L 1143.5 779.8 L 1143.5 869.4 L 1175.3 869.4 L 1175.3 24.8 Z",
        "wing": "Corp K",
        "isCorridor": true,
        "isTechnical": false
      },
      {
        "id": "room-K010",
        "code": "K010",
        "name": "GR. SAN.",
        "type": "service",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 28.64,
        "area_calc_m2": 27.8,
        "confidence": "medium",
        "labelPos": {
            "x": 1038,
            "y": 726.9
        },
        "center": {
            "x": 1038,
            "y": 726.9
        },
        "bounds": {
            "minX": 963.9,
            "minY": 684.1,
            "maxX": 1112,
            "maxY": 769.6,
            "width": 148.1,
            "height": 85.5
        },
        "pathData": "M 963.9 684.1 L 1112 684.1 L 1112 769.6 L 963.9 769.6 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
    },
      {
        "id": "room-K011",
        "code": "K011",
        "name": "GR. SAN.",
        "type": "service",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 28.28,
        "area_calc_m2": 17,
        "confidence": "medium",
        "labelPos": {
            "x": 1038,
            "y": 181.2
        },
        "center": {
            "x": 1038,
            "y": 181.2
        },
        "bounds": {
            "minX": 963.9,
            "minY": 155.1,
            "maxX": 1112,
            "maxY": 207.3,
            "width": 148.1,
            "height": 52.2
        },
        "pathData": "M 963.9 155.1 L 1112 155.1 L 1112 207.3 L 963.9 207.3 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
    },
      {
        "id": "room-K008",
        "code": "K008",
        "name": "LABORATOR INST. TERM.",
        "type": "laboratory",
        "floor": "P",
        "level": "±0.00",
        "area_plan_m2": 86.32,
        "area_calc_m2": 41.8,
        "confidence": "low",
        "labelPos": {
          "x": 1245.9,
          "y": 205.9
        },
        "center": {
          "x": 1245.9,
          "y": 205.9
        },
        "bounds": {
          "minX": 1181.7,
          "minY": 146.6,
          "maxX": 1326,
          "maxY": 265.2,
          "width": 144.3,
          "height": 118.6
        },
        "pathData": "M 1181.7 151.9 L 1181.7 200.2 L 1186.6 201 L 1186.6 265.2 L 1319.3 265.2 L 1320 260.3 L 1326 260.3 L 1326 211.5 L 1319.3 210.9 L 1319.3 201 L 1326 200.2 L 1326 151.9 L 1320 151.9 L 1319.3 146.6 L 1186.6 146.6 L 1186.6 151.2 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "corridor-I001",
        "code": "I001",
        "name": "I001 + I002",
        "type": "corridor",
        "floor": "P",
        "level": "+1.05",
        "area_plan_m2": 126.63,
        "area_calc_m2": 158.9,
        "confidence": "medium",
        "labelPos": {
          "x": 923.3,
          "y": 943.9
        },
        "center": {
          "x": 923.3,
          "y": 943.9
        },
        "bounds": {
          "minX": 596.5,
          "minY": 876.9,
          "maxX": 1208.5,
          "maxY": 1058.3,
          "width": 612,
          "height": 181.4
        },
        "pathData": "M 596.5 949.9 L 596.5 998.3 L 782.5 998.3 L 783.2 1002.5 L 827.6 1002.5 L 828.4 998.3 L 838.6 998.3 L 839.3 1002.5 L 887.7 1002.5 L 888.3 998.3 L 898.2 998.3 L 899.3 1003.2 L 899.3 1008.1 L 898.2 1009.9 L 879.2 1008.9 L 879.2 1031.8 L 947.6 1031.8 L 948.4 998.3 L 958.3 998.3 L 958.9 1002.5 L 1007.7 1002.5 L 1008.3 998.3 L 1018.2 998.3 L 1019 1027.9 L 1024.9 1028.6 L 1022.1 1031.8 L 1067.3 1031.8 L 1068 998.3 L 1078.3 998.3 L 1078.9 1001.5 L 1082.8 1002.1 L 1082.8 1008.5 L 1123.4 1008.5 L 1123.4 995.1 L 1135.8 994.4 L 1139 998.6 L 1139 1001.8 L 1157.3 1020.1 L 1157.3 1058.3 L 1187.3 1058.3 L 1187.3 999 L 1208.5 998.3 L 1208.5 963.3 L 1204.2 963.3 L 1190.5 949.9 L 1186.6 949.9 L 1185.9 947.8 L 1183.4 946.7 L 1183.4 935.1 L 1190.1 934.4 L 1190.5 889.9 L 1008.3 889.9 L 1007.7 882.9 L 958.9 882.9 L 958.3 889.9 L 948.4 889.9 L 947.6 882.9 L 899 882.9 L 898.2 889.9 L 888.3 889.9 L 887.7 882.9 L 839.3 882.9 L 838.6 889.9 L 828.4 889.9 L 827.6 882.9 L 823.8 882.1 L 823.8 876.9 L 787.1 876.9 L 787.1 882.1 L 779.3 882.9 L 779.3 889.2 L 774 889.9 L 774.4 938.6 L 779.3 939.3 L 778.6 949.9 L 768.3 949.9 L 767.7 945 L 719.3 945 L 718.6 949.9 L 708.7 949.9 L 708 945 L 659.3 945 L 658.6 949.9 L 648.7 949.9 L 648 945 L 599.3 945 L 599.3 949.2 Z",
        "wing": "Corp I",
        "isCorridor": true,
        "isTechnical": false
      },
      {
        "id": "room-I003",
        "code": "I003",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "P",
        "level": "+1.05",
        "area_plan_m2": 60.8,
        "area_calc_m2": 34.6,
        "confidence": "low",
        "labelPos": {
          "x": 663.4,
          "y": 913.3
        },
        "center": {
          "x": 663.4,
          "y": 913.3
        },
        "bounds": {
          "minX": 556.0,
          "minY": 885.2,
          "maxX": 770.8,
          "maxY": 941.4,
          "width": 214.8,
          "height": 56.2
        },
        "pathData": "M 556.0 885.2 L 769.0 885.2 L 769.0 889.9 L 770.8 889.9 L 770.8 938.6 L 767.7 941.4 L 719.3 941.4 L 718.6 938.6 L 708.7 938.6 L 708 941.4 L 659.3 941.4 L 658.6 938.6 L 648.7 938.6 L 648 941.4 L 599.3 941.4 L 598.6 938.6 L 556.0 938.6 Z",
        "wing": "Corp I",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-I004",
        "code": "I004",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "+1.05",
        "area_plan_m2": 21.41,
        "area_calc_m2": 19.2,
        "confidence": "high",
        "labelPos": {
          "x": 619.8,
          "y": 1033.6
        },
        "center": {
          "x": 619.8,
          "y": 1033.6
        },
        "bounds": {
          "minX": 577.8,
          "minY": 1002.1,
          "maxX": 712.9,
          "maxY": 1065.3,
          "width": 135.1,
          "height": 63.2
        },
        "pathData": "M 577.8 1009.9 L 577.8 1058.3 L 599.7 1058.3 L 600.3 1065.3 L 648 1065.3 L 648.7 1058.3 L 658.6 1058.3 L 659.3 1065.3 L 708 1065.3 L 708 1059 L 712.9 1058.3 L 712.9 1009.9 L 648.7 1009.9 L 648 1002.1 L 599.3 1002.1 L 598.6 1009.9 Z",
        "wing": "Corp I",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-I005",
        "code": "I005",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "+1.05",
        "area_plan_m2": 8.61,
        "area_calc_m2": 8,
        "confidence": "high",
        "labelPos": {
          "x": 744.3,
          "y": 1037.4
        },
        "center": {
          "x": 744.3,
          "y": 1037.4
        },
        "bounds": {
          "minX": 716.8,
          "minY": 1009.9,
          "maxX": 774.7,
          "maxY": 1065.3,
          "width": 57.9,
          "height": 55.4
        },
        "pathData": "M 716.8 1009.9 L 716.8 1058.3 L 719.3 1059 L 719.3 1065.3 L 767.7 1065.3 L 767.7 1059 L 774.7 1058.3 L 774.7 1009.9 Z",
        "wing": "Corp I",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-P-amfiteatru",
        "code": "AK1",
        "name": "Amfiteatrul AK1",
        "type": "amphitheatre",
        "floor": "P",
        "level": "",
        "area_plan_m2": 136.85,
        "area_calc_m2": 146.5,
        "confidence": "low",
        "labelPos": {
          "x": 927.9,
          "y": 447
        },
        "center": {
          "x": 927.9,
          "y": 447
        },
        "bounds": {
          "minX": 811.8,
          "minY": 330.9,
          "maxX": 1063.1,
          "maxY": 563.4,
          "width": 251.3,
          "height": 232.5
        },
        "pathData": "M 811.8 330.9 L 811.8 563.4 L 1063.1 563.4 L 1063.1 330.9 Z",
        "wing": "Corp Central",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-P-birou-7",
        "code": "P-birou-7",
        "name": "BIROU",
        "type": "office",
        "floor": "P",
        "level": "",
        "area_plan_m2": 7,
        "area_calc_m2": 7.2,
        "confidence": "high",
        "labelPos": {
          "x": 1059.5,
          "y": 1059.7
        },
        "center": {
          "x": 1059.5,
          "y": 1059.7
        },
        "bounds": {
          "minX": 1014.4,
          "minY": 1036.4,
          "maxX": 1082.8,
          "maxY": 1104.9,
          "width": 68.4,
          "height": 68.5
        },
        "pathData": "M 1016.5 1048.7 L 1014.4 1051.2 L 1068.4 1104.9 L 1070.8 1102.4 Z M 1028.8 1036.4 L 1017.9 1047.7 L 1071.9 1101.3 L 1082.8 1090.4 L 1082.8 1067.8 L 1080 1067.1 L 1080 1036.4 L 1058.8 1036.4 L 1058.1 1039.2 L 1052.1 1039.2 L 1051.4 1036.4 Z",
        "wing": "Corp Central",
        "isCorridor": false,
        "isTechnical": false
      }
    ],
    "stairs": [
      {
        "id": "stair-P-01",
        "annotation": "3 Tr.",
        "steps": 3,
        "connector_id": null,
        "x": 237.2,
        "y": 708.7,
        "type": "level-change"
      },
      {
        "id": "stair-P-02",
        "annotation": "3 Tr.",
        "steps": 3,
        "connector_id": null,
        "x": 237.7,
        "y": 185.2,
        "type": "level-change"
      },
      {
        "id": "stair-P-03",
        "annotation": "3 Tr.",
        "steps": 3,
        "connector_id": "vc-05",
        "x": 249,
        "y": 166.3,
        "type": "vertical-connector"
      },
      {
        "id": "stair-P-04",
        "annotation": "3 Tr.",
        "steps": 3,
        "connector_id": null,
        "x": 249,
        "y": 209.5,
        "type": "level-change"
      },
      {
        "id": "stair-P-05",
        "annotation": "17 Tr.",
        "steps": 17,
        "connector_id": "vc-05",
        "x": 287.7,
        "y": 138.9,
        "type": "vertical-connector"
      },
      {
        "id": "stair-P-06",
        "annotation": "6 Tr.",
        "steps": 6,
        "connector_id": "vc-06",
        "x": 287.7,
        "y": 756.7,
        "type": "vertical-connector"
      },
      {
        "id": "stair-P-07",
        "annotation": "19 Tr.",
        "steps": 19,
        "connector_id": "vc-06",
        "x": 330.6,
        "y": 755.9,
        "type": "vertical-connector"
      },
      {
        "id": "stair-P-08",
        "annotation": "15 Tr.",
        "steps": 15,
        "connector_id": "vc-01",
        "x": 378.9,
        "y": 777,
        "type": "vertical-connector"
      },
      {
        "id": "stair-P-09",
        "annotation": "4 Tr.",
        "steps": 4,
        "connector_id": null,
        "x": 1142.1,
        "y": -15.5,
        "type": "level-change"
      },
      {
        "id": "stair-P-10",
        "annotation": "24 Tr.",
        "steps": 24,
        "connector_id": "vc-02",
        "x": 1037.7,
        "y": 91.8,
        "type": "vertical-connector"
      },
      {
        "id": "stair-P-11",
        "annotation": "24 Tr.",
        "steps": 24,
        "connector_id": "vc-07",
        "x": 1039.1,
        "y": 792.9,
        "type": "vertical-connector"
      },
      {
        "id": "stair-P-12",
        "annotation": "9 Tr.",
        "steps": 9,
        "connector_id": null,
        "x": 793.4,
        "y": 397.3,
        "type": "level-change"
      },
      {
        "id": "stair-P-13",
        "annotation": "4 Tr.",
        "steps": 4,
        "connector_id": null,
        "x": 768,
        "y": 442.7,
        "type": "level-change"
      },
      {
        "id": "stair-P-14",
        "annotation": "9 Tr.",
        "steps": 9,
        "connector_id": null,
        "x": 793.7,
        "y": 493.6,
        "type": "level-change"
      },

      {
        "id": "stair-P-16",
        "annotation": "15 Tr.",
        "steps": 15,
        "connector_id": "vc-04",
        "x": 960.6,
        "y": 902.4,
        "type": "vertical-connector"
      }
    ]
  },
  "E1": {
    "id": "E1",
    "name": "Etaj 1",
    "shortName": "E1",
    "order": 2,
    "page": 3,
    "svg": "OSACE_E1_Etaj1.svg",
    "rooms": [
      {
        "id": "corridor-G101",
        "code": "G101",
        "name": "CORIDOR",
        "type": "corridor",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 106.12,
        "area_calc_m2": 99.5,
        "confidence": "high",
        "labelPos": {
          "x": 380.8,
          "y": 114.3
        },
        "center": {
          "x": 380.8,
          "y": 114.3
        },
        "bounds": {
          "minX": 353.3,
          "minY": 86.7,
          "maxX": 408.3,
          "maxY": 806.4,
          "width": 55,
          "height": 719.7
        },
        "pathData": "M 353.3 86.7 L 353.3 204.7 L 355.8 205.3 L 355.8 210.3 L 353.3 211 L 353.3 684.3 L 355.8 685 L 355.8 689.9 L 353.3 690.6 L 353.3 806.4 L 408.3 806.4 L 408.3 86.7 Z",
        "wing": "Corp G",
        "isCorridor": true,
        "isTechnical": false
      },
      {
        "id": "room-G102",
        "code": "G102",
        "name": "SAS",
        "type": "service",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 11.09,
        "area_calc_m2": 9.7,
        "confidence": "high",
        "labelPos": {
          "x": 380.5,
          "y": 837.8
        },
        "center": {
          "x": 380.5,
          "y": 837.8
        },
        "bounds": {
          "minX": 347.3,
          "minY": 810.3,
          "maxX": 408.3,
          "maxY": 878.4,
          "width": 61,
          "height": 68.1
        },
        "pathData": "M 355.8 810.3 L 355.8 812.1 L 353.3 812.8 L 353.3 861.8 L 347.3 862.5 L 347.3 878.4 L 408.3 878.4 L 408.3 810.3 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G103",
        "code": "G103",
        "name": "BIROU",
        "type": "office",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 10.71,
        "area_calc_m2": 10.3,
        "confidence": "high",
        "labelPos": {
          "x": 297.5,
          "y": 849.5
        },
        "center": {
          "x": 297.5,
          "y": 849.5
        },
        "bounds": {
          "minX": 268.9,
          "minY": 820.9,
          "maxX": 343.4,
          "maxY": 878.4,
          "width": 74.5,
          "height": 57.5
        },
        "pathData": "M 275.6 820.9 L 275.6 829.3 L 268.9 830.1 L 268.9 878.4 L 343.4 878.4 L 343.4 862.5 L 337.4 861.8 L 337.4 838.5 L 343.4 837.8 L 343.4 820.9 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G104",
        "code": "G104",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 64.02,
        "area_calc_m2": 60.4,
        "confidence": "high",
        "labelPos": {
          "x": 337.4,
          "y": 974.1
        },
        "center": {
          "x": 337.4,
          "y": 974.1
        },
        "bounds": {
          "minX": 268.9,
          "minY": 882.3,
          "maxX": 408.3,
          "maxY": 1061.2,
          "width": 139.4,
          "height": 178.9
        },
        "pathData": "M 275.6 882.3 L 275.6 889 L 268.9 889.7 L 268.9 938.4 L 275.6 939.1 L 275.6 949 L 268.9 949.7 L 268.9 998.4 L 275.6 999.1 L 275.6 1009 L 268.9 1009.7 L 268.9 1058 L 275 1058 L 275.6 1061.2 L 404.1 1061.2 L 404.1 906.6 L 408 905.9 L 408.3 882.3 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G105",
        "code": "G105",
        "name": "DEPENDINTA",
        "type": "technical",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 14.37,
        "area_calc_m2": 13.2,
        "confidence": "high",
        "labelPos": {
          "x": 280.9,
          "y": 1094.1
        },
        "center": {
          "x": 280.9,
          "y": 1094.1
        },
        "bounds": {
          "minX": 268.9,
          "minY": 1066.5,
          "maxX": 408.3,
          "maxY": 1106,
          "width": 139.4,
          "height": 39.5
        },
        "pathData": "M 268.9 1082 L 268.9 1106 L 408.3 1106 L 408.3 1082 Z M 268.9 1069.7 L 268.9 1079.9 L 408.3 1079.9 L 408.3 1069.7 L 404.8 1069.7 L 404.1 1066.5 L 275.6 1066.5 L 275 1069.7 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": true
      },
      {
        "id": "room-G106",
        "code": "G106",
        "name": "CABINET",
        "type": "cabinet",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 16.79,
        "area_calc_m2": 15.6,
        "confidence": "high",
        "labelPos": {
          "x": 424.2,
          "y": 1094.1
        },
        "center": {
          "x": 424.2,
          "y": 1094.1
        },
        "bounds": {
          "minX": 412.2,
          "minY": 1061.6,
          "maxX": 559.1,
          "maxY": 1106,
          "width": 146.9,
          "height": 44.4
        },
        "pathData": "M 412.2 1082 L 412.2 1106 L 559.1 1106 L 559.1 1082 Z M 412.2 1069.7 L 412.2 1079.9 L 559.1 1079.9 L 559.1 1069.7 L 552 1069 L 552 1061.6 L 419.6 1061.6 L 419.6 1069 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G108",
        "code": "G108",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 41.34,
        "area_calc_m2": 39.3,
        "confidence": "high",
        "labelPos": {
          "x": 481.8,
          "y": 748.2
        },
        "center": {
          "x": 481.8,
          "y": 748.2
        },
        "bounds": {
          "minX": 423.5,
          "minY": 689.9,
          "maxX": 559.1,
          "maxY": 806.4,
          "width": 135.6,
          "height": 116.5
        },
        "pathData": "M 423.5 689.9 L 423.5 806.4 L 552 806.4 L 552.7 801.5 L 559.1 801.5 L 559.1 753.1 L 552 752.4 L 552 742.2 L 559.1 741.5 L 559.1 693.1 L 552.7 693.1 L 552 689.9 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G109",
        "code": "G109",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 41.23,
        "area_calc_m2": 38.9,
        "confidence": "high",
        "labelPos": {
          "x": 480.7,
          "y": 627.4
        },
        "center": {
          "x": 480.7,
          "y": 627.4
        },
        "bounds": {
          "minX": 419.6,
          "minY": 570.3,
          "maxX": 559.1,
          "maxY": 684.7,
          "width": 139.5,
          "height": 114.4
        },
        "pathData": "M 419.6 570.3 L 419.6 591.8 L 423.5 592.5 L 423.5 684.7 L 552 684.7 L 552.7 681.8 L 559.1 681.8 L 559.1 633.1 L 552 632.4 L 552 622.5 L 559.1 621.8 L 559.1 573.1 L 552.7 573.1 L 552 570.3 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G110",
        "code": "G110",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 41.02,
        "area_calc_m2": 39.7,
        "confidence": "high",
        "labelPos": {
          "x": 480.7,
          "y": 507.4
        },
        "center": {
          "x": 480.7,
          "y": 507.4
        },
        "bounds": {
          "minX": 414.7,
          "minY": 450.3,
          "maxX": 559.1,
          "maxY": 564.7,
          "width": 144.4,
          "height": 114.4
        },
        "pathData": "M 423.5 450.3 L 423.5 516.7 L 414.7 517.3 L 414.7 561.8 L 419 561.8 L 419.6 564.7 L 552 564.7 L 552.7 561.8 L 559.1 561.8 L 559.1 513.1 L 552 512.4 L 552 502.5 L 559.1 501.8 L 559.1 453.5 L 552.7 453.5 L 552 450.3 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G111",
        "code": "G111",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 40.68,
        "area_calc_m2": 38.7,
        "confidence": "high",
        "labelPos": {
          "x": 480.7,
          "y": 387.8
        },
        "center": {
          "x": 480.7,
          "y": 387.8
        },
        "bounds": {
          "minX": 423.5,
          "minY": 330.6,
          "maxX": 559.1,
          "maxY": 445,
          "width": 135.6,
          "height": 114.4
        },
        "pathData": "M 423.5 330.6 L 423.5 445 L 552 445 L 552.7 441.8 L 559.1 441.8 L 559.1 393.5 L 552 392.8 L 552 382.9 L 559.1 382.2 L 559.1 333.5 L 552.7 333.5 L 552 330.6 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G112",
        "code": "G112",
        "name": "BIROU",
        "type": "office",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 19.88,
        "area_calc_m2": 18.5,
        "confidence": "high",
        "labelPos": {
          "x": 450.7,
          "y": 297.8
        },
        "center": {
          "x": 450.7,
          "y": 297.8
        },
        "bounds": {
          "minX": 423.5,
          "minY": 270.6,
          "maxX": 559.1,
          "maxY": 325,
          "width": 135.6,
          "height": 54.4
        },
        "pathData": "M 423.5 270.6 L 423.5 325 L 552 325 L 552.7 322.2 L 559.1 322.2 L 559.1 273.5 L 552.7 273.5 L 552 270.6 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G114",
        "code": "G114",
        "name": "GR. SAN.",
        "type": "service",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 9.47,
        "area_calc_m2": 12.1,
        "confidence": "high",
        "labelPos": {
          "x": 309.1,
          "y": 241.0
        },
        "center": {
          "x": 309.1,
          "y": 241.0
        },
        "bounds": {
          "minX": 268.9,
          "minY": 211.0,
          "maxX": 349.4,
          "maxY": 271.0,
          "width": 80.5,
          "height": 60.0
        },
        "pathData": "M 268.9 211.0 L 268.9 271.0 L 349.4 271.0 L 349.4 211.0 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G115",
        "code": "G115",
        "name": "GR. SAN.",
        "type": "service",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 9.97,
        "area_calc_m2": 12.1,
        "confidence": "high",
        "labelPos": {
          "x": 309.1,
          "y": 301.0
        },
        "center": {
          "x": 309.1,
          "y": 301.0
        },
        "bounds": {
          "minX": 268.9,
          "minY": 271.0,
          "maxX": 349.4,
          "maxY": 331.0,
          "width": 80.5,
          "height": 60.0
        },
        "pathData": "M 268.9 271.0 L 268.9 331.0 L 349.4 331.0 L 349.4 271.0 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G116",
        "code": "G116",
        "name": "BIROU",
        "type": "office",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 11.6,
        "area_calc_m2": 10.8,
        "confidence": "high",
        "labelPos": {
          "x": 296.8,
          "y": 358.9
        },
        "center": {
          "x": 296.8,
          "y": 358.9
        },
        "bounds": {
          "minX": 268.9,
          "minY": 331,
          "maxX": 349.4,
          "maxY": 387.1,
          "width": 80.5,
          "height": 56.1
        },
        "pathData": "M 268.9 333.5 L 268.9 382.2 L 275 382.2 L 275.6 387.1 L 344.8 387.1 L 344.8 346.9 L 349.4 346.2 L 349.4 331 L 275.6 331 L 275 333.5 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G117",
        "code": "G117",
        "name": "BIROU",
        "type": "office",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 23.73,
        "area_calc_m2": 22.7,
        "confidence": "high",
        "labelPos": {
          "x": 310.9,
          "y": 468.3
        },
        "center": {
          "x": 310.9,
          "y": 468.3
        },
        "bounds": {
          "minX": 268.9,
          "minY": 391,
          "maxX": 349.4,
          "maxY": 506.8,
          "width": 80.5,
          "height": 115.8
        },
        "pathData": "M 268.9 393.5 L 268.9 441.8 L 275.6 442.5 L 275.6 452.8 L 268.9 453.5 L 268.9 501.8 L 275 501.8 L 275.6 506.8 L 349.4 506.8 L 349.4 431.9 L 344.8 431.2 L 344.8 391 L 275.6 391 L 275 393.5 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G118",
        "code": "G118",
        "name": "BIROU",
        "type": "office",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 11.6,
        "area_calc_m2": 10.8,
        "confidence": "high",
        "labelPos": {
          "x": 296.8,
          "y": 538.5
        },
        "center": {
          "x": 296.8,
          "y": 538.5
        },
        "bounds": {
          "minX": 268.9,
          "minY": 510.6,
          "maxX": 349.4,
          "maxY": 566.7,
          "width": 80.5,
          "height": 56.1
        },
        "pathData": "M 268.9 513.1 L 268.9 561.8 L 275 561.8 L 275.6 566.7 L 344.8 566.7 L 344.8 526.5 L 349.4 525.8 L 349.4 510.6 L 275.6 510.6 L 275 513.1 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G119",
        "code": "G119",
        "name": "BIROU",
        "type": "office",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 11.6,
        "area_calc_m2": 10.8,
        "confidence": "high",
        "labelPos": {
          "x": 296.8,
          "y": 598.5
        },
        "center": {
          "x": 296.8,
          "y": 598.5
        },
        "bounds": {
          "minX": 268.9,
          "minY": 570.6,
          "maxX": 349.4,
          "maxY": 626.8,
          "width": 80.5,
          "height": 56.2
        },
        "pathData": "M 268.9 573.1 L 268.9 621.8 L 275 621.8 L 275.6 626.8 L 349.4 626.8 L 349.4 611.6 L 344.8 610.9 L 344.8 570.6 L 275.6 570.6 L 275 573.1 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G120",
        "code": "G120",
        "name": "BIROU",
        "type": "office",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 11.1,
        "area_calc_m2": 10.4,
        "confidence": "high",
        "labelPos": {
          "x": 295.8,
          "y": 657.5
        },
        "center": {
          "x": 295.8,
          "y": 657.5
        },
        "bounds": {
          "minX": 268.9,
          "minY": 630.6,
          "maxX": 349.4,
          "maxY": 684.3,
          "width": 80.5,
          "height": 53.7
        },
        "pathData": "M 268.9 633.1 L 268.9 681.8 L 275 681.8 L 275.6 684.3 L 349.4 684.3 L 349.4 665.9 L 342.4 665.2 L 342.4 642.3 L 349.4 641.6 L 349.4 630.6 L 275.6 630.6 L 275 633.1 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G107",
        "code": "G107",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 81.93,
        "area_calc_m2": 38.3,
        "confidence": "low",
        "labelPos": {
          "x": 475.1,
          "y": 885.5
        },
        "center": {
          "x": 475.1,
          "y": 885.5
        },
        "bounds": {
          "minX": 419.6,
          "minY": 830.1,
          "maxX": 559.1,
          "maxY": 940.9,
          "width": 139.5,
          "height": 110.8
        },
        "pathData": "M 423.5 830.1 L 423.5 861.8 L 419.6 862.5 L 419.6 940.9 L 552 940.9 L 552.7 938.4 L 559.1 938.4 L 559.1 889.7 L 552 889 L 552 879.1 L 559.1 878.4 L 559.1 830.1 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-G113",
        "code": "G113",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 63.92,
        "area_calc_m2": 61.8,
        "confidence": "high",
        "labelPos": {
          "x": 490.2,
          "y": 177.8
        },
        "center": {
          "x": 490.2,
          "y": 177.8
        },
        "bounds": {
          "minX": 412.2,
          "minY": 86.7,
          "maxX": 559.1,
          "maxY": 265,
          "width": 146.9,
          "height": 178.3
        },
        "pathData": "M 419.6 86.7 L 419 93.8 L 412.2 93.8 L 412.2 142.2 L 419.6 142.9 L 419.6 172.2 L 423.5 172.9 L 423.5 265 L 552 265 L 552.7 262.2 L 559.1 262.2 L 559.1 213.5 L 552 212.8 L 552 202.9 L 559.1 202.2 L 559.1 153.8 L 552 153.1 L 552 142.9 L 559.1 142.2 L 559.1 93.8 L 552.7 93.8 L 552 86.7 Z",
        "wing": "Corp G",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K101",
        "code": "K101",
        "name": "SALA DE CURS",
        "type": "classroom",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 84.57,
        "area_calc_m2": 83.2,
        "confidence": "high",
        "labelPos": {
          "x": 1255.4,
          "y": 713.9
        },
        "center": {
          "x": 1255.4,
          "y": 713.9
        },
        "bounds": {
          "minX": 1187,
          "minY": 626,
          "maxX": 1326.4,
          "maxY": 866.4,
          "width": 139.4,
          "height": 240.4
        },
        "pathData": "M 1187 626 L 1187 866.4 L 1319.3 866.4 L 1319.3 860.1 L 1326.4 859.3 L 1326.4 811 L 1319.3 810.3 L 1319.3 800.4 L 1326.4 799.7 L 1326.4 751 L 1319.3 750.3 L 1319.3 740.4 L 1326.4 739.7 L 1326.4 691 L 1319.3 690.3 L 1319.3 680.4 L 1326.4 679.7 L 1326.4 631 L 1320 631 L 1319.3 626 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K102",
        "code": "K102",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 48.57,
        "area_calc_m2": 47.4,
        "confidence": "high",
        "labelPos": {
          "x": 1252.9,
          "y": 551.9
        },
        "center": {
          "x": 1252.9,
          "y": 551.9
        },
        "bounds": {
          "minX": 1181.7,
          "minY": 484.2,
          "maxX": 1326.4,
          "maxY": 619.7,
          "width": 144.7,
          "height": 135.5
        },
        "pathData": "M 1187 484.2 L 1187 510.6 L 1181.7 511.3 L 1181.7 559.7 L 1187 560.4 L 1187 619.7 L 1326.4 619.7 L 1326.4 571.3 L 1319.3 570.6 L 1319.3 560.4 L 1326.4 559.7 L 1326.4 511.3 L 1319.3 510.6 L 1319.3 484.2 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K103",
        "code": "K103",
        "name": "CABINET",
        "type": "cabinet",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 18.11,
        "area_calc_m2": 17.6,
        "confidence": "high",
        "labelPos": {
          "x": 1259.3,
          "y": 445.3
        },
        "center": {
          "x": 1259.3,
          "y": 445.3
        },
        "bounds": {
          "minX": 1224.7,
          "minY": 410.8,
          "maxX": 1326.4,
          "maxY": 480.3,
          "width": 101.7,
          "height": 69.5
        },
        "pathData": "M 1224.7 410.8 L 1224.7 480.3 L 1326 480.3 L 1326.4 451.3 L 1319.3 450.6 L 1319.3 440.8 L 1326.4 440 L 1326 410.8 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K104",
        "code": "K104",
        "name": "SALA DE CURS",
        "type": "classroom",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 48.57,
        "area_calc_m2": 47.3,
        "confidence": "high",
        "labelPos": {
          "x": 1254,
          "y": 339.8
        },
        "center": {
          "x": 1254,
          "y": 339.8
        },
        "bounds": {
          "minX": 1181.7,
          "minY": 271.7,
          "maxX": 1326.4,
          "maxY": 406.9,
          "width": 144.7,
          "height": 135.2
        },
        "pathData": "M 1181.7 271.7 L 1181.7 320 L 1187 320.8 L 1187 406.9 L 1319.3 406.9 L 1319.3 380.8 L 1326.4 380 L 1326.4 331.3 L 1319.3 330.6 L 1319.3 320.8 L 1326.4 320 L 1326.4 271.7 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K105",
        "code": "K105",
        "name": "SALA DE CURS",
        "type": "classroom",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 84.57,
        "area_calc_m2": 83,
        "confidence": "high",
        "labelPos": {
          "x": 1255.4,
          "y": 114.6
        },
        "center": {
          "x": 1255.4,
          "y": 114.6
        },
        "bounds": {
          "minX": 1187,
          "minY": 25,
          "maxX": 1326.4,
          "maxY": 265,
          "width": 139.4,
          "height": 240
        },
        "pathData": "M 1187 25 L 1187 265 L 1319.3 265 L 1320 260 L 1326.4 260 L 1326.4 211.7 L 1319.3 211 L 1319.3 200.8 L 1326.4 200 L 1326.4 151.7 L 1319.3 151 L 1319.3 141.1 L 1326.4 140.4 L 1326.4 91.7 L 1319.3 91 L 1319.3 81.1 L 1326.4 80.4 L 1326.4 31.7 L 1320 31.7 L 1319.3 25 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "corridor-K106",
        "code": "K106",
        "name": "CORIDOR",
        "type": "corridor",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 179.64,
        "area_calc_m2": 173.6,
        "confidence": "high",
        "labelPos": {
          "x": 1124.1,
          "y": 355.7
        },
        "center": {
          "x": 1124.1,
          "y": 355.7
        },
        "bounds": {
          "minX": 1071.9,
          "minY": 25,
          "maxX": 1175.3,
          "maxY": 866.4,
          "width": 103.4,
          "height": 841.4
        },
        "pathData": "M 1117.4 25 L 1117.4 214.9 L 1071.9 215.6 L 1071.9 260 L 1078.9 260.8 L 1078.9 271 L 1071.9 271.7 L 1071.9 320 L 1078.9 320.8 L 1078.9 330.6 L 1071.9 331.3 L 1071.9 380 L 1078.9 380.8 L 1078.9 390.6 L 1071.9 391.3 L 1071.9 440 L 1078.9 440.8 L 1078.9 450.6 L 1071.9 451.3 L 1071.9 499.7 L 1078.9 500.4 L 1078.9 510.6 L 1071.9 511.3 L 1071.9 559.7 L 1078.9 560.4 L 1078.9 570.6 L 1071.9 571.3 L 1071.9 619.7 L 1078.9 620.4 L 1078.9 630.3 L 1071.9 631 L 1071.9 675.8 L 1114.2 675.4 L 1117.4 676.5 L 1117.4 866.4 L 1175.3 866.4 L 1175.3 25 Z",
        "wing": "Corp K",
        "isCorridor": true,
        "isTechnical": false
      },
      {
        "id": "room-K107",
        "code": "K107",
        "name": "GR. SAN.",
        "type": "service",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 28.64,
        "area_calc_m2": 27.1,
        "confidence": "high",
        "labelPos": {
          "x": 1019.2,
          "y": 727.9
        },
        "center": {
          "x": 1019.2,
          "y": 727.9
        },
        "bounds": {
          "minX": 960.3,
          "minY": 680.5,
          "maxX": 1078.2,
          "maxY": 775.3,
          "width": 117.9,
          "height": 94.8
        },
        "pathData": "M 960.3 680.5 L 960.3 775.3 L 1078.2 775.3 L 1078.2 680.5 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K108",
        "code": "K108",
        "name": "GR. SAN.",
        "type": "service",
        "floor": "E1",
        "level": "+4.20",
        "area_plan_m2": 28.28,
        "area_calc_m2": 29.7,
        "confidence": "high",
        "labelPos": {
          "x": 1019.2,
          "y": 163.0
        },
        "center": {
          "x": 1019.2,
          "y": 163.0
        },
        "bounds": {
          "minX": 960.3,
          "minY": 111.0,
          "maxX": 1078.2,
          "maxY": 214.9,
          "width": 117.9,
          "height": 103.9
        },
        "pathData": "M 960.3 111.0 L 960.3 214.9 L 1078.2 214.9 L 1078.2 111.0 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      }
    ],
    "stairs": [
      {
        "id": "stair-E1-01",
        "annotation": "19 Tr.",
        "steps": 19,
        "connector_id": "vc-06",
        "x": 330.6,
        "y": 743.2,
        "type": "vertical-connector"
      },
      {
        "id": "stair-E1-02",
        "annotation": "17 Tr.",
        "steps": 17,
        "connector_id": null,
        "x": 330.9,
        "y": 144.8,
        "type": "level-change"
      },
      {
        "id": "stair-E1-03",
        "annotation": "7 Tr.",
        "steps": 7,
        "connector_id": "vc-05",
        "x": 287.7,
        "y": 145.1,
        "type": "vertical-connector"
      },
      {
        "id": "stair-E1-04",
        "annotation": "24 Tr.",
        "steps": 24,
        "connector_id": "vc-08",
        "x": 1029.2,
        "y": 43.8,
        "type": "vertical-connector"
      },
      {
        "id": "stair-E1-05",
        "annotation": "24 Tr.",
        "steps": 24,
        "connector_id": "vc-07",
        "x": 1020.7,
        "y": 793.1,
        "type": "vertical-connector"
      }
    ]
  },
  "E2": {
    "id": "E2",
    "name": "Etaj 2",
    "shortName": "E2",
    "order": 3,
    "page": 4,
    "svg": "OSACE_E2_Etaj2.svg",
    "rooms": [
      {
        "id": "room-K201",
        "code": "K201",
        "name": "SALA DE CURS",
        "type": "classroom",
        "floor": "E2",
        "level": "+8.40",
        "area_plan_m2": 84.57,
        "area_calc_m2": 80.1,
        "confidence": "high",
        "labelPos": {
          "x": 1252.9,
          "y": 692.3
        },
        "center": {
          "x": 1252.9,
          "y": 692.3
        },
        "bounds": {
          "minX": 1186.6,
          "minY": 625.9,
          "maxX": 1319.3,
          "maxY": 866.3,
          "width": 132.7,
          "height": 240.4
        },
        "pathData": "M 1186.6 625.9 L 1186.6 866.3 L 1319.3 866.3 L 1319.3 625.9 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K202",
        "code": "K202",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E2",
        "level": "+8.40",
        "area_plan_m2": 48.57,
        "area_calc_m2": 45.2,
        "confidence": "high",
        "labelPos": {
          "x": 1252.9,
          "y": 550.4
        },
        "center": {
          "x": 1252.9,
          "y": 550.4
        },
        "bounds": {
          "minX": 1186.6,
          "minY": 484,
          "maxX": 1319.3,
          "maxY": 619.5,
          "width": 132.7,
          "height": 135.5
        },
        "pathData": "M 1186.6 484 L 1186.6 619.5 L 1319.3 619.5 L 1319.3 484 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K203",
        "code": "K203",
        "name": "CABINET",
        "type": "cabinet",
        "floor": "E2",
        "level": "+8.40",
        "area_plan_m2": 18.11,
        "area_calc_m2": 16.6,
        "confidence": "high",
        "labelPos": {
          "x": 1259.3,
          "y": 445.2
        },
        "center": {
          "x": 1259.3,
          "y": 445.2
        },
        "bounds": {
          "minX": 1224.7,
          "minY": 410.6,
          "maxX": 1319.3,
          "maxY": 480.1,
          "width": 94.6,
          "height": 69.5
        },
        "pathData": "M 1224.7 410.6 L 1224.7 480.1 L 1319.3 480.1 L 1319.3 410.6 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K204",
        "code": "K204",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E2",
        "level": "+8.40",
        "area_plan_m2": 48.57,
        "area_calc_m2": 45.1,
        "confidence": "high",
        "labelPos": {
          "x": 1252.9,
          "y": 337.9
        },
        "center": {
          "x": 1252.9,
          "y": 337.9
        },
        "bounds": {
          "minX": 1186.6,
          "minY": 271.6,
          "maxX": 1319.3,
          "maxY": 406.7,
          "width": 132.7,
          "height": 135.1
        },
        "pathData": "M 1186.6 271.6 L 1186.6 406.7 L 1319.3 406.7 L 1319.3 271.6 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K205",
        "code": "K205",
        "name": "SALA DE CURS",
        "type": "classroom",
        "floor": "E2",
        "level": "+8.40",
        "area_plan_m2": 84.57,
        "area_calc_m2": 80,
        "confidence": "high",
        "labelPos": {
          "x": 1252.9,
          "y": 91.2
        },
        "center": {
          "x": 1252.9,
          "y": 91.2
        },
        "bounds": {
          "minX": 1186.6,
          "minY": 24.8,
          "maxX": 1319.3,
          "maxY": 264.8,
          "width": 132.7,
          "height": 240
        },
        "pathData": "M 1186.6 24.8 L 1186.6 264.8 L 1319.3 264.8 L 1319.3 24.8 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "corridor-K206",
        "code": "K206",
        "name": "CORIDOR",
        "type": "corridor",
        "floor": "E2",
        "level": "+8.40",
        "area_plan_m2": 179.64,
        "area_calc_m2": 166.9,
        "confidence": "high",
        "labelPos": {
          "x": 1127,
          "y": 261.7
        },
        "center": {
          "x": 1127,
          "y": 261.7
        },
        "bounds": {
          "minX": 1079,
          "minY": 24.8,
          "maxX": 1175.3,
          "maxY": 866.3,
          "width": 96.3,
          "height": 841.5
        },
        "pathData": "M 1117.4 24.8 L 1117.4 214.7 L 1079 215.4 L 1079 675.7 L 1117.4 676.4 L 1117.4 866.3 L 1175.3 866.3 L 1175.3 24.8 Z",
        "wing": "Corp K",
        "isCorridor": true,
        "isTechnical": false
      },
      {
        "id": "room-K207",
        "code": "K207",
        "name": "GR. SAN.",
        "type": "service",
        "floor": "E2",
        "level": "+8.40",
        "area_plan_m2": 28.64,
        "area_calc_m2": 27.1,
        "confidence": "high",
        "labelPos": {
          "x": 1019.2,
          "y": 727.9
        },
        "center": {
          "x": 1019.2,
          "y": 727.9
        },
        "bounds": {
          "minX": 960.3,
          "minY": 680.5,
          "maxX": 1078.2,
          "maxY": 775.3,
          "width": 117.9,
          "height": 94.8
        },
        "pathData": "M 960.3 680.5 L 960.3 775.3 L 1078.2 775.3 L 1078.2 680.5 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K208",
        "code": "K208",
        "name": "GR. SAN.",
        "type": "service",
        "floor": "E2",
        "level": "+8.40",
        "area_plan_m2": 28.28,
        "area_calc_m2": 29.7,
        "confidence": "high",
        "labelPos": {
          "x": 1019.2,
          "y": 163.0
        },
        "center": {
          "x": 1019.2,
          "y": 163.0
        },
        "bounds": {
          "minX": 960.3,
          "minY": 111.0,
          "maxX": 1078.2,
          "maxY": 214.9,
          "width": 117.9,
          "height": 103.9
        },
        "pathData": "M 960.3 111.0 L 960.3 214.9 L 1078.2 214.9 L 1078.2 111.0 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      }
    ],
    "stairs": [
      {
        "id": "stair-E2-01",
        "annotation": "24 Tr.",
        "steps": 24,
        "connector_id": "vc-07",
        "x": 1025.4,
        "y": 793.1,
        "type": "vertical-connector"
      },
      {
        "id": "stair-E2-02",
        "annotation": "24 Tr.",
        "steps": 24,
        "connector_id": "vc-08",
        "x": 1017.7,
        "y": 44,
        "type": "vertical-connector"
      }
    ]
  },
  "E3": {
    "id": "E3",
    "name": "Etaj 3",
    "shortName": "E3",
    "order": 4,
    "page": 5,
    "svg": "OSACE_E3_Etaj3.svg",
    "rooms": [
      {
        "id": "room-K303",
        "code": "K303",
        "name": "CABINET",
        "type": "cabinet",
        "floor": "E3",
        "level": "",
        "area_plan_m2": 18.11,
        "area_calc_m2": 17.5,
        "confidence": "high",
        "labelPos": {
          "x": 1259.4,
          "y": 445.6
        },
        "center": {
          "x": 1259.4,
          "y": 445.6
        },
        "bounds": {
          "minX": 1224.9,
          "minY": 411.1,
          "maxX": 1326.1,
          "maxY": 480.2,
          "width": 101.2,
          "height": 69.1
        },
        "pathData": "M 1224.9 411.1 L 1224.9 480.2 L 1326.1 480.2 L 1326.1 451.3 L 1319.1 450.6 L 1319.1 440.7 L 1326.1 440 L 1326.1 411.1 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "corridor-K306",
        "code": "K306",
        "name": "CORIDOR",
        "type": "corridor",
        "floor": "E3",
        "level": "",
        "area_plan_m2": 179.64,
        "area_calc_m2": 175.7,
        "confidence": "high",
        "labelPos": {
          "x": 1124.2,
          "y": 415.6
        },
        "center": {
          "x": 1124.2,
          "y": 415.6
        },
        "bounds": {
          "minX": 1068.9,
          "minY": 24.9,
          "maxX": 1175.4,
          "maxY": 866.3,
          "width": 106.5,
          "height": 841.4
        },
        "pathData": "M 1117.2 24.9 L 1117.2 214.8 L 1072 215.5 L 1071.7 218.3 L 1072 260 L 1078.7 260.7 L 1078.7 270.9 L 1072 271.6 L 1071.7 275.2 L 1072 320 L 1078.7 320.7 L 1078.7 330.9 L 1072 331.6 L 1072 334.8 L 1068.9 335.5 L 1068.9 380 L 1078.7 380.7 L 1078.7 390.6 L 1068.9 391.3 L 1068.9 440 L 1078.7 440.7 L 1078.7 450.6 L 1068.9 451.3 L 1068.9 500 L 1078.7 500.7 L 1078.7 510.6 L 1068.9 511.3 L 1068.9 555.7 L 1072 556.5 L 1072 559.6 L 1078.7 560.3 L 1078.7 570.6 L 1072 571.3 L 1071.7 574.8 L 1072 619.6 L 1078.7 620.3 L 1078.7 630.6 L 1072 631.3 L 1071.7 671.9 L 1072 675.7 L 1114 675.4 L 1117.2 676.5 L 1117.2 866.3 L 1175.4 866.3 L 1175.4 24.9 Z",
        "wing": "Corp K",
        "isCorridor": true,
        "isTechnical": false
      },
      {
        "id": "room-K301",
        "code": "K301",
        "name": "SALA DE CURS",
        "type": "classroom",
        "floor": "E3",
        "level": "",
        "area_plan_m2": 84.57,
        "area_calc_m2": 83.3,
        "confidence": "high",
        "labelPos": {
          "x": 1255.2,
          "y": 713.8
        },
        "center": {
          "x": 1255.2,
          "y": 713.8
        },
        "bounds": {
          "minX": 1186.7,
          "minY": 626,
          "maxX": 1326.1,
          "maxY": 866.3,
          "width": 139.4,
          "height": 240.3
        },
        "pathData": "M 1186.7 626 L 1186.7 866.3 L 1319.1 866.3 L 1319.1 860 L 1326.1 859.3 L 1326.1 810.9 L 1319.1 810.2 L 1319.1 800.3 L 1326.1 799.6 L 1326.1 750.9 L 1319.1 750.2 L 1319.1 740.3 L 1326.1 739.6 L 1326.1 690.9 L 1319.1 690.2 L 1319.1 680.3 L 1326.1 679.6 L 1326.1 631.3 L 1319.8 631.3 L 1319.1 626 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K302",
        "code": "K302",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E3",
        "level": "",
        "area_plan_m2": 48.57,
        "area_calc_m2": 47.3,
        "confidence": "high",
        "labelPos": {
          "x": 1252.7,
          "y": 551.9
        },
        "center": {
          "x": 1252.7,
          "y": 551.9
        },
        "bounds": {
          "minX": 1181.8,
          "minY": 484.5,
          "maxX": 1326.1,
          "maxY": 619.6,
          "width": 144.3,
          "height": 135.1
        },
        "pathData": "M 1186.7 484.5 L 1186.7 510.6 L 1181.8 511.3 L 1181.8 559.6 L 1186.7 560.3 L 1186.7 619.6 L 1326.1 619.6 L 1326.1 571.3 L 1319.1 570.6 L 1319.1 560.3 L 1326.1 559.6 L 1326.1 511.3 L 1319.1 510.6 L 1319.1 484.5 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K304",
        "code": "K304",
        "name": "LABORATOR",
        "type": "laboratory",
        "floor": "E3",
        "level": "",
        "area_plan_m2": 48.57,
        "area_calc_m2": 47.3,
        "confidence": "high",
        "labelPos": {
          "x": 1253.8,
          "y": 339.7
        },
        "center": {
          "x": 1253.8,
          "y": 339.7
        },
        "bounds": {
          "minX": 1181.8,
          "minY": 271.6,
          "maxX": 1326.1,
          "maxY": 406.8,
          "width": 144.3,
          "height": 135.2
        },
        "pathData": "M 1181.8 271.6 L 1181.8 320 L 1186.7 320.7 L 1186.7 406.8 L 1319.1 406.8 L 1319.1 380.7 L 1326.1 380 L 1326.1 331.6 L 1319.1 330.9 L 1319.1 320.7 L 1326.1 320 L 1326.1 271.6 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K305",
        "code": "K305",
        "name": "SALA DE CURS",
        "type": "classroom",
        "floor": "E3",
        "level": "",
        "area_plan_m2": 84.57,
        "area_calc_m2": 83.3,
        "confidence": "high",
        "labelPos": {
          "x": 1255.2,
          "y": 114.6
        },
        "center": {
          "x": 1255.2,
          "y": 114.6
        },
        "bounds": {
          "minX": 1186.7,
          "minY": 24.9,
          "maxX": 1326.1,
          "maxY": 265.3,
          "width": 139.4,
          "height": 240.4
        },
        "pathData": "M 1186.7 24.9 L 1186.7 265.3 L 1319.1 265.3 L 1319.8 260 L 1326.1 260 L 1326.1 211.6 L 1319.1 210.9 L 1319.1 201 L 1326.1 200.3 L 1326.1 151.6 L 1319.1 150.9 L 1319.1 141 L 1326.1 140.3 L 1326.1 91.6 L 1319.1 90.9 L 1319.1 81 L 1326.1 80.3 L 1326.1 32 L 1319.8 32 L 1319.1 24.9 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K308",
        "code": "K308",
        "name": "GR. SAN.",
        "type": "service",
        "floor": "E3",
        "level": "",
        "area_plan_m2": 28.28,
        "area_calc_m2": 13.4,
        "confidence": "medium",
        "labelPos": {
          "x": 989.8,
          "y": 180.9
        },
        "center": {
          "x": 989.8,
          "y": 180.9
        },
        "bounds": {
          "minX": 964,
          "minY": 155.2,
          "maxX": 1067.4,
          "maxY": 207,
          "width": 103.4,
          "height": 51.8
        },
        "pathData": "M 964 155.2 L 964 200.3 L 970.4 200.3 L 971.1 207 L 1067.4 207 L 1067.4 155.2 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      },
      {
        "id": "room-K307",
        "code": "K307",
        "name": "GR. SAN.",
        "type": "service",
        "floor": "E3",
        "level": "",
        "area_plan_m2": 28.64,
        "area_calc_m2": 13.2,
        "confidence": "medium",
        "labelPos": {
          "x": 994.7,
          "y": 714.6
        },
        "center": {
          "x": 994.7,
          "y": 714.6
        },
        "bounds": {
          "minX": 964,
          "minY": 684.2,
          "maxX": 1025.4,
          "maxY": 769.6,
          "width": 61.4,
          "height": 85.4
        },
        "pathData": "M 971.1 684.2 L 970.4 690.9 L 964 690.9 L 964 769.6 L 1025.4 769.6 L 1025.4 684.2 Z",
        "wing": "Corp K",
        "isCorridor": false,
        "isTechnical": false
      }
    ],
    "stairs": [
      {
        "id": "stair-E3-01",
        "annotation": "24 Tr.",
        "steps": 24,
        "connector_id": "vc-08",
        "x": 1026.2,
        "y": 44,
        "type": "vertical-connector"
      },
      {
        "id": "stair-E3-02",
        "annotation": "24 Tr.",
        "steps": 24,
        "connector_id": "vc-07",
        "x": 1020.3,
        "y": 793.1,
        "type": "vertical-connector"
      }
    ]
  }
};

export const allRooms = Object.values(buildingFloors).flatMap((floor) => floor.rooms);

export const getRoomsByFloor = (floorId) => {
  return buildingFloors[floorId]?.rooms || [];
};

export const getRoomById = (roomId) => {
  return allRooms.find((r) => r.id === roomId) || null;
};

export const getRoomByCode = (code) => {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  return allRooms.find((r) => r.code.toUpperCase() === upper) || null;
};

export const searchRooms = (query, currentFloor = null) => {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  return allRooms.filter((room) => {
    // Ignore corridors and technical rooms in user searches by default unless searched directly
    if (room.isCorridor && !q.includes('coridor') && !q.includes('hol')) return false;

    const matchesCode = room.code.toLowerCase().includes(q);
    const matchesName = room.name.toLowerCase().includes(q);
    const typeRo = room.type === 'amphitheatre' ? 'amfiteatru amfiteatre aula' :
                   room.type === 'laboratory' ? 'laborator' :
                   room.type === 'classroom' ? 'sala curs seminar' :
                   room.type === 'office' ? 'birou cabinet' :
                   room.type === 'entrance' ? 'intrare' : '';
    const matchesType = room.type.toLowerCase().includes(q) || typeRo.includes(q);
    const matchesWing = room.wing.toLowerCase().includes(q);
    const matchesId = room.id.toLowerCase().includes(q);

    return matchesCode || matchesName || matchesType || matchesWing || matchesId;
  }).sort((a, b) => {
    // Exact code match first
    const aExact = a.code.toLowerCase() === q;
    const bExact = b.code.toLowerCase() === q;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    // Same floor first if currentFloor provided
    if (currentFloor) {
      if (a.floor === currentFloor && b.floor !== currentFloor) return -1;
      if (a.floor !== currentFloor && b.floor === currentFloor) return 1;
    }

    return a.code.localeCompare(b.code);
  });
};

export default {
  MAP_DIMENSIONS,
  ROOM_TYPE_COLORS,
  buildingFloors,
  allRooms,
  getRoomsByFloor,
  getRoomById,
  getRoomByCode,
  searchRooms,
};
