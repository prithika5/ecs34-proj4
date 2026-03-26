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

export const transportationModes = [
  {
    id: "any",
    label: "Any mode"
  },
  {
    id: "walk",
    label: "Walk only"
  },
  {
    id: "bike",
    label: "Bike only"
  },
  {
    id: "shuttle",
    label: "Shuttle only"
  }
];

export const locationOptions = [
  { id: "aggie_works", label: "AggieWorks Studio", status: "active", icon: "cow_lab", area: "Downtown Davis" },
  { id: "memorial_union", label: "Memorial Union", status: "active", icon: "union", area: "Central campus" },
  { id: "shields_library", label: "Shields Library", status: "active", icon: "library", area: "Academic core" },
  { id: "silo_terminal", label: "Silo Transit Terminal", status: "active", icon: "silo", area: "Transit hub" },
  { id: "arc", label: "Activities and Recreation Center", status: "active", icon: "arc", area: "Fitness district" },
  { id: "mondavi_center", label: "Mondavi Center", status: "active", icon: "mondavi", area: "Arts district" },
  { id: "west_village", label: "West Village", status: "active", icon: "west_village", area: "West Davis edge" },
  { id: "research_park", label: "Research Park Annex", status: "offline", icon: "research", area: "Innovation park" }
];

export const routeApiContract = {
  requiredFields: ["start", "end", "optimization"],
  optionalFields: ["modePreference"]
};

export function getLocationOptionById(id) {
  return locationOptions.find((location) => location.id === id);
}
