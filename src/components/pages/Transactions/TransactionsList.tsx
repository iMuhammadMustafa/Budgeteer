import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { TransactionsView } from '@/src/types/db/Tables.Types';
import dayjs from 'dayjs';
import MyIcon from '@/src/utils/Icons.Helper';

type TransactionsListProps = {
  transactions: TransactionsView[];
  onPress: (transaction: TransactionsView) => void;
};

const TransactionsList = ({ transactions, onPress }: TransactionsListProps) => {
  const renderItem = ({ item }: { item: TransactionsView }) => {
    const isExpense = item.type === 'Expense' || (item.amount ?? 0) < 0;
    const amountColor = isExpense ? 'text-danger-500' : 'text-success-500';
    
    return (
      <Pressable 
        className="flex-row justify-between items-center p-4 border-b border-muted"
        onPress={() => onPress(item)}
      >
        <View className="flex-row items-center gap-3">
          {item.icon && (
            <View className="w-8 h-8 rounded-full bg-card/30 items-center justify-center">
              <MyIcon name={item.icon} className="text-foreground" size={18} />
            </View>
          )}
          
          <View>
            <Text className="text-foreground font-medium">{item.name || 'Unnamed'}</Text>
            <Text className="text-muted-foreground text-sm">
              {item.categoryname || 'No Category'} • {dayjs(item.date || new Date()).format('MMM D, YYYY')}
            </Text>
          </View>
        </View>
        
        <Text className={`tabular-nums font-medium ${amountColor}`}>
          {isExpense ? '-' : '+'}${Math.abs(item.amount ?? 0).toFixed(2)}
        </Text>
      </Pressable>
    );
  };

  return (
    <FlatList
      data={transactions}
      renderItem={renderItem}
      keyExtractor={(item) => item.id ?? `transaction-${Math.random()}`}
      className="bg-background"
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
};

export default TransactionsList; 