import { ScrollView, Text, View } from 'react-native';

// Mock data structured like your image
const tableData = [
  {
    type: 'section',
    title: 'Groceries',
    data: { aug: '$452', sep: '$375', oct: '$646', nov: '$264' },
  },
  {
    type: 'item',
    name: 'Groceries',
    data: { aug: '$452', sep: '$375', oct: '$646', nov: '$264' },
  },
  {
    type: 'section',
    title: 'Entertainment',
    data: { aug: '$312', sep: '$169', oct: '$389', nov: '$148' },
  },
  {
    type: 'item',
    name: 'Going Out',
    data: { aug: '$115', sep: '$0', oct: '$59', nov: '$28' },
  },
  {
    type: 'item',
    name: 'Games',
    data: { aug: '$32', sep: '$32', oct: '$32', nov: '$0' },
  },
  {
    type: 'item',
    name: 'Hobbies',
    data: { aug: '$48', sep: '$0', oct: '$412', nov: '$0' },
  },
  // ... Add the rest of your data (Household, Bills, etc.)
];

// Define fixed widths for your columns as reusable classes
// You can adjust these widths in one place
const STICKY_COL_CLASS = "w-36"; // 144px
const DATA_COL_CLASS = "w-28 text-right"; // 112px

// Reusable cell classes
const HEADER_CELL_CLASS = "p-3 font-bold bg-gray-100 border-b border-gray-300";
const SECTION_CELL_CLASS = "p-3 font-bold bg-blue-50 border-b border-gray-200";
const ITEM_CELL_CLASS = "p-3 border-b border-gray-200 bg-white";

export default function StickyTable() {
  return (
    // 1. This is the main vertical scroll for the *entire* table
    <ScrollView className="flex-1 pt-8">
      
      {/* This View holds the two columns for the *entire* table (headers + body) */}
      <View className="flex-row">

        {/* --- COLUMN 1: STICKY LABELS (Header + Body) --- */}
        {/* This View has a fixed width and contains all category/item labels */}
        <View className={`${STICKY_COL_CLASS} border-r border-gray-300`}>
          {/* Sticky Header Cell */}
          <Text className={HEADER_CELL_CLASS}>Category</Text>

          {/* Sticky Body Cells */}
          {tableData.map((row, index) => (
            <Text
              key={index}
              className={
                row.type === 'section' 
                ? SECTION_CELL_CLASS 
                : `${ITEM_CELL_CLASS} pl-5` // Indent items
              }
            >
              {row.type === 'section' ? row.title : row.name}
            </Text>
          ))}
        </View>

        {/* --- COLUMN 2: SCROLLABLE DATA (Header + Body) --- */}
        {/* This ScrollView handles *horizontal* scrolling for the data */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Scrollable Header Row */}
            <View className="flex-row">
              <Text className={`${HEADER_CELL_CLASS} ${DATA_COL_CLASS}`}>Aug 2025</Text>
              <Text className={`${HEADER_CELL_CLASS} ${DATA_COL_CLASS}`}>Sep 2025</Text>
              <Text className={`${HEADER_CELL_CLASS} ${DATA_COL_CLASS}`}>Oct 2025</Text>
              <Text className={`${HEADER_CELL_CLASS} ${DATA_COL_CLASS}`}>Nov 2025</Text>
            </View>

            {/* Scrollable Body Rows */}
            {tableData.map((row, index) => (
              <View key={index} className="flex-row">
                <Text className={`${
                  row.type === 'section' ? SECTION_CELL_CLASS : ITEM_CELL_CLASS
                } ${DATA_COL_CLASS}`}>
                  {row.data.aug}
                </Text>
                <Text className={`${
                  row.type === 'section' ? SECTION_CELL_CLASS : ITEM_CELL_CLASS
                } ${DATA_COL_CLASS}`}>
                  {row.data.sep}
                </Text>
                <Text className={`${
                  row.type === 'section' ? SECTION_CELL_CLASS : ITEM_CELL_CLASS
                } ${DATA_COL_CLASS}`}>
                  {row.data.oct}
                </Text>
                <Text className={`${
                  row.type === 'section' ? SECTION_CELL_CLASS : ITEM_CELL_CLASS
                } ${DATA_COL_CLASS}`}>
                  {row.data.nov}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
}