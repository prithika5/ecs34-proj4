export const graph = {
  nodes: {
    aggie_works: { id: "aggie_works", label: "AggieWorks Studio" },
    memorial_union: { id: "memorial_union", label: "Memorial Union" },
    shields_library: { id: "shields_library", label: "Shields Library" },
    silo_terminal: { id: "silo_terminal", label: "Silo Transit Terminal" },
    arc: { id: "arc", label: "Activities and Recreation Center" },
    mondavi_center: { id: "mondavi_center", label: "Mondavi Center" },
    west_village: { id: "west_village", label: "West Village" },
    research_park: { id: "research_park", label: "Research Park Annex" }
  },
  edges: [
    { from: "aggie_works", to: "memorial_union", distance: 0.6, time: 12, mode: "walk", label: "Pedestrian spine" },
    { from: "memorial_union", to: "shields_library", distance: 0.35, time: 6, mode: "walk", label: "Library promenade" },
    { from: "shields_library", to: "arc", distance: 0.85, time: 14, mode: "walk", label: "Howard Way" },
    { from: "aggie_works", to: "silo_terminal", distance: 1.2, time: 4, mode: "shuttle", label: "Campus shuttle express" },
    { from: "silo_terminal", to: "west_village", distance: 1.75, time: 6, mode: "shuttle", label: "West Village shuttle" },
    { from: "memorial_union", to: "silo_terminal", distance: 0.55, time: 3, mode: "bike", label: "Bike boulevard" },
    { from: "shields_library", to: "mondavi_center", distance: 0.7, time: 3, mode: "bike", label: "Arts district bike lane" },
    { from: "mondavi_center", to: "west_village", distance: 1.1, time: 5, mode: "bike", label: "Russell corridor" },
    { from: "arc", to: "west_village", distance: 1.3, time: 20, mode: "walk", label: "Wellness greenway" },
    { from: "arc", to: "silo_terminal", distance: 0.75, time: 4, mode: "bike", label: "Health sciences cycle track" },
    { from: "memorial_union", to: "mondavi_center", distance: 1.0, time: 18, mode: "walk", label: "Quad connector" }
  ]
};
