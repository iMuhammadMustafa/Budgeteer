import ExpenseComparison from "@/src/components/pages/ExpenseComparison";
import { View, Text, SafeAreaView, StatusBar, StyleSheet  } from "react-native";
const sampleData = [
  {
    date: '1/1/2001',
    transactions: [
      {
        category: 'Fuel',
        group: 'Car',
        amount: 50,
      },
      {
        category: 'Fuel',
        group: 'Cat',
        amount: 0,
      },      
    ],
  },
  {
    date: '1/2/2001',
    transactions: [
      {
        category: 'Fuel',
        group: 'Car',
        amount: 60,
      },
    ],
  },
  {
    date: '1/3/2001',
    transactions: [
      {
        category: 'Fuel',
        group: 'Car',
        amount: 60,
      },
      {
        category: 'Insurance',
        group: 'Car',
        amount: 60,
      },      
    ],
  },
]

export default function Summary() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ExpenseComparison data={sampleData} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
})