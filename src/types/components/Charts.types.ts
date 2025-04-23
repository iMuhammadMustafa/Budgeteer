export type BarProps = {
  data: BarDataType[];
  label: string;
  color?: any;
  hideY?: boolean;
};

export type BarDataType = {
  x: string;
  y: Number;
  color?: string;
  item?: any;
};

export type DoubleBarPoint = {
  x: string;
  barOne: {
    label: string;
    value: number;
    color: string;
  };
  barTwo: {
    label: string;
    value: number;
    color: string;
  };
};

export type PieData = {
  id: string;
  x: string;
  y: number;
};

export type PieProps = {
  data: PieData[];
  label: string;
  maxItemsOnChart?: number;
  onPiePress?: (item: PieData) => void;
  highlightedSlice?: string;
};

export type CalendarDayProp = {
  selected?: boolean;
  marked?: boolean;
  selectedColor?: string;
  activeOpacity?: number;
  disabled?: boolean;
  disableTouchEvent?: boolean;
  dots?: {
    key: string;
    color: string;
  }[];
};

export type MyCalendarProps = {
  data: MyCalendarData;
  label: string;
  onDayPress?: (day: any) => void;
  selectedDate?: string | null;
};

export type MyCalendarData = {
  [day: string]: CalendarDayProp;
};
