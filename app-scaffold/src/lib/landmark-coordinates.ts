interface Landmark {
  searchTerms: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export const LANDMARK_COORDINATES: Landmark[] = [
  {
    searchTerms: ["Asoke", "Asok", "Sukhumvit 21"],
    coordinates: {
      latitude: 13.7374652,
      longitude: 100.5642891
    }
  },
  {
    searchTerms: ["Ploenchit", "Phloen Chit", "One City Centre"],
    coordinates: {
      latitude: 13.7431103,
      longitude: 100.5458669
    }
  },
  {
    searchTerms: ["Tha Maharaj", "Maharaj Pier"],
    coordinates: {
      latitude: 13.7564332,
      longitude: 100.4895642
    }
  },
  {
    searchTerms: ["Nimman", "Nimmanhaemin", "Nimmanahaeminda"],
    coordinates: {
      latitude: 18.8018871,
      longitude: 98.9674937
    }
  },
  {
    searchTerms: ["Pa Klok", "Paklok", "Thalang"],
    coordinates: {
      latitude: 8.0607592,
      longitude: 98.4134252
    }
  },
  {
    searchTerms: ["Klong Khong", "Klong Khong Beach", "Koh Lanta"],
    coordinates: {
      latitude: 7.5700414,
      longitude: 99.0333601
    }
  }
];
