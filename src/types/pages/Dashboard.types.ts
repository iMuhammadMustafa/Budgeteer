export type ChartsObject = {
  [month: string]: {
    Expense: number;
    Income: number;
    categories: {
      [name: string]: {
        [type: string]: number;
      };
    };
    groups: GroupType;
  };
};
export type GroupType = {
  [group: string]: {
    [group: string]: number;
  };
};
