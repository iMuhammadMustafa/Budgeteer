import React from 'react'
import { View, Text, ScrollView } from 'react-native'
import { ArrowUp, ArrowDown } from 'lucide-react-native'
import MyIcon from "@/src/utils/Icons.Helper";

type Props = {
    data: {
      date: string
      transactions: {
        category: string
        group: string
        amount: number
        categoryIcon?: string
        groupIcon?: string
      }[]
    }[]
  }
  
  export default function ExpenseComparison({ data }: Props) {
    const groupedData = transformData(data)
    
    // Make sure dates are sorted with the most recent (current) date on the right
    const dates = [...new Set(data.map(d => d.date))];
    dates.sort((a, b) => {
      // Parse dates - if they include spaces (month names), use a different format
      const dateA = new Date(a.includes(' ') ? a : `${a}-01`);
      const dateB = new Date(b.includes(' ') ? b : `${b}-01`);
      return dateA.getTime() - dateB.getTime();
    });
  
    const renderAmount = (current: number, previous: number | undefined) => {
      const hasChanged = previous !== undefined
      const hasIncreased = hasChanged && current > previous
      const hasDecreased = hasChanged && current < previous
  
      return (
        <View className="flex-row items-center gap-1">
          <Text
            className={`tabular-nums ${hasIncreased ? 'text-danger-500' : hasDecreased ? 'text-success-500' : 'text-foreground'}`}
          >
            ${Math.abs(current).toFixed(2)}
          </Text>
          {hasIncreased && <ArrowUp size={16} color="#ef4444" />}
          {hasDecreased && <ArrowDown size={16} color="#22c55e" />}
        </View>
      )
    }

    // Calculate group totals for each date
    const groupTotals: Record<string, Record<string, number>> = {}
    
    Object.entries(groupedData).forEach(([group, categories]) => {
      groupTotals[group] = {}
      
      dates.forEach(date => {
        groupTotals[group][date] = Object.values(categories).reduce((sum, dateAmounts) => {
          return sum + (dateAmounts[date] || 0)
        }, 0)
      })
    })
    
    const cellWidth = dates.length > 1 ? 120 : 150;
  
    return (
      <View className="flex-1 w-full items-center justify-center">
        <ScrollView horizontal className="w-full items-center justify-center" showsHorizontalScrollIndicator={false}>
          <View className="bg-background">
            {/* Header */}
            <View className="flex-row items-center py-3 border-b border-muted">
              <Text className={`w-[${cellWidth}px] px-2 font-bold text-foreground`}>Category</Text>
              {dates.map(date => (
                <Text key={date} className={`w-[${cellWidth}px] px-2 font-bold text-foreground text-center`}>
                  {date}
                </Text>
              ))}
            </View>
  
            {/* Data Rows */}
            {Object.entries(groupedData).map(([group, categories], groupIndex) => {
              // Extract group icon from the first transaction in this group (if available)
              const groupInfo = data[0]?.transactions.find(t => t.group === group);
              const groupIcon = groupInfo?.groupIcon;
              
              return (
                <View key={group}>
                  {/* Group Header with totals */}
                  <View className="py-3 px-2 bg-muted">
                    <View className="flex-row items-center">
                      <View className={`w-[${cellWidth}px] px-2 flex-row items-center`}>
                        {groupIcon && <MyIcon name={groupIcon} className="text-foreground mr-2" size={20} />}
                        <Text className="font-bold text-foreground">{group}</Text>
                      </View>
                      {dates.map((date) => {
                        const amount = groupTotals[group][date];
                        return (
                          <View key={date} className={`w-[${cellWidth}px] px-2 items-center`}>
                            <Text className="font-bold text-foreground">${Math.abs(amount).toFixed(2)}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
  
                  {/* Categories */}
                  {Object.entries(categories).map(([category, dateAmounts], index) => {
                    // Extract category icon from the transaction (if available)
                    const categoryInfo = data[0]?.transactions.find(t => 
                      t.group === group && t.category === category
                    );
                    const categoryIcon = categoryInfo?.categoryIcon;
                    
                    return (
                      <View
                        key={`${group}-${category}`}
                        className={`flex-row items-center py-3 border-b border-muted ${index % 2 === 0 ? 'bg-card/20' : ''}`}
                      >
                        <View className={`w-[${cellWidth}px] px-2 flex-row items-center pl-6`}>
                          {categoryIcon && <MyIcon name={categoryIcon} className="text-foreground mr-2" size={20} />}
                          <Text className="text-foreground">{category}</Text>
                        </View>
                        {dates.map((date) => (
                          <View key={date} className={`w-[${cellWidth}px] px-2 items-center`}>
                            <Text className="text-foreground">${Math.abs(dateAmounts[date] || 0).toFixed(2)}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    )
  }

  type Transaction = {
    category: string
    group: string
    amount: number
    categoryIcon?: string
    groupIcon?: string
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