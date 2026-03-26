export const optimizationModes = [
  {
    id: "shortest",
    label: "Shortest",
    description: "Minimize total distance traveled."
  },
  {
    id: "fastest",
    label: "Fastest",
    description: "Minimize total travel time."
  }
];

export const locationOptions = [
  { id: "aggie_works", label: "AggieWorks Studio", status: "active" },
  { id: "memorial_union", label: "Memorial Union", status: "active" },
  { id: "shields_library", label: "Shields Library", status: "active" },
  { id: "silo_terminal", label: "Silo Transit Terminal", status: "active" },
  { id: "arc", label: "Activities and Recreation Center", status: "active" },
  { id: "mondavi_center", label: "Mondavi Center", status: "active" },
  { id: "west_village", label: "West Village", status: "active" },
  { id: "research_park", label: "Research Park Annex", status: "offline" }
];

export const routeApiContract = {
  requiredFields: ["start", "end", "optimization"]
};
