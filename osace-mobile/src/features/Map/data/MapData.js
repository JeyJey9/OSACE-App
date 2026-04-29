// În src/features/Map/data/MapData.js

export const mapData = {
  // ... datele existente (parter, etaj1) ...

  // ADĂUGĂM SECȚIUNEA NOUĂ:
  ghijk_parter: {
    "room_gd02": {
      title: "Sala GD 02",
      type: "Laborator",
      description: "Laborator din corpul G.",
      center: { x: 25, y: 348 }, // Coordonate aproximative pentru zoom
      icon: "cpu"
    },
    "room_gd03": {
      title: "Sala GD 03",
      type: "Laborator",
      description: "Laborator din corpul G.",
      center: { x: 68, y: 348 },
      icon: "cpu"
    },
    "room_id03": {
      title: "Sala ID 03",
      type: "Seminar",
      description: "Sală de laborator.",
      center: { x: 219, y: 348 },
      icon: "book"
    },
    "room_aula_belea": {
      title: "Aula Belea (Amfiteatru)",
      type: "Amfiteatru",
      description: "Aula Belea",
      center: { x: 320, y: 400 },
      icon: "layers"
    }
  }
};