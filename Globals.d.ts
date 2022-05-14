import 'little-state-machine';
declare module 'little-state-machine' {
  interface GlobalState {
    data: {
      bagelSelections: array;
      bagelChips: object;
      bagelChipData: array;
      location: string;
      time: string;
      formattedDate: string;
      formattedLocation: string;
      totalCost: number;
      brunchBagData: {
        day: string;
        large: number;
        small: number;
        getLarge: array;
        getSmall: array;
      };
      brunchBag: {
        bags: array;
        deliveryDate: string;
        address: {
          addressOne: string;
          addressTwo: string;
          city: string;
          state: string;
          zip: string;
        };
      };
    };
  }
}
declare module '*.module.css';
declare module '*.module.scss';
