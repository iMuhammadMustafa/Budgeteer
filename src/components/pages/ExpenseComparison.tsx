import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { ArrowUp, ArrowDown } from 'lucide-react-native'

type Props = {
    data: {
      date: string
      transactions: {
        category: string
        group: string
        amount: number
      }[]
    }[]
  }
  
  export default function ExpenseComparison({ data }: Props) {
    const groupedData = transformData(data)
    const dates = [...new Set(data.map(d => d.date))].sort()
  
    const renderAmount = (current: number, previous?: number) => {
      const hasChanged = previous !== undefined
      const hasIncreased = hasChanged && current > previous
      const hasDecreased = hasChanged && current < previous
  
      return (
        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              hasIncreased && styles.increased,
              hasDecreased && styles.decreased,
            ]}
          >
            ${current.toFixed(2)}
          </Text>
          {hasIncreased && <ArrowUp size={16} color="#ef4444" />}
          {hasDecreased && <ArrowDown size={16} color="#22c55e" />}
        </View>
      )
    }
  
    return (
      <ScrollView horizontal>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.row}>
            <Text style={[styles.cell, styles.headerCell]}>Category</Text>
            {dates.map(date => (
              <Text key={date} style={[styles.cell, styles.headerCell]}>
                {date}
              </Text>
            ))}
          </View>
  
          {/* Data Rows */}
          {Object.entries(groupedData).map(([group, categories]) => (
            <View key={group}>
              {/* Group Header */}
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group}</Text>
              </View>
  
              {/* Categories */}
              {Object.entries(categories).map(([category, dateAmounts], index) => (
                <View
                  key={`${group}-${category}`}
                  style={[styles.row, index % 2 === 0 && styles.alternateRow]}
                >
                  <Text style={[styles.cell, styles.categoryCell]}>{category}</Text>
                  {dates.map((date, dateIndex) => (
                    <View key={date} style={styles.cell}>
                      {renderAmount(
                        dateAmounts[date] || 0,
                        dateIndex > 0 ? dateAmounts[dates[dateIndex - 1]] : undefined
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    )
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#1a1a1a',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#333',
    },
    alternateRow: {
      backgroundColor: '#222',
    },
    cell: {
      width: 120,
      paddingHorizontal: 8,
    },
    headerCell: {
      color: '#fff',
      fontWeight: 'bold',
    },
    categoryCell: {
      color: '#fff',
    },
    groupHeader: {
      padding: 12,
      backgroundColor: '#333',
    },
    groupTitle: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    amount: {
      color: '#fff',
      fontVariant: ['tabular-nums'],
    },
    increased: {
      color: '#ef4444',
    },
    decreased: {
      color: '#22c55e',
    },
  })

  type Transaction = {
    category: string
    group: string
    amount: number
  }
  
  type DayTransactions = {
    date: string
    transactions: Transaction[]
  }
  
  type GroupedExpenses = {
    [group: string]: {
      [category: string]: {
        [date: string]: number
      }
    }
  }
  
  export function transformData(data: DayTransactions[]): GroupedExpenses {
    const grouped: GroupedExpenses = {}
  
    data.forEach((day) => {
      day.transactions.forEach((transaction) => {
        if (!grouped[transaction.group]) {
          grouped[transaction.group] = {}
        }
        if (!grouped[transaction.group][transaction.category]) {
          grouped[transaction.group][transaction.category] = {}
        }
        grouped[transaction.group][transaction.category][day.date] = transaction.amount
      })
    })
  
    return grouped
  }