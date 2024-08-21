import { Box } from "@/components/ui/box";
import { Href, Link } from "expo-router";
import Icon from "../lib/IonIcons";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableData } from "@/components/ui/table";
import { ScrollView, TouchableOpacity } from "react-native";

export interface ListProps<T> {
  data: T[];
  columns: string[];
  createLink: Href<string>;
  renderItem: (item: T) => React.ReactNode;
}

export default function List<T>({ data, columns, createLink, renderItem }: ListProps<T>) {
  return (
    <Box className="my-4 mx-5 flex">
      <Box className="self-end my-2">
        <Link href={createLink}>
          <Icon name="Plus" className="text-foreground" />
        </Link>
      </Box>
      <Box className="border border-solid border-outline-200 rounded-lg overflow-scroll">
        <ScrollView horizontal contentContainerClassName="w-full">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-outline-200">
                {columns.map(coloumn => (
                  <TableHead>{coloumn}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data &&
                data.map((item: T) => {
                  return renderItem(item);
                })}
            </TableBody>
          </Table>
        </ScrollView>
      </Box>
    </Box>
  );
}
