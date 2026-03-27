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
  {
    id: "aggie_works",
    label: "AggieWorks Studio",
    status: "active",
    icon: "cow_lab",
    area: "Downtown Davis",
    coordinates: { latitude: 38.5445, longitude: -121.7407 }
  },
  {
    id: "memorial_union",
    label: "Memorial Union",
    status: "active",
    icon: "union",
    area: "Central campus",
    coordinates: { latitude: 38.5423, longitude: -121.7498 }
  },
  {
    id: "shields_library",
    label: "Shields Library",
    status: "active",
    icon: "library",
    area: "Academic core",
    coordinates: { latitude: 38.5399, longitude: -121.7519 }
  },
  {
    id: "silo_terminal",
    label: "Silo Transit Terminal",
    status: "active",
    icon: "silo",
    area: "Transit hub",
    coordinates: { latitude: 38.5382, longitude: -121.7597 }
  },
  {
    id: "arc",
    label: "Activities and Recreation Center",
    status: "active",
    icon: "arc",
    area: "Fitness district",
    coordinates: { latitude: 38.5451, longitude: -121.7592 }
  },
  {
    id: "mondavi_center",
    label: "Mondavi Center",
    status: "active",
    icon: "mondavi",
    area: "Arts district",
    coordinates: { latitude: 38.5414, longitude: -121.7601 }
  },
  {
    id: "west_village",
    label: "West Village",
    status: "active",
    icon: "west_village",
    area: "West Davis edge",
    coordinates: { latitude: 38.5442, longitude: -121.7718 }
  },
  {
    id: "research_park",
    label: "Research Park Annex",
    status: "offline",
    icon: "research",
    area: "Innovation park",
    coordinates: { latitude: 38.5535, longitude: -121.7853 }
  }
];

export const routeApiContract = {
  requiredFields: ["start", "end", "optimization"],
  optionalFields: ["modePreference"]
};

export function getLocationOptionById(id) {
  return locationOptions.find((location) => location.id === id);
}
