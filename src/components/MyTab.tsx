import { useMemo, useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "../providers/QueryProvider";
import { IService } from "../services/IService";
import { TableNames } from "../types/database/TableNames";
import Button from "./elements/Button";
import MyIcon from "./elements/MyIcon";
import MyModal from "./elements/MyModal";
import SkeletonList from "./elements/SkeletonList";

export default function MyTab<TModel, TTable extends TableNames>({
  title,
  service,
  queryKey,
  groupBy,
  Footer,
  detailsContent,
  customAction,
  UpsertModal,
  initialState,
  detailsUrl,
  icons = true,
  customRenderItem,
}: {
  title: string;
  service: IService<TModel, TTable>;
  queryKey: string[];
  groupBy?: string;
  Footer?: React.ReactNode | string;
  detailsContent?: (item: any) => string;
  customAction?: React.ReactNode | ((item: any) => React.ReactNode);
  UpsertModal?: (item: any) => React.ReactNode;
  initialState?: any;
  detailsUrl: Href;
  icons?: boolean;
  customRenderItem?: (
    item: TModel,
    isSelected: boolean,
    onLongPress: () => void,
    onPress: () => void,
  ) => React.ReactNode;
}) {
  const {
    selectedItems,
    groupedData,
    isLoading,
    isSelectionMode,
    handleLongPress,
    handlePress,
    handleDelete,
    handleRefresh,
    isOpen,
    setIsOpen,
    currentItem,
    setCurrentItem,
  } = useMyTab({
    service,
    queryKey,
    groupBy,
    detailsUrl: detailsUrl,
    initialState,
  });
  if (isLoading) return <SkeletonList length={20} />;
  return (
    <SafeAreaView className={`flex-1 bg-background  ${Platform.OS === "web" ? "max-w" : ""}`}>
      <View className="flex-row justify-between items-center px-4 bg-background">
        <Text className="font-bold text-lg text-foreground">{title}</Text>
        <View className="flex-row items-center">
          <Button variant="ghost" className="py-0 px-2" iconSize={20} onPress={handleRefresh} rightIcon="RefreshCw" />
          {UpsertModal && (
            <Button
              variant="ghost"
              className="py-0 px-0"
              iconSize={24}
              onPress={() => {
                setIsOpen(true);
                setCurrentItem(initialState);
              }}
              rightIcon="Plus"
            />
          )}
          {UpsertModal && isOpen && (
            //title={`Add New ${title.slice(0, -1)}`}
            <MyModal isOpen={isOpen} setIsOpen={setIsOpen} onClose={() => setIsOpen(false)}>
              {UpsertModal(currentItem)}
            </MyModal>
          )}
        </View>
      </View>

      <ScrollView className="custom-scrollbar mt-2">
        {groupedData &&
          Object.entries(groupedData).map(([groupName, itemsInGroup]) => (
            <View key={groupName}>
              {!groupName ? null : (
                <Text className="font-bold text-lg py-0 px-4 bg-card text-foreground">{groupName}</Text>
              )}
              {itemsInGroup.map((item: any) => {
                const isSelected = selectedItems.some(selectedItem => item.id === selectedItem.id);
                return (
                  <View
                    key={item.id}
                    className={`flex-row items-center ${groupName ? "py-1" : "py-2"} border-b border-gray-200 px-5 rounded-none text-foreground ${isSelected ? "bg-primary" : "bg-background"}`}
                  >
                    {/* TODO fix Link usage*/}
                    {/* <Link href={`${detailsUrl}${item.id}` as Href} asChild onPress={e => e.preventDefault()}> */}
                    <Button
                      variant="ghost"
                      onLongPress={() => handleLongPress(item)}
                      onPress={() => handlePress(item)}
                      // rightIcon="ChevronRight"
                      className={`flex-1 flex-row items-center py-0 px-0 rounded-none text-foreground`}
                    >
                      {customRenderItem ? (
                        customRenderItem(
                          item,
                          isSelected,
                          () => handleLongPress(item),
                          () => handlePress(item),
                        )
                      ) : (
                        <View className="flex flex-row flex-1 width-full">
                          {icons && (
                            <View
                              className={`w-8 h-8 rounded-full justify-center items-center mr-4 bg-${item.color ? item.color : "gray-300"}`}
                            >
                              {item.icon && (
                                <MyIcon
                                  name={item.icon}
                                  size={18}
                                  className={`color-card-foreground bg-${item.iconColor}`}
                                />
                              )}
                            </View>
                          )}
                          <View className="flex-1">
                            <Text className="text-md text-foreground">{item.name}</Text>
                            <Text className="text-md text-foreground">
                              {detailsContent ? detailsContent(item) : item.details}
                            </Text>
                          </View>
                        </View>
                      )}
                    </Button>
                    {/* </Link> */}
                    {UpsertModal && (
                      <Button
                        variant="ghost"
                        className="py-0 px-0"
                        iconSize={20}
                        onPress={() => {
                          setIsOpen(true);
                          setCurrentItem(item);
                        }}
                        rightIcon="SquarePen"
                      />
                    )}
                    {customAction && (
                      <View className="ml-2">
                        {typeof customAction === "function" ? customAction(item) : customAction}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
      </ScrollView>

      {Footer && <View className="p-2">{typeof Footer === "string" ? <Text>{Footer}</Text> : Footer}</View>}
      {isSelectionMode && (
        <Button
          className="absolute right-4 bottom-4 w-14 h-14 rounded-full justify-center items-center"
          variant="destructive"
          onPress={handleDelete}
          rightIcon="Trash"
          iconSize={24}
        />
      )}
    </SafeAreaView>
  );
}

const useMyTab = <TModel, TTable extends TableNames>({
  queryKey,
  service,
  groupBy,
  detailsUrl,
  initialState,
}: {
  queryKey: string[];
  service: IService<TModel, TTable>;
  groupBy?: string;
  detailsUrl: Href;
  initialState?: any;
}) => {
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const isSelectionMode = selectedItems.length > 0;

  const { data, isLoading, error } = service.useFindAll();
  const { mutate } = service.useSoftDelete();

  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(initialState);

  let groupedData: Record<string, TModel[]> = useMemo(() => {
    if (!groupBy) return { "": data || [] };

    const getNestedValue = (obj: any, path: string) => {
      if (!path) return undefined;
      return path.split(".").reduce((acc, part) => acc && acc[part], obj);
    };

    if (!data) return {};

    return data.reduce(
      (acc, item) => {
        const groupValue = getNestedValue(item, groupBy) || "Uncategorized";
        (acc[groupValue] = acc[groupValue] || []).push(item);
        return acc;
      },
      {} as Record<string, TModel[]>,
    );
  }, [data, groupBy]);

  const handleLongPress = (item: any) => {
    setSelectedItems(prev => [...prev, item]);
  };
  const handlePress = (item: any) => {
    if (isSelectionMode && selectedItems) {
      setSelectedItems(prev =>
        prev.some(i => i.id === item.id) ? prev.filter(i => i.id !== item.id) : [...prev, item],
      );
    } else {
      let route: Href = detailsUrl + item.id;
      // router.push(route);
      setIsOpen(true);
      setCurrentItem(item);
    }
  };

  const handleDelete = () => {
    if (isSelectionMode && selectedItems.length > 0) {
      for (const item of selectedItems) {
        mutate({ id: item.id, item });
      }
      setSelectedItems([]);
    }
  };
  const queryClient = useQueryClient();
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKey });
  };

  return {
    selectedItems,
    isSelectionMode,
    groupedData,
    isLoading,
    error,
    handleLongPress,
    handlePress,
    handleDelete,
    handleRefresh,
    isOpen,
    setIsOpen,
    currentItem,
    setCurrentItem,
  };
};
