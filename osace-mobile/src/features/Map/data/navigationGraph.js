/**
 * Navigation Graph and A* Pathfinding for OSACE Indoor Map.
 * Provides full single-floor and multi-floor routing.
 */

export const NAV_NODES = {
  "B-C001": {
    "id": "B-C001",
    "x": 18,
    "y": 826.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C002": {
    "id": "B-C002",
    "x": 18,
    "y": 878.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C003": {
    "id": "B-C003",
    "x": 18,
    "y": 930.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C004": {
    "id": "B-C004",
    "x": 18,
    "y": 982.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C005": {
    "id": "B-C005",
    "x": 70,
    "y": 826.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C006": {
    "id": "B-C006",
    "x": 70,
    "y": 878.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C007": {
    "id": "B-C007",
    "x": 70,
    "y": 930.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C008": {
    "id": "B-C008",
    "x": 122,
    "y": 826.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C009": {
    "id": "B-C009",
    "x": 122,
    "y": 878.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C010": {
    "id": "B-C010",
    "x": 122,
    "y": 930.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C011": {
    "id": "B-C011",
    "x": 174,
    "y": 826.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C012": {
    "id": "B-C012",
    "x": 174,
    "y": 878.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C013": {
    "id": "B-C013",
    "x": 174,
    "y": 930.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C014": {
    "id": "B-C014",
    "x": 226,
    "y": 826.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C015": {
    "id": "B-C015",
    "x": 226,
    "y": 878.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C016": {
    "id": "B-C016",
    "x": 226,
    "y": 930.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C017": {
    "id": "B-C017",
    "x": 278,
    "y": 878.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C018": {
    "id": "B-C018",
    "x": 278,
    "y": 930.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C019": {
    "id": "B-C019",
    "x": 278,
    "y": 982.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C020": {
    "id": "B-C020",
    "x": 278,
    "y": 1034.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C021": {
    "id": "B-C021",
    "x": 330,
    "y": 878.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C022": {
    "id": "B-C022",
    "x": 330,
    "y": 930.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C023": {
    "id": "B-C023",
    "x": 330,
    "y": 982.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C024": {
    "id": "B-C024",
    "x": 330,
    "y": 1034.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C025": {
    "id": "B-C025",
    "x": 382,
    "y": 826.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C026": {
    "id": "B-C026",
    "x": 382,
    "y": 878.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C027": {
    "id": "B-C027",
    "x": 382,
    "y": 930.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C028": {
    "id": "B-C028",
    "x": 382,
    "y": 982.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C029": {
    "id": "B-C029",
    "x": 382,
    "y": 1034.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C030": {
    "id": "B-C030",
    "x": 434,
    "y": 930.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C031": {
    "id": "B-C031",
    "x": 434,
    "y": 982.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C032": {
    "id": "B-C032",
    "x": 434,
    "y": 1034.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C033": {
    "id": "B-C033",
    "x": 486,
    "y": 930.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C034": {
    "id": "B-C034",
    "x": 486,
    "y": 982.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C035": {
    "id": "B-C035",
    "x": 486,
    "y": 1034.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C036": {
    "id": "B-C036",
    "x": 538,
    "y": 930.2,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C037": {
    "id": "B-C037",
    "x": 581.3,
    "y": 871.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C038": {
    "id": "B-C038",
    "x": 581.3,
    "y": 923.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C039": {
    "id": "B-C039",
    "x": 633.3,
    "y": 871.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C040": {
    "id": "B-C040",
    "x": 633.3,
    "y": 923.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C041": {
    "id": "B-C041",
    "x": 685.3,
    "y": 871.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C042": {
    "id": "B-C042",
    "x": 685.3,
    "y": 923.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C043": {
    "id": "B-C043",
    "x": 737.3,
    "y": 871.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C044": {
    "id": "B-C044",
    "x": 737.3,
    "y": 923.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C045": {
    "id": "B-C045",
    "x": 789.3,
    "y": 923.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C046": {
    "id": "B-C046",
    "x": 789.3,
    "y": 975.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C047": {
    "id": "B-C047",
    "x": 841.3,
    "y": 923.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C048": {
    "id": "B-C048",
    "x": 841.3,
    "y": 975.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C049": {
    "id": "B-C049",
    "x": 841.3,
    "y": 1027.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C050": {
    "id": "B-C050",
    "x": 893.3,
    "y": 923.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C051": {
    "id": "B-C051",
    "x": 893.3,
    "y": 975.8,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C052": {
    "id": "B-C052",
    "x": 924.7,
    "y": 923.3,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C053": {
    "id": "B-C053",
    "x": 924.7,
    "y": 975.3,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C054": {
    "id": "B-C054",
    "x": 976.7,
    "y": 923.3,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C055": {
    "id": "B-C055",
    "x": 976.7,
    "y": 975.3,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C056": {
    "id": "B-C056",
    "x": 976.7,
    "y": 1027.3,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C057": {
    "id": "B-C057",
    "x": 1028.7,
    "y": 923.3,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C058": {
    "id": "B-C058",
    "x": 1028.7,
    "y": 975.3,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-C059": {
    "id": "B-C059",
    "x": 1028.7,
    "y": 1027.3,
    "floor": "B",
    "type": "corridor",
    "roomCode": null
  },
  "B-R-GD02": {
    "id": "B-R-GD02",
    "x": 89.6,
    "y": 1003.8,
    "floor": "B",
    "type": "room",
    "roomCode": "GD02"
  },
  "B-R-GD03": {
    "id": "B-R-GD03",
    "x": 208.2,
    "y": 1002.7,
    "floor": "B",
    "type": "room",
    "roomCode": "GD03"
  },
  "B-R-GD05": {
    "id": "B-R-GD05",
    "x": 530.1,
    "y": 1026.4,
    "floor": "B",
    "type": "room",
    "roomCode": "GD05"
  },
  "B-R-ID03": {
    "id": "B-R-ID03",
    "x": 660.7,
    "y": 1003.8,
    "floor": "B",
    "type": "room",
    "roomCode": "ID03"
  },
  "B-R-ID04": {
    "id": "B-R-ID04",
    "x": 747.2,
    "y": 977.7,
    "floor": "B",
    "type": "room",
    "roomCode": "ID04"
  },
  "B-R-ID09": {
    "id": "B-R-ID09",
    "x": 1059.5,
    "y": 1059.5,
    "floor": "B",
    "type": "room",
    "roomCode": "ID09"
  },
  "B-R-B-amfiteatru": {
    "id": "B-R-B-amfiteatru",
    "x": 949.4,
    "y": 1169.7,
    "floor": "B",
    "type": "room",
    "roomCode": "Aula Constantin Belea"
  },
  "B-S01": {
    "id": "B-S01",
    "x": 339.1,
    "y": 1110.5,
    "floor": "B",
    "type": "stair",
    "roomCode": null
  },
  "B-S02": {
    "id": "B-S02",
    "x": 482.8,
    "y": 1111.9,
    "floor": "B",
    "type": "stair",
    "roomCode": null
  },
  "B-S03": {
    "id": "B-S03",
    "x": 378.6,
    "y": 790.6,
    "floor": "B",
    "type": "stair",
    "roomCode": null
  },
  "B-S04": {
    "id": "B-S04",
    "x": 513.6,
    "y": 831.8,
    "floor": "B",
    "type": "stair",
    "roomCode": null
  },
  "B-S05": {
    "id": "B-S05",
    "x": 334.6,
    "y": 120.8,
    "floor": "B",
    "type": "stair",
    "roomCode": null
  },
  "B-S06": {
    "id": "B-S06",
    "x": 1150.6,
    "y": 855.5,
    "floor": "B",
    "type": "stair",
    "roomCode": null
  },
  "B-S07": {
    "id": "B-S07",
    "x": 1031.4,
    "y": 98.3,
    "floor": "B",
    "type": "stair",
    "roomCode": null
  },
  "B-S08": {
    "id": "B-S08",
    "x": 802,
    "y": 990,
    "floor": "B",
    "type": "poi",
    "roomCode": "Aula Constantin Belea"
  },
  "B-S09": {
    "id": "B-S09",
    "x": 800.5,
    "y": 986,
    "floor": "B",
    "type": "stair",
    "roomCode": null
  },
  "B-S10": {
    "id": "B-S10",
    "x": 945,
    "y": 901.3,
    "floor": "B",
    "type": "stair",
    "roomCode": null
  },
  "P-C001": {
    "id": "P-C001",
    "x": 356.5,
    "y": 90.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C002": {
    "id": "P-C002",
    "x": 356.5,
    "y": 142.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C003": {
    "id": "P-C003",
    "x": 356.5,
    "y": 194.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C004": {
    "id": "P-C004",
    "x": 356.5,
    "y": 246.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C005": {
    "id": "P-C005",
    "x": 356.5,
    "y": 298.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C006": {
    "id": "P-C006",
    "x": 356.5,
    "y": 350.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C007": {
    "id": "P-C007",
    "x": 356.5,
    "y": 402.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C008": {
    "id": "P-C008",
    "x": 356.5,
    "y": 454.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C009": {
    "id": "P-C009",
    "x": 356.5,
    "y": 506.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C010": {
    "id": "P-C010",
    "x": 356.5,
    "y": 558.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C011": {
    "id": "P-C011",
    "x": 356.5,
    "y": 610.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C012": {
    "id": "P-C012",
    "x": 356.5,
    "y": 662.5,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C013": {
    "id": "P-C013",
    "x": 34.6,
    "y": 871.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C014": {
    "id": "P-C014",
    "x": 34.6,
    "y": 923.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C015": {
    "id": "P-C015",
    "x": 86.6,
    "y": 871.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C016": {
    "id": "P-C016",
    "x": 86.6,
    "y": 923.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C017": {
    "id": "P-C017",
    "x": 138.6,
    "y": 871.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C018": {
    "id": "P-C018",
    "x": 138.6,
    "y": 923.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C019": {
    "id": "P-C019",
    "x": 190.6,
    "y": 871.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C020": {
    "id": "P-C020",
    "x": 190.6,
    "y": 923.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C021": {
    "id": "P-C021",
    "x": 242.6,
    "y": 871.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C022": {
    "id": "P-C022",
    "x": 242.6,
    "y": 923.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C023": {
    "id": "P-C023",
    "x": 294.6,
    "y": 871.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C024": {
    "id": "P-C024",
    "x": 294.6,
    "y": 923.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C025": {
    "id": "P-C025",
    "x": 294.6,
    "y": 975.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C026": {
    "id": "P-C026",
    "x": 346.6,
    "y": 819.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C027": {
    "id": "P-C027",
    "x": 346.6,
    "y": 871.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C028": {
    "id": "P-C028",
    "x": 346.6,
    "y": 923.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C029": {
    "id": "P-C029",
    "x": 346.6,
    "y": 975.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C030": {
    "id": "P-C030",
    "x": 398.6,
    "y": 819.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C031": {
    "id": "P-C031",
    "x": 398.6,
    "y": 871.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C032": {
    "id": "P-C032",
    "x": 398.6,
    "y": 923.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C033": {
    "id": "P-C033",
    "x": 398.6,
    "y": 975.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C034": {
    "id": "P-C034",
    "x": 450.6,
    "y": 923.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C035": {
    "id": "P-C035",
    "x": 450.6,
    "y": 975.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C036": {
    "id": "P-C036",
    "x": 502.6,
    "y": 923.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C037": {
    "id": "P-C037",
    "x": 502.6,
    "y": 975.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C038": {
    "id": "P-C038",
    "x": 554.6,
    "y": 923.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C039": {
    "id": "P-C039",
    "x": 554.6,
    "y": 975.7,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C040": {
    "id": "P-C040",
    "x": 1075.4,
    "y": 236.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C041": {
    "id": "P-C041",
    "x": 1075.4,
    "y": 288.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C042": {
    "id": "P-C042",
    "x": 1075.4,
    "y": 392.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C043": {
    "id": "P-C043",
    "x": 1075.4,
    "y": 496.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C044": {
    "id": "P-C044",
    "x": 1075.4,
    "y": 600.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C045": {
    "id": "P-C045",
    "x": 1075.4,
    "y": 652.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C046": {
    "id": "P-C046",
    "x": 1127.4,
    "y": 28.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C047": {
    "id": "P-C047",
    "x": 1127.4,
    "y": 80.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C048": {
    "id": "P-C048",
    "x": 1127.4,
    "y": 132.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C049": {
    "id": "P-C049",
    "x": 1127.4,
    "y": 184.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C050": {
    "id": "P-C050",
    "x": 1127.4,
    "y": 236.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C051": {
    "id": "P-C051",
    "x": 1127.4,
    "y": 288.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C052": {
    "id": "P-C052",
    "x": 1127.4,
    "y": 340.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C053": {
    "id": "P-C053",
    "x": 1127.4,
    "y": 392.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C054": {
    "id": "P-C054",
    "x": 1127.4,
    "y": 444.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C055": {
    "id": "P-C055",
    "x": 1127.4,
    "y": 496.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C056": {
    "id": "P-C056",
    "x": 1127.4,
    "y": 548.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C057": {
    "id": "P-C057",
    "x": 1127.4,
    "y": 600.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C058": {
    "id": "P-C058",
    "x": 1127.4,
    "y": 652.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C059": {
    "id": "P-C059",
    "x": 1127.4,
    "y": 704.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C060": {
    "id": "P-C060",
    "x": 1127.4,
    "y": 756.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C061": {
    "id": "P-C061",
    "x": 600,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C062": {
    "id": "P-C062",
    "x": 652,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C063": {
    "id": "P-C063",
    "x": 704,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C064": {
    "id": "P-C064",
    "x": 756,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C065": {
    "id": "P-C065",
    "x": 808,
    "y": 880.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C066": {
    "id": "P-C066",
    "x": 808,
    "y": 932.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C067": {
    "id": "P-C067",
    "x": 808,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C068": {
    "id": "P-C068",
    "x": 860,
    "y": 932.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C069": {
    "id": "P-C069",
    "x": 860,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C070": {
    "id": "P-C070",
    "x": 912,
    "y": 932.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C071": {
    "id": "P-C071",
    "x": 912,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C072": {
    "id": "P-C072",
    "x": 964,
    "y": 932.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C073": {
    "id": "P-C073",
    "x": 964,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C074": {
    "id": "P-C074",
    "x": 1016,
    "y": 932.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C075": {
    "id": "P-C075",
    "x": 1016,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C076": {
    "id": "P-C076",
    "x": 1068,
    "y": 932.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C077": {
    "id": "P-C077",
    "x": 1068,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C078": {
    "id": "P-C078",
    "x": 1120,
    "y": 932.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C079": {
    "id": "P-C079",
    "x": 1120,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C080": {
    "id": "P-C080",
    "x": 1172,
    "y": 932.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C081": {
    "id": "P-C081",
    "x": 1172,
    "y": 984.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-C082": {
    "id": "P-C082",
    "x": 1172,
    "y": 1036.4,
    "floor": "P",
    "type": "corridor",
    "roomCode": null
  },
  "P-R-G003": {
    "id": "P-R-G003",
    "x": 308.8,
    "y": 1039.6,
    "floor": "P",
    "type": "room",
    "roomCode": "G003"
  },
  "P-R-G004": {
    "id": "P-R-G004",
    "x": 373.4,
    "y": 1041,
    "floor": "P",
    "type": "room",
    "roomCode": "G004"
  },
  "P-R-G005": {
    "id": "P-R-G005",
    "x": 454.6,
    "y": 1041.3,
    "floor": "P",
    "type": "room",
    "roomCode": "G005"
  },
  "P-R-G006": {
    "id": "P-R-G006",
    "x": 519.5,
    "y": 1039.6,
    "floor": "P",
    "type": "room",
    "roomCode": "G006"
  },
  "P-R-G008": {
    "id": "P-R-G008",
    "x": 296.5,
    "y": 598.7,
    "floor": "P",
    "type": "room",
    "roomCode": "G008"
  },
  "P-R-G009": {
    "id": "P-R-G009",
    "x": 308.8,
    "y": 486.8,
    "floor": "P",
    "type": "room",
    "roomCode": "G009"
  },
  "P-R-G010": {
    "id": "P-R-G010",
    "x": 296.5,
    "y": 418.7,
    "floor": "P",
    "type": "room",
    "roomCode": "G010"
  },
  "P-R-G011": {
    "id": "P-R-G011",
    "x": 296.5,
    "y": 359.1,
    "floor": "P",
    "type": "room",
    "roomCode": "G011"
  },
  "P-R-G012": {
    "id": "P-R-G012",
    "x": 490.2,
    "y": 717.3,
    "floor": "P",
    "type": "room",
    "roomCode": "G012"
  },
  "P-R-G013": {
    "id": "P-R-G013",
    "x": 516.7,
    "y": 597.7,
    "floor": "P",
    "type": "room",
    "roomCode": "G013"
  },
  "P-R-G014": {
    "id": "P-R-G014",
    "x": 490.2,
    "y": 417.7,
    "floor": "P",
    "type": "room",
    "roomCode": "G014"
  },
  "P-R-G015": {
    "id": "P-R-G015",
    "x": 490.2,
    "y": 238,
    "floor": "P",
    "type": "room",
    "roomCode": "G015"
  },
  "P-R-G002": {
    "id": "P-R-G002",
    "x": 94.6,
    "y": 1007.4,
    "floor": "P",
    "type": "room",
    "roomCode": "G002"
  },
  "P-R-K001": {
    "id": "P-R-K001",
    "x": 1246.9,
    "y": 806.3,
    "floor": "P",
    "type": "room",
    "roomCode": "K001"
  },
  "P-R-K002": {
    "id": "P-R-K002",
    "x": 1209.2,
    "y": 713.8,
    "floor": "P",
    "type": "room",
    "roomCode": "K002"
  },
  "P-R-K003": {
    "id": "P-R-K003",
    "x": 1214.1,
    "y": 653.8,
    "floor": "P",
    "type": "room",
    "roomCode": "K003"
  },
  "P-R-K004": {
    "id": "P-R-K004",
    "x": 1209.5,
    "y": 591.7,
    "floor": "P",
    "type": "room",
    "roomCode": "K004"
  },
  "P-R-K005": {
    "id": "P-R-K005",
    "x": 1242.7,
    "y": 503.8,
    "floor": "P",
    "type": "room",
    "roomCode": "K005"
  },
  "P-R-K006": {
    "id": "P-R-K006",
    "x": 1242.7,
    "y": 387.7,
    "floor": "P",
    "type": "room",
    "roomCode": "K006"
  },
  "P-R-K007": {
    "id": "P-R-K007",
    "x": 1264.9,
    "y": 299.4,
    "floor": "P",
    "type": "room",
    "roomCode": "K007"
  },
  "P-R-K010": {
    "id": "P-R-K010",
    "x": 991.1,
    "y": 711.3,
    "floor": "P",
    "type": "room",
    "roomCode": "K010"
  },
  "P-R-K011": {
    "id": "P-R-K011",
    "x": 990,
    "y": 181.2,
    "floor": "P",
    "type": "room",
    "roomCode": "K011"
  },
  "P-R-K008": {
    "id": "P-R-K008",
    "x": 1245.9,
    "y": 205.9,
    "floor": "P",
    "type": "room",
    "roomCode": "K008"
  },
  "P-R-I003": {
    "id": "P-R-I003",
    "x": 632.8,
    "y": 904.7,
    "floor": "P",
    "type": "room",
    "roomCode": "I003"
  },
  "P-R-I004": {
    "id": "P-R-I004",
    "x": 619.8,
    "y": 1033.6,
    "floor": "P",
    "type": "room",
    "roomCode": "I004"
  },
  "P-R-I005": {
    "id": "P-R-I005",
    "x": 744.3,
    "y": 1037.4,
    "floor": "P",
    "type": "room",
    "roomCode": "I005"
  },
  "P-R-P-amfiteatru": {
    "id": "P-R-P-amfiteatru",
    "x": 927.9,
    "y": 447,
    "floor": "P",
    "type": "room",
    "roomCode": "P-amfiteatru"
  },
  "P-R-P-birou-7": {
    "id": "P-R-P-birou-7",
    "x": 1059.5,
    "y": 1059.7,
    "floor": "P",
    "type": "room",
    "roomCode": "P-birou-7"
  },
  "P-S01": {
    "id": "P-S01",
    "x": 237.2,
    "y": 708.7,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S02": {
    "id": "P-S02",
    "x": 237.7,
    "y": 185.2,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S03": {
    "id": "P-S03",
    "x": 249,
    "y": 166.3,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S04": {
    "id": "P-S04",
    "x": 249,
    "y": 209.5,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S05": {
    "id": "P-S05",
    "x": 287.7,
    "y": 138.9,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S06": {
    "id": "P-S06",
    "x": 287.7,
    "y": 756.7,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S07": {
    "id": "P-S07",
    "x": 330.6,
    "y": 755.9,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S08": {
    "id": "P-S08",
    "x": 378.9,
    "y": 777,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S09": {
    "id": "P-S09",
    "x": 1142.1,
    "y": -15.5,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S10": {
    "id": "P-S10",
    "x": 1037.7,
    "y": 91.8,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S11": {
    "id": "P-S11",
    "x": 1039.1,
    "y": 792.9,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S12": {
    "id": "P-S12",
    "x": 793.4,
    "y": 397.3,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S13": {
    "id": "P-S13",
    "x": 768,
    "y": 442.7,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "P-S14": {
    "id": "P-S14",
    "x": 793.7,
    "y": 493.6,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },

  "P-S16": {
    "id": "P-S16",
    "x": 960.6,
    "y": 902.4,
    "floor": "P",
    "type": "stair",
    "roomCode": null
  },
  "E1-C001": {
    "id": "E1-C001",
    "x": 356.8,
    "y": 90.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C002": {
    "id": "E1-C002",
    "x": 356.8,
    "y": 142.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C003": {
    "id": "E1-C003",
    "x": 356.8,
    "y": 194.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C004": {
    "id": "E1-C004",
    "x": 356.8,
    "y": 246.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C005": {
    "id": "E1-C005",
    "x": 356.8,
    "y": 298.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C006": {
    "id": "E1-C006",
    "x": 356.8,
    "y": 350.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C007": {
    "id": "E1-C007",
    "x": 356.8,
    "y": 402.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C008": {
    "id": "E1-C008",
    "x": 356.8,
    "y": 454.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C009": {
    "id": "E1-C009",
    "x": 356.8,
    "y": 506.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C010": {
    "id": "E1-C010",
    "x": 356.8,
    "y": 558.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C011": {
    "id": "E1-C011",
    "x": 356.8,
    "y": 610.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C012": {
    "id": "E1-C012",
    "x": 356.8,
    "y": 662.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C013": {
    "id": "E1-C013",
    "x": 356.8,
    "y": 714.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C014": {
    "id": "E1-C014",
    "x": 356.8,
    "y": 766.3,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C015": {
    "id": "E1-C015",
    "x": 1075.4,
    "y": 236.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C016": {
    "id": "E1-C016",
    "x": 1075.4,
    "y": 288.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C017": {
    "id": "E1-C017",
    "x": 1075.4,
    "y": 340.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C018": {
    "id": "E1-C018",
    "x": 1075.4,
    "y": 392.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C019": {
    "id": "E1-C019",
    "x": 1075.4,
    "y": 496.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C020": {
    "id": "E1-C020",
    "x": 1075.4,
    "y": 548.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C021": {
    "id": "E1-C021",
    "x": 1075.4,
    "y": 600.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C022": {
    "id": "E1-C022",
    "x": 1075.4,
    "y": 652.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C023": {
    "id": "E1-C023",
    "x": 1127.4,
    "y": 28.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C024": {
    "id": "E1-C024",
    "x": 1127.4,
    "y": 80.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C025": {
    "id": "E1-C025",
    "x": 1127.4,
    "y": 132.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C026": {
    "id": "E1-C026",
    "x": 1127.4,
    "y": 184.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C027": {
    "id": "E1-C027",
    "x": 1127.4,
    "y": 236.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C028": {
    "id": "E1-C028",
    "x": 1127.4,
    "y": 288.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C029": {
    "id": "E1-C029",
    "x": 1127.4,
    "y": 340.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C030": {
    "id": "E1-C030",
    "x": 1127.4,
    "y": 392.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C031": {
    "id": "E1-C031",
    "x": 1127.4,
    "y": 444.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C032": {
    "id": "E1-C032",
    "x": 1127.4,
    "y": 496.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C033": {
    "id": "E1-C033",
    "x": 1127.4,
    "y": 548.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C034": {
    "id": "E1-C034",
    "x": 1127.4,
    "y": 600.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C035": {
    "id": "E1-C035",
    "x": 1127.4,
    "y": 652.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C036": {
    "id": "E1-C036",
    "x": 1127.4,
    "y": 704.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C037": {
    "id": "E1-C037",
    "x": 1127.4,
    "y": 756.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C038": {
    "id": "E1-C038",
    "x": 1127.4,
    "y": 808.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-C039": {
    "id": "E1-C039",
    "x": 1127.4,
    "y": 860.2,
    "floor": "E1",
    "type": "corridor",
    "roomCode": null
  },
  "E1-R-G102": {
    "id": "E1-R-G102",
    "x": 380.5,
    "y": 837.8,
    "floor": "E1",
    "type": "room",
    "roomCode": "G102"
  },
  "E1-R-G103": {
    "id": "E1-R-G103",
    "x": 297.5,
    "y": 849.5,
    "floor": "E1",
    "type": "room",
    "roomCode": "G103"
  },
  "E1-R-G104": {
    "id": "E1-R-G104",
    "x": 337.4,
    "y": 974.1,
    "floor": "E1",
    "type": "room",
    "roomCode": "G104"
  },
  "E1-R-G106": {
    "id": "E1-R-G106",
    "x": 424.2,
    "y": 1094.1,
    "floor": "E1",
    "type": "room",
    "roomCode": "G106"
  },
  "E1-R-G108": {
    "id": "E1-R-G108",
    "x": 481.8,
    "y": 748.2,
    "floor": "E1",
    "type": "room",
    "roomCode": "G108"
  },
  "E1-R-G109": {
    "id": "E1-R-G109",
    "x": 480.7,
    "y": 627.4,
    "floor": "E1",
    "type": "room",
    "roomCode": "G109"
  },
  "E1-R-G110": {
    "id": "E1-R-G110",
    "x": 480.7,
    "y": 507.4,
    "floor": "E1",
    "type": "room",
    "roomCode": "G110"
  },
  "E1-R-G111": {
    "id": "E1-R-G111",
    "x": 480.7,
    "y": 387.8,
    "floor": "E1",
    "type": "room",
    "roomCode": "G111"
  },
  "E1-R-G112": {
    "id": "E1-R-G112",
    "x": 450.7,
    "y": 297.8,
    "floor": "E1",
    "type": "room",
    "roomCode": "G112"
  },
  "E1-R-G114": {
    "id": "E1-R-G114",
    "x": 285.5,
    "y": 237.5,
    "floor": "E1",
    "type": "room",
    "roomCode": "G114"
  },
  "E1-R-G115": {
    "id": "E1-R-G115",
    "x": 306,
    "y": 276.7,
    "floor": "E1",
    "type": "room",
    "roomCode": "G115"
  },
  "E1-R-G116": {
    "id": "E1-R-G116",
    "x": 296.8,
    "y": 358.9,
    "floor": "E1",
    "type": "room",
    "roomCode": "G116"
  },
  "E1-R-G117": {
    "id": "E1-R-G117",
    "x": 310.9,
    "y": 468.3,
    "floor": "E1",
    "type": "room",
    "roomCode": "G117"
  },
  "E1-R-G118": {
    "id": "E1-R-G118",
    "x": 296.8,
    "y": 538.5,
    "floor": "E1",
    "type": "room",
    "roomCode": "G118"
  },
  "E1-R-G119": {
    "id": "E1-R-G119",
    "x": 296.8,
    "y": 598.5,
    "floor": "E1",
    "type": "room",
    "roomCode": "G119"
  },
  "E1-R-G120": {
    "id": "E1-R-G120",
    "x": 295.8,
    "y": 657.5,
    "floor": "E1",
    "type": "room",
    "roomCode": "G120"
  },
  "E1-R-G107": {
    "id": "E1-R-G107",
    "x": 475.1,
    "y": 885.5,
    "floor": "E1",
    "type": "room",
    "roomCode": "G107"
  },
  "E1-R-G113": {
    "id": "E1-R-G113",
    "x": 490.2,
    "y": 177.8,
    "floor": "E1",
    "type": "room",
    "roomCode": "G113"
  },
  "E1-R-K101": {
    "id": "E1-R-K101",
    "x": 1255.4,
    "y": 713.9,
    "floor": "E1",
    "type": "room",
    "roomCode": "K101"
  },
  "E1-R-K102": {
    "id": "E1-R-K102",
    "x": 1252.9,
    "y": 551.9,
    "floor": "E1",
    "type": "room",
    "roomCode": "K102"
  },
  "E1-R-K103": {
    "id": "E1-R-K103",
    "x": 1259.3,
    "y": 445.3,
    "floor": "E1",
    "type": "room",
    "roomCode": "K103"
  },
  "E1-R-K104": {
    "id": "E1-R-K104",
    "x": 1254,
    "y": 339.8,
    "floor": "E1",
    "type": "room",
    "roomCode": "K104"
  },
  "E1-R-K105": {
    "id": "E1-R-K105",
    "x": 1255.4,
    "y": 114.6,
    "floor": "E1",
    "type": "room",
    "roomCode": "K105"
  },
  "E1-R-K107": {
    "id": "E1-R-K107",
    "x": 994.6,
    "y": 714.6,
    "floor": "E1",
    "type": "room",
    "roomCode": "K107"
  },
  "E1-R-K108": {
    "id": "E1-R-K108",
    "x": 989.7,
    "y": 181,
    "floor": "E1",
    "type": "room",
    "roomCode": "K108"
  },
  "E1-S01": {
    "id": "E1-S01",
    "x": 330.6,
    "y": 743.2,
    "floor": "E1",
    "type": "stair",
    "roomCode": null
  },
  "E1-S02": {
    "id": "E1-S02",
    "x": 330.9,
    "y": 144.8,
    "floor": "E1",
    "type": "stair",
    "roomCode": null
  },
  "E1-S03": {
    "id": "E1-S03",
    "x": 287.7,
    "y": 145.1,
    "floor": "E1",
    "type": "stair",
    "roomCode": null
  },
  "E1-S04": {
    "id": "E1-S04",
    "x": 1029.2,
    "y": 43.8,
    "floor": "E1",
    "type": "stair",
    "roomCode": null
  },
  "E1-S05": {
    "id": "E1-S05",
    "x": 1020.7,
    "y": 793.1,
    "floor": "E1",
    "type": "stair",
    "roomCode": null
  },
  "E2-C001": {
    "id": "E2-C001",
    "x": 1082.5,
    "y": 236.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C002": {
    "id": "E2-C002",
    "x": 1082.5,
    "y": 288.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C003": {
    "id": "E2-C003",
    "x": 1082.5,
    "y": 340.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C004": {
    "id": "E2-C004",
    "x": 1082.5,
    "y": 392.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C005": {
    "id": "E2-C005",
    "x": 1082.5,
    "y": 444.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C006": {
    "id": "E2-C006",
    "x": 1082.5,
    "y": 496.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C007": {
    "id": "E2-C007",
    "x": 1082.5,
    "y": 548.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C008": {
    "id": "E2-C008",
    "x": 1082.5,
    "y": 600.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C009": {
    "id": "E2-C009",
    "x": 1082.5,
    "y": 652.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C010": {
    "id": "E2-C010",
    "x": 1134.5,
    "y": 28.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C011": {
    "id": "E2-C011",
    "x": 1134.5,
    "y": 80.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C012": {
    "id": "E2-C012",
    "x": 1134.5,
    "y": 132.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C013": {
    "id": "E2-C013",
    "x": 1134.5,
    "y": 184.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C014": {
    "id": "E2-C014",
    "x": 1134.5,
    "y": 236.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C015": {
    "id": "E2-C015",
    "x": 1134.5,
    "y": 288.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C016": {
    "id": "E2-C016",
    "x": 1134.5,
    "y": 340.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C017": {
    "id": "E2-C017",
    "x": 1134.5,
    "y": 392.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C018": {
    "id": "E2-C018",
    "x": 1134.5,
    "y": 444.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C019": {
    "id": "E2-C019",
    "x": 1134.5,
    "y": 496.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C020": {
    "id": "E2-C020",
    "x": 1134.5,
    "y": 548.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C021": {
    "id": "E2-C021",
    "x": 1134.5,
    "y": 600.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C022": {
    "id": "E2-C022",
    "x": 1134.5,
    "y": 652.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C023": {
    "id": "E2-C023",
    "x": 1134.5,
    "y": 704.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C024": {
    "id": "E2-C024",
    "x": 1134.5,
    "y": 756.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C025": {
    "id": "E2-C025",
    "x": 1134.5,
    "y": 808.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-C026": {
    "id": "E2-C026",
    "x": 1134.5,
    "y": 860.4,
    "floor": "E2",
    "type": "corridor",
    "roomCode": null
  },
  "E2-R-K201": {
    "id": "E2-R-K201",
    "x": 1252.9,
    "y": 692.3,
    "floor": "E2",
    "type": "room",
    "roomCode": "K201"
  },
  "E2-R-K202": {
    "id": "E2-R-K202",
    "x": 1252.9,
    "y": 550.4,
    "floor": "E2",
    "type": "room",
    "roomCode": "K202"
  },
  "E2-R-K203": {
    "id": "E2-R-K203",
    "x": 1259.3,
    "y": 445.2,
    "floor": "E2",
    "type": "room",
    "roomCode": "K203"
  },
  "E2-R-K204": {
    "id": "E2-R-K204",
    "x": 1252.9,
    "y": 337.9,
    "floor": "E2",
    "type": "room",
    "roomCode": "K204"
  },
  "E2-R-K205": {
    "id": "E2-R-K205",
    "x": 1252.9,
    "y": 91.2,
    "floor": "E2",
    "type": "room",
    "roomCode": "K205"
  },
  "E2-R-K207": {
    "id": "E2-R-K207",
    "x": 994.6,
    "y": 714.9,
    "floor": "E2",
    "type": "room",
    "roomCode": "K207"
  },
  "E2-R-K208": {
    "id": "E2-R-K208",
    "x": 989.7,
    "y": 180.8,
    "floor": "E2",
    "type": "room",
    "roomCode": "K208"
  },
  "E2-S01": {
    "id": "E2-S01",
    "x": 1025.4,
    "y": 793.1,
    "floor": "E2",
    "type": "stair",
    "roomCode": null
  },
  "E2-S02": {
    "id": "E2-S02",
    "x": 1017.7,
    "y": 44,
    "floor": "E2",
    "type": "stair",
    "roomCode": null
  },
  "E3-C001": {
    "id": "E3-C001",
    "x": 1072.4,
    "y": 236.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C002": {
    "id": "E3-C002",
    "x": 1072.4,
    "y": 288.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C003": {
    "id": "E3-C003",
    "x": 1072.4,
    "y": 340.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C004": {
    "id": "E3-C004",
    "x": 1072.4,
    "y": 392.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C005": {
    "id": "E3-C005",
    "x": 1072.4,
    "y": 496.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C006": {
    "id": "E3-C006",
    "x": 1072.4,
    "y": 548.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C007": {
    "id": "E3-C007",
    "x": 1072.4,
    "y": 600.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C008": {
    "id": "E3-C008",
    "x": 1072.4,
    "y": 652.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C009": {
    "id": "E3-C009",
    "x": 1124.4,
    "y": 28.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C010": {
    "id": "E3-C010",
    "x": 1124.4,
    "y": 80.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C011": {
    "id": "E3-C011",
    "x": 1124.4,
    "y": 132.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C012": {
    "id": "E3-C012",
    "x": 1124.4,
    "y": 184.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C013": {
    "id": "E3-C013",
    "x": 1124.4,
    "y": 236.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C014": {
    "id": "E3-C014",
    "x": 1124.4,
    "y": 288.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C015": {
    "id": "E3-C015",
    "x": 1124.4,
    "y": 340.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C016": {
    "id": "E3-C016",
    "x": 1124.4,
    "y": 392.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C017": {
    "id": "E3-C017",
    "x": 1124.4,
    "y": 444.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C018": {
    "id": "E3-C018",
    "x": 1124.4,
    "y": 496.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C019": {
    "id": "E3-C019",
    "x": 1124.4,
    "y": 548.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C020": {
    "id": "E3-C020",
    "x": 1124.4,
    "y": 600.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C021": {
    "id": "E3-C021",
    "x": 1124.4,
    "y": 652.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C022": {
    "id": "E3-C022",
    "x": 1124.4,
    "y": 704.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C023": {
    "id": "E3-C023",
    "x": 1124.4,
    "y": 756.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C024": {
    "id": "E3-C024",
    "x": 1124.4,
    "y": 808.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-C025": {
    "id": "E3-C025",
    "x": 1124.4,
    "y": 860.1,
    "floor": "E3",
    "type": "corridor",
    "roomCode": null
  },
  "E3-R-K303": {
    "id": "E3-R-K303",
    "x": 1259.4,
    "y": 445.6,
    "floor": "E3",
    "type": "room",
    "roomCode": "K303"
  },
  "E3-R-K301": {
    "id": "E3-R-K301",
    "x": 1255.2,
    "y": 713.8,
    "floor": "E3",
    "type": "room",
    "roomCode": "K301"
  },
  "E3-R-K302": {
    "id": "E3-R-K302",
    "x": 1252.7,
    "y": 551.9,
    "floor": "E3",
    "type": "room",
    "roomCode": "K302"
  },
  "E3-R-K304": {
    "id": "E3-R-K304",
    "x": 1253.8,
    "y": 339.7,
    "floor": "E3",
    "type": "room",
    "roomCode": "K304"
  },
  "E3-R-K305": {
    "id": "E3-R-K305",
    "x": 1255.2,
    "y": 114.6,
    "floor": "E3",
    "type": "room",
    "roomCode": "K305"
  },
  "E3-R-K308": {
    "id": "E3-R-K308",
    "x": 989.8,
    "y": 180.9,
    "floor": "E3",
    "type": "room",
    "roomCode": "K308"
  },
  "E3-R-K307": {
    "id": "E3-R-K307",
    "x": 994.7,
    "y": 714.6,
    "floor": "E3",
    "type": "room",
    "roomCode": "K307"
  },
  "E3-S01": {
    "id": "E3-S01",
    "x": 1026.2,
    "y": 44,
    "floor": "E3",
    "type": "stair",
    "roomCode": null
  },
  "E3-S02": {
    "id": "E3-S02",
    "x": 1020.3,
    "y": 793.1,
    "floor": "E3",
    "type": "stair",
    "roomCode": null
  }
};

export const NAV_EDGES = [
  {
    "from": "B-C001",
    "to": "B-C002",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C002",
    "to": "B-C003",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C002",
    "to": "B-C006",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C003",
    "to": "B-C004",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C005",
    "to": "B-C006",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C005",
    "to": "B-C008",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C006",
    "to": "B-C007",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C006",
    "to": "B-C009",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C007",
    "to": "B-C010",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C008",
    "to": "B-C009",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C009",
    "to": "B-C010",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C009",
    "to": "B-C012",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C010",
    "to": "B-C013",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C011",
    "to": "B-C012",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C011",
    "to": "B-C014",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C012",
    "to": "B-C013",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C012",
    "to": "B-C015",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C013",
    "to": "B-C016",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C014",
    "to": "B-C015",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C015",
    "to": "B-C016",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C016",
    "to": "B-C018",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C017",
    "to": "B-C018",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C017",
    "to": "B-C021",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C018",
    "to": "B-C022",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C019",
    "to": "B-C020",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C019",
    "to": "B-C023",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C020",
    "to": "B-C024",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C021",
    "to": "B-C022",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C021",
    "to": "B-C026",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C022",
    "to": "B-C023",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C022",
    "to": "B-C027",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C023",
    "to": "B-C024",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C023",
    "to": "B-C028",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C024",
    "to": "B-C029",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C025",
    "to": "B-C026",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C026",
    "to": "B-C027",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C027",
    "to": "B-C028",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C027",
    "to": "B-C030",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C028",
    "to": "B-C029",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C030",
    "to": "B-C031",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C030",
    "to": "B-C033",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C031",
    "to": "B-C032",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C031",
    "to": "B-C034",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C032",
    "to": "B-C035",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C033",
    "to": "B-C034",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C033",
    "to": "B-C036",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C034",
    "to": "B-C035",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C037",
    "to": "B-C039",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C038",
    "to": "B-C040",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C039",
    "to": "B-C040",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C039",
    "to": "B-C041",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C040",
    "to": "B-C042",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C041",
    "to": "B-C042",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C041",
    "to": "B-C043",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C042",
    "to": "B-C044",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C043",
    "to": "B-C044",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C044",
    "to": "B-C045",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C045",
    "to": "B-C046",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C045",
    "to": "B-C047",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C046",
    "to": "B-C048",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C047",
    "to": "B-C048",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C047",
    "to": "B-C050",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C048",
    "to": "B-C049",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C048",
    "to": "B-C051",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C050",
    "to": "B-C051",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C052",
    "to": "B-C053",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C052",
    "to": "B-C054",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C053",
    "to": "B-C055",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C054",
    "to": "B-C055",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C054",
    "to": "B-C057",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C055",
    "to": "B-C056",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C055",
    "to": "B-C058",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C057",
    "to": "B-C058",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-C058",
    "to": "B-C059",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "B-R-GD02",
    "to": "B-C004",
    "kind": "door",
    "weight": 74.8
  },
  {
    "from": "B-R-GD03",
    "to": "B-C019",
    "kind": "door",
    "weight": 72.7
  },
  {
    "from": "B-R-GD05",
    "to": "B-C035",
    "kind": "door",
    "weight": 44.8
  },
  {
    "from": "B-R-ID03",
    "to": "B-C042",
    "kind": "door",
    "weight": 83.7
  },
  {
    "from": "B-R-ID04",
    "to": "B-C046",
    "kind": "door",
    "weight": 42.1
  },
  {
    "from": "B-R-ID09",
    "to": "B-C059",
    "kind": "door",
    "weight": 44.6
  },
  {
    "from": "B-R-B-amfiteatru",
    "to": "B-C056",
    "kind": "door",
    "weight": 145
  },
  {
    "from": "B-S01",
    "to": "B-C024",
    "kind": "corridor-stair",
    "weight": 76.8
  },
  {
    "from": "B-S02",
    "to": "B-C035",
    "kind": "corridor-stair",
    "weight": 77.8
  },
  {
    "from": "B-S03",
    "to": "B-C025",
    "kind": "corridor-stair",
    "weight": 35.8
  },
  {
    "from": "B-S04",
    "to": "B-C037",
    "kind": "corridor-stair",
    "weight": 78.6
  },
  {
    "from": "B-S05",
    "to": "B-C025",
    "kind": "corridor-stair",
    "weight": 707
  },
  {
    "from": "B-S06",
    "to": "B-C057",
    "kind": "corridor-stair",
    "weight": 139.5
  },
  {
    "from": "B-S07",
    "to": "B-C057",
    "kind": "corridor-stair",
    "weight": 825
  },
  {
    "from": "B-S08",
    "to": "B-C046",
    "kind": "corridor-stair",
    "weight": 18
  },
  {
    "from": "B-S08",
    "to": "B-R-B-amfiteatru",
    "kind": "door",
    "weight": 35
  },
  {
    "from": "B-S09",
    "to": "B-C046",
    "kind": "corridor-stair",
    "weight": 15.1
  },
  {
    "from": "B-S10",
    "to": "B-C052",
    "kind": "corridor-stair",
    "weight": 29.9
  },
  {
    "from": "P-C001",
    "to": "P-C002",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C002",
    "to": "P-C003",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C003",
    "to": "P-C004",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C004",
    "to": "P-C005",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C005",
    "to": "P-C006",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C006",
    "to": "P-C007",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C007",
    "to": "P-C008",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C008",
    "to": "P-C009",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C009",
    "to": "P-C010",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C010",
    "to": "P-C011",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C011",
    "to": "P-C012",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C013",
    "to": "P-C014",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C013",
    "to": "P-C015",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C014",
    "to": "P-C016",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C015",
    "to": "P-C016",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C015",
    "to": "P-C017",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C016",
    "to": "P-C018",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C017",
    "to": "P-C018",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C017",
    "to": "P-C019",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C018",
    "to": "P-C020",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C019",
    "to": "P-C020",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C019",
    "to": "P-C021",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C020",
    "to": "P-C022",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C021",
    "to": "P-C022",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C021",
    "to": "P-C023",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C022",
    "to": "P-C024",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C023",
    "to": "P-C024",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C023",
    "to": "P-C027",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C024",
    "to": "P-C025",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C024",
    "to": "P-C028",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C025",
    "to": "P-C029",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C026",
    "to": "P-C027",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C027",
    "to": "P-C028",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C027",
    "to": "P-C031",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C028",
    "to": "P-C029",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C028",
    "to": "P-C032",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C029",
    "to": "P-C033",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C030",
    "to": "P-C031",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C031",
    "to": "P-C032",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C032",
    "to": "P-C033",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C032",
    "to": "P-C034",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C033",
    "to": "P-C035",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C034",
    "to": "P-C035",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C034",
    "to": "P-C036",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C035",
    "to": "P-C037",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C036",
    "to": "P-C037",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C036",
    "to": "P-C038",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C037",
    "to": "P-C039",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C040",
    "to": "P-C050",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C041",
    "to": "P-C051",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C042",
    "to": "P-C053",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C043",
    "to": "P-C055",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C044",
    "to": "P-C057",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C045",
    "to": "P-C058",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C046",
    "to": "P-C047",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C047",
    "to": "P-C048",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C048",
    "to": "P-C049",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C049",
    "to": "P-C050",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C050",
    "to": "P-C051",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C051",
    "to": "P-C052",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C052",
    "to": "P-C053",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C053",
    "to": "P-C054",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C054",
    "to": "P-C055",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C055",
    "to": "P-C056",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C056",
    "to": "P-C057",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C057",
    "to": "P-C058",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C058",
    "to": "P-C059",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C059",
    "to": "P-C060",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C061",
    "to": "P-C062",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C062",
    "to": "P-C063",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C063",
    "to": "P-C064",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C064",
    "to": "P-C067",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C065",
    "to": "P-C066",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C066",
    "to": "P-C067",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C066",
    "to": "P-C068",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C067",
    "to": "P-C069",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C068",
    "to": "P-C069",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C068",
    "to": "P-C070",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C069",
    "to": "P-C071",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C070",
    "to": "P-C071",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C070",
    "to": "P-C072",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C071",
    "to": "P-C073",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C072",
    "to": "P-C073",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C072",
    "to": "P-C074",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C073",
    "to": "P-C075",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C074",
    "to": "P-C075",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C074",
    "to": "P-C076",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C075",
    "to": "P-C077",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C076",
    "to": "P-C077",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C076",
    "to": "P-C078",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C077",
    "to": "P-C079",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C078",
    "to": "P-C079",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C078",
    "to": "P-C080",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C079",
    "to": "P-C081",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C080",
    "to": "P-C081",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "P-C081",
    "to": "P-C082",
    "kind": "corridor",
    "weight": 52
  },

  {
    "from": "P-S16",
    "to": "P-C072",
    "kind": "stair-access",
    "weight": 30.2
  },
  {
    "from": "P-R-G003",
    "to": "P-C025",
    "kind": "door",
    "weight": 65.5
  },
  {
    "from": "P-R-G004",
    "to": "P-C033",
    "kind": "door",
    "weight": 70
  },
  {
    "from": "P-R-G005",
    "to": "P-C035",
    "kind": "door",
    "weight": 65.7
  },
  {
    "from": "P-R-G006",
    "to": "P-C037",
    "kind": "door",
    "weight": 66.1
  },
  {
    "from": "P-R-G008",
    "to": "P-C011",
    "kind": "door",
    "weight": 61.1
  },
  {
    "from": "P-R-G009",
    "to": "P-C009",
    "kind": "door",
    "weight": 51.6
  },
  {
    "from": "P-R-G010",
    "to": "P-C007",
    "kind": "door",
    "weight": 62.1
  },
  {
    "from": "P-R-G011",
    "to": "P-C006",
    "kind": "door",
    "weight": 60.6
  },
  {
    "from": "P-R-G012",
    "to": "P-C030",
    "kind": "door",
    "weight": 137.4
  },
  {
    "from": "P-R-G013",
    "to": "P-C011",
    "kind": "door",
    "weight": 160.7
  },
  {
    "from": "P-R-G014",
    "to": "P-C007",
    "kind": "door",
    "weight": 134.6
  },
  {
    "from": "P-R-G015",
    "to": "P-C004",
    "kind": "door",
    "weight": 134
  },
  {
    "from": "P-R-G002",
    "to": "P-C016",
    "kind": "door",
    "weight": 84.1
  },
  {
    "from": "P-R-K001",
    "to": "P-C060",
    "kind": "door",
    "weight": 129.5
  },
  {
    "from": "P-R-K002",
    "to": "P-C059",
    "kind": "door",
    "weight": 82.3
  },
  {
    "from": "P-R-K003",
    "to": "P-C058",
    "kind": "door",
    "weight": 86.7
  },
  {
    "from": "P-R-K004",
    "to": "P-C057",
    "kind": "door",
    "weight": 82.6
  },
  {
    "from": "P-R-K005",
    "to": "P-C055",
    "kind": "door",
    "weight": 115.5
  },
  {
    "from": "P-R-K006",
    "to": "P-C053",
    "kind": "door",
    "weight": 115.4
  },
  {
    "from": "P-R-K007",
    "to": "P-C051",
    "kind": "door",
    "weight": 137.9
  },
  {
    "from": "P-R-K010",
    "to": "P-C045",
    "kind": "door",
    "weight": 102.8
  },
  {
    "from": "P-R-K011",
    "to": "P-C040",
    "kind": "door",
    "weight": 101.7
  },
  {
    "from": "P-R-K008",
    "to": "P-C049",
    "kind": "door",
    "weight": 120.4
  },
  {
    "from": "P-R-I003",
    "to": "P-C038",
    "kind": "door",
    "weight": 80.5
  },
  {
    "from": "P-R-I004",
    "to": "P-C061",
    "kind": "door",
    "weight": 53
  },
  {
    "from": "P-R-I005",
    "to": "P-C064",
    "kind": "door",
    "weight": 54.3
  },
  {
    "from": "P-R-P-amfiteatru",
    "to": "P-C043",
    "kind": "door",
    "weight": 155.6
  },
  {
    "from": "P-R-P-birou-7",
    "to": "P-C077",
    "kind": "door",
    "weight": 75.8
  },
  {
    "from": "P-S01",
    "to": "P-C012",
    "kind": "corridor-stair",
    "weight": 127.9
  },
  {
    "from": "P-S02",
    "to": "P-C003",
    "kind": "corridor-stair",
    "weight": 119.2
  },
  {
    "from": "P-S03",
    "to": "P-C002",
    "kind": "corridor-stair",
    "weight": 110.1
  },
  {
    "from": "P-S04",
    "to": "P-C003",
    "kind": "corridor-stair",
    "weight": 108.5
  },
  {
    "from": "P-S05",
    "to": "P-C002",
    "kind": "corridor-stair",
    "weight": 68.9
  },
  {
    "from": "P-S06",
    "to": "P-C026",
    "kind": "corridor-stair",
    "weight": 86.2
  },
  {
    "from": "P-S07",
    "to": "P-C026",
    "kind": "corridor-stair",
    "weight": 65.8
  },
  {
    "from": "P-S08",
    "to": "P-C030",
    "kind": "corridor-stair",
    "weight": 47
  },
  {
    "from": "P-S09",
    "to": "P-C046",
    "kind": "corridor-stair",
    "weight": 46.3
  },
  {
    "from": "P-S10",
    "to": "P-C047",
    "kind": "corridor-stair",
    "weight": 90.4
  },
  {
    "from": "P-S11",
    "to": "P-C060",
    "kind": "corridor-stair",
    "weight": 95.5
  },
  {
    "from": "P-S12",
    "to": "P-C042",
    "kind": "corridor-stair",
    "weight": 282
  },
  {
    "from": "P-S13",
    "to": "P-C042",
    "kind": "corridor-stair",
    "weight": 311.5
  },
  {
    "from": "P-S14",
    "to": "P-C043",
    "kind": "corridor-stair",
    "weight": 281.7
  },

  {
    "from": "P-S16",
    "to": "P-C072",
    "kind": "corridor-stair",
    "weight": 30.2
  },
  {
    "from": "E1-C001",
    "to": "E1-C002",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C002",
    "to": "E1-C003",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C003",
    "to": "E1-C004",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C004",
    "to": "E1-C005",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C005",
    "to": "E1-C006",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C006",
    "to": "E1-C007",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C007",
    "to": "E1-C008",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C008",
    "to": "E1-C009",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C009",
    "to": "E1-C010",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C010",
    "to": "E1-C011",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C011",
    "to": "E1-C012",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C012",
    "to": "E1-C013",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C013",
    "to": "E1-C014",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C015",
    "to": "E1-C027",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C016",
    "to": "E1-C028",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C017",
    "to": "E1-C029",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C018",
    "to": "E1-C030",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C019",
    "to": "E1-C032",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C020",
    "to": "E1-C033",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C021",
    "to": "E1-C034",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C022",
    "to": "E1-C035",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C023",
    "to": "E1-C024",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C024",
    "to": "E1-C025",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C025",
    "to": "E1-C026",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C026",
    "to": "E1-C027",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C027",
    "to": "E1-C028",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C028",
    "to": "E1-C029",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C029",
    "to": "E1-C030",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C030",
    "to": "E1-C031",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C031",
    "to": "E1-C032",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C032",
    "to": "E1-C033",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C033",
    "to": "E1-C034",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C034",
    "to": "E1-C035",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C035",
    "to": "E1-C036",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C036",
    "to": "E1-C037",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C037",
    "to": "E1-C038",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-C038",
    "to": "E1-C039",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E1-R-G102",
    "to": "E1-C014",
    "kind": "door",
    "weight": 75.3
  },
  {
    "from": "E1-R-G103",
    "to": "E1-C014",
    "kind": "door",
    "weight": 102.2
  },
  {
    "from": "E1-R-G104",
    "to": "E1-C014",
    "kind": "door",
    "weight": 208.7
  },
  {
    "from": "E1-R-G106",
    "to": "E1-C014",
    "kind": "door",
    "weight": 334.7
  },
  {
    "from": "E1-R-G108",
    "to": "E1-C014",
    "kind": "door",
    "weight": 126.3
  },
  {
    "from": "E1-R-G109",
    "to": "E1-C011",
    "kind": "door",
    "weight": 125.1
  },
  {
    "from": "E1-R-G110",
    "to": "E1-C009",
    "kind": "door",
    "weight": 123.9
  },
  {
    "from": "E1-R-G111",
    "to": "E1-C007",
    "kind": "door",
    "weight": 124.7
  },
  {
    "from": "E1-R-G112",
    "to": "E1-C005",
    "kind": "door",
    "weight": 93.9
  },
  {
    "from": "E1-R-G114",
    "to": "E1-C004",
    "kind": "door",
    "weight": 71.8
  },
  {
    "from": "E1-R-G115",
    "to": "E1-C005",
    "kind": "door",
    "weight": 55.2
  },
  {
    "from": "E1-R-G116",
    "to": "E1-C006",
    "kind": "door",
    "weight": 60.6
  },
  {
    "from": "E1-R-G117",
    "to": "E1-C008",
    "kind": "door",
    "weight": 48
  },
  {
    "from": "E1-R-G118",
    "to": "E1-C010",
    "kind": "door",
    "weight": 63.2
  },
  {
    "from": "E1-R-G119",
    "to": "E1-C011",
    "kind": "door",
    "weight": 61.1
  },
  {
    "from": "E1-R-G120",
    "to": "E1-C012",
    "kind": "door",
    "weight": 61.2
  },
  {
    "from": "E1-R-G107",
    "to": "E1-C014",
    "kind": "door",
    "weight": 167.9
  },
  {
    "from": "E1-R-G113",
    "to": "E1-C003",
    "kind": "door",
    "weight": 134.4
  },
  {
    "from": "E1-R-K101",
    "to": "E1-C036",
    "kind": "door",
    "weight": 128.4
  },
  {
    "from": "E1-R-K102",
    "to": "E1-C033",
    "kind": "door",
    "weight": 125.6
  },
  {
    "from": "E1-R-K103",
    "to": "E1-C031",
    "kind": "door",
    "weight": 131.9
  },
  {
    "from": "E1-R-K104",
    "to": "E1-C029",
    "kind": "door",
    "weight": 126.6
  },
  {
    "from": "E1-R-K105",
    "to": "E1-C025",
    "kind": "door",
    "weight": 129.2
  },
  {
    "from": "E1-R-K107",
    "to": "E1-C022",
    "kind": "door",
    "weight": 102.1
  },
  {
    "from": "E1-R-K108",
    "to": "E1-C015",
    "kind": "door",
    "weight": 101.9
  },
  {
    "from": "E1-S01",
    "to": "E1-C014",
    "kind": "corridor-stair",
    "weight": 34.9
  },
  {
    "from": "E1-S02",
    "to": "E1-C002",
    "kind": "corridor-stair",
    "weight": 26
  },
  {
    "from": "E1-S03",
    "to": "E1-C002",
    "kind": "corridor-stair",
    "weight": 69.2
  },
  {
    "from": "E1-S04",
    "to": "E1-C023",
    "kind": "corridor-stair",
    "weight": 99.4
  },
  {
    "from": "E1-S05",
    "to": "E1-C038",
    "kind": "corridor-stair",
    "weight": 107.8
  },
  {
    "from": "E2-C001",
    "to": "E2-C002",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C001",
    "to": "E2-C014",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C002",
    "to": "E2-C003",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C002",
    "to": "E2-C015",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C003",
    "to": "E2-C004",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C003",
    "to": "E2-C016",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C004",
    "to": "E2-C005",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C004",
    "to": "E2-C017",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C005",
    "to": "E2-C006",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C005",
    "to": "E2-C018",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C006",
    "to": "E2-C007",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C006",
    "to": "E2-C019",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C007",
    "to": "E2-C008",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C007",
    "to": "E2-C020",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C008",
    "to": "E2-C009",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C008",
    "to": "E2-C021",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C009",
    "to": "E2-C022",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C010",
    "to": "E2-C011",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C011",
    "to": "E2-C012",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C012",
    "to": "E2-C013",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C013",
    "to": "E2-C014",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C014",
    "to": "E2-C015",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C015",
    "to": "E2-C016",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C016",
    "to": "E2-C017",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C017",
    "to": "E2-C018",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C018",
    "to": "E2-C019",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C019",
    "to": "E2-C020",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C020",
    "to": "E2-C021",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C021",
    "to": "E2-C022",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C022",
    "to": "E2-C023",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C023",
    "to": "E2-C024",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C024",
    "to": "E2-C025",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-C025",
    "to": "E2-C026",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E2-R-K201",
    "to": "E2-C023",
    "kind": "door",
    "weight": 119
  },
  {
    "from": "E2-R-K202",
    "to": "E2-C020",
    "kind": "door",
    "weight": 118.4
  },
  {
    "from": "E2-R-K203",
    "to": "E2-C018",
    "kind": "door",
    "weight": 124.8
  },
  {
    "from": "E2-R-K204",
    "to": "E2-C016",
    "kind": "door",
    "weight": 118.4
  },
  {
    "from": "E2-R-K205",
    "to": "E2-C011",
    "kind": "door",
    "weight": 118.9
  },
  {
    "from": "E2-R-K207",
    "to": "E2-C009",
    "kind": "door",
    "weight": 107.9
  },
  {
    "from": "E2-R-K208",
    "to": "E2-C001",
    "kind": "door",
    "weight": 108.2
  },
  {
    "from": "E2-S01",
    "to": "E2-C025",
    "kind": "corridor-stair",
    "weight": 110.2
  },
  {
    "from": "E2-S02",
    "to": "E2-C010",
    "kind": "corridor-stair",
    "weight": 117.8
  },
  {
    "from": "E3-C001",
    "to": "E3-C013",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C002",
    "to": "E3-C014",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C003",
    "to": "E3-C015",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C004",
    "to": "E3-C016",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C005",
    "to": "E3-C018",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C006",
    "to": "E3-C019",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C007",
    "to": "E3-C020",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C008",
    "to": "E3-C021",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C009",
    "to": "E3-C010",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C010",
    "to": "E3-C011",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C011",
    "to": "E3-C012",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C012",
    "to": "E3-C013",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C013",
    "to": "E3-C014",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C014",
    "to": "E3-C015",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C015",
    "to": "E3-C016",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C016",
    "to": "E3-C017",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C017",
    "to": "E3-C018",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C018",
    "to": "E3-C019",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C019",
    "to": "E3-C020",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C020",
    "to": "E3-C021",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C021",
    "to": "E3-C022",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C022",
    "to": "E3-C023",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C023",
    "to": "E3-C024",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-C024",
    "to": "E3-C025",
    "kind": "corridor",
    "weight": 52
  },
  {
    "from": "E3-R-K303",
    "to": "E3-C017",
    "kind": "door",
    "weight": 135
  },
  {
    "from": "E3-R-K301",
    "to": "E3-C022",
    "kind": "door",
    "weight": 131.2
  },
  {
    "from": "E3-R-K302",
    "to": "E3-C019",
    "kind": "door",
    "weight": 128.4
  },
  {
    "from": "E3-R-K304",
    "to": "E3-C015",
    "kind": "door",
    "weight": 129.4
  },
  {
    "from": "E3-R-K305",
    "to": "E3-C011",
    "kind": "door",
    "weight": 132
  },
  {
    "from": "E3-R-K308",
    "to": "E3-C001",
    "kind": "door",
    "weight": 99.3
  },
  {
    "from": "E3-R-K307",
    "to": "E3-C008",
    "kind": "door",
    "weight": 99.7
  },
  {
    "from": "E3-S01",
    "to": "E3-C009",
    "kind": "corridor-stair",
    "weight": 99.5
  },
  {
    "from": "E3-S02",
    "to": "E3-C024",
    "kind": "corridor-stair",
    "weight": 105.2
  },
  {
    "from": "P-C012",
    "to": "P-C026",
    "kind": "corridor-bridge",
    "weight": 157.5
  },
  {
    "from": "P-C039",
    "to": "P-C061",
    "kind": "corridor-bridge",
    "weight": 46.2
  },
  {
    "from": "P-C060",
    "to": "P-C078",
    "kind": "corridor-bridge",
    "weight": 176.2
  },
  {
    "from": "B-C036",
    "to": "B-C038",
    "kind": "corridor-bridge",
    "weight": 43.8
  },
  {
    "from": "B-C050",
    "to": "B-C052",
    "kind": "corridor-bridge",
    "weight": 31.4
  },
  {
    "from": "B-S07",
    "to": "P-S10",
    "kind": "vertical-stair",
    "weight": 50
  },
  {
    "from": "P-S10",
    "to": "E1-S04",
    "kind": "vertical-stair",
    "weight": 50
  },
  {
    "from": "E1-S04",
    "to": "E2-S02",
    "kind": "vertical-stair",
    "weight": 50
  },
  {
    "from": "E2-S02",
    "to": "E3-S01",
    "kind": "vertical-stair",
    "weight": 50
  },
  {
    "from": "P-S11",
    "to": "E1-S05",
    "kind": "vertical-stair",
    "weight": 50
  },
  {
    "from": "E1-S05",
    "to": "E2-S01",
    "kind": "vertical-stair",
    "weight": 50
  },
  {
    "from": "E2-S01",
    "to": "E3-S02",
    "kind": "vertical-stair",
    "weight": 50
  },
  {
    "from": "B-S05",
    "to": "P-S05",
    "kind": "vertical-stair",
    "weight": 50
  },
  {
    "from": "P-S05",
    "to": "E1-S02",
    "kind": "vertical-stair",
    "weight": 50
  },
  {
    "from": "B-S03",
    "to": "P-S07",
    "kind": "vertical-stair",
    "weight": 50
  },
  {
    "from": "P-S07",
    "to": "E1-S01",
    "kind": "vertical-stair",
    "weight": 50
  },

  {
    "from": "B-S10",
    "to": "P-S16",
    "kind": "vertical-stair",
    "weight": 50
  }
];

// Adjacency graph built at initialization
const adjacencyList = {};

function initGraph() {
  for (const nId of Object.keys(NAV_NODES)) {
    adjacencyList[nId] = [];
  }
  for (const edge of NAV_EDGES) {
    if (!adjacencyList[edge.from]) adjacencyList[edge.from] = [];
    if (!adjacencyList[edge.to]) adjacencyList[edge.to] = [];
    adjacencyList[edge.from].push({ to: edge.to, kind: edge.kind, weight: edge.weight });
    adjacencyList[edge.to].push({ to: edge.from, kind: edge.kind, weight: edge.weight });
  }
}

initGraph();

// Resolve a room identifier (id, code, or node id) to a nav node id
export function resolveToNodeId(roomOrCode) {
  if (!roomOrCode) return 'P-C026'; // Default: Intrare Principală Parter
  if (typeof roomOrCode === 'object') {
    if (roomOrCode.code) return resolveToNodeId(roomOrCode.code);
    if (roomOrCode.id) return resolveToNodeId(roomOrCode.id);
  }

  const str = String(roomOrCode).trim();
  const upper = str.toUpperCase().replace('ROOM-', '');

  // Aula Constantin Belea -> rutează direct la Punctul Informativ (Intrare Aula B-S08)
  if (
    upper.includes('BELEA') ||
    upper.includes('AULA') ||
    upper.includes('B-AMFITEATRU') ||
    upper === 'STAIR-B-08' ||
    upper === 'B-S08'
  ) {
    return 'B-S08';
  }

  if (NAV_NODES[str]) return str;
  for (const [id, node] of Object.entries(NAV_NODES)) {
    if (node.roomCode && node.roomCode.toUpperCase() === upper) {
      return id;
    }
  }

  // Fallback: search node ID ending with the code
  for (const id of Object.keys(NAV_NODES)) {
    if (id.endsWith('-' + upper) || id.endsWith(upper)) {
      return id;
    }
  }

  return 'P-C026';
}

/**
 * A* Pathfinding algorithm across single or multiple floors.
 */
export function findPath(fromRoom, toRoom) {
  const startId = resolveToNodeId(fromRoom);
  const goalId = resolveToNodeId(toRoom);

  if (!NAV_NODES[startId] || !NAV_NODES[goalId]) return null;
  if (startId === goalId) {
    return {
      nodes: [NAV_NODES[startId]],
      floors: [NAV_NODES[startId].floor],
      totalDistanceMeters: 0,
      instructions: ['Te afli deja la destinație.'],
    };
  }

  const openSet = new Set([startId]);
  const cameFrom = {};
  const gScore = { [startId]: 0 };
  const goalNode = NAV_NODES[goalId];

  const fScore = {
    [startId]: Math.hypot(NAV_NODES[startId].x - goalNode.x, NAV_NODES[startId].y - goalNode.y),
  };

  while (openSet.size > 0) {
    let current = null;
    let lowestF = Infinity;
    for (const id of openSet) {
      if (fScore[id] < lowestF) {
        lowestF = fScore[id];
        current = id;
      }
    }

    if (current === goalId) {
      const pathIds = [current];
      while (cameFrom[pathIds[0]]) {
        pathIds.unshift(cameFrom[pathIds[0]]);
      }

      const pathNodes = pathIds.map((id) => NAV_NODES[id]);
      const floorsVisited = [...new Set(pathNodes.map((n) => n.floor))];

      // Convert units to approx meters (20 units = 1 meter from metadata)
      const totalUnits = gScore[goalId] || 0;
      const totalDistanceMeters = Math.round((totalUnits / 20) * 10) / 10;

      return {
        nodes: pathNodes,
        floors: floorsVisited,
        totalDistanceMeters,
        isMultiFloor: floorsVisited.length > 1,
      };
    }

    openSet.delete(current);
    const neighbors = adjacencyList[current] || [];

    for (const edge of neighbors) {
      const tentativeG = gScore[current] + edge.weight;
      if (tentativeG < (gScore[edge.to] ?? Infinity)) {
        cameFrom[edge.to] = current;
        gScore[edge.to] = tentativeG;
        const targetNode = NAV_NODES[edge.to];
        const floorDiff = targetNode.floor !== goalNode.floor ? 80 : 0;
        const h = Math.hypot(targetNode.x - goalNode.x, targetNode.y - goalNode.y) + floorDiff;
        fScore[edge.to] = tentativeG + h;
        openSet.add(edge.to);
      }
    }
  }

  return null;
}

export default {
  NAV_NODES,
  NAV_EDGES,
  resolveToNodeId,
  findPath,
};
