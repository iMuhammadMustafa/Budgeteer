import { View, Text, Button, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import Icon, { iconWithClassName } from "../lib/IonIcons";

interface ListProps<T> {
  data: T[];
  renderItem: (item: T) => JSX.Element;
  onDelete?: (id: string) => void;
}

function List<T>({ data, renderItem, onDelete }: ListProps<T>) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item: any) => item.Id}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          {renderItem(item)}
          {onDelete && (
            <TouchableOpacity className="bg-destructive" onPress={() => onDelete(item.Id)}>
              <Icon name="Trash" size={24} />
              <Text className="text-foreground">Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});

export default List;
