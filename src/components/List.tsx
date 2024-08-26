import { Box } from "@/components/ui/box";
import { Href, Link } from "expo-router";
import Icon from "../lib/IonIcons";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableData } from "@/components/ui/table";
import { ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import React from "react";

export interface ListProps<T> {
  data: T[];
  columns: string[];
  properties?: string[];
  renderItem?: (item: T) => React.ReactNode;
  createLinks: Href<string>[];
  actions?: ActionProps<T>;
}
interface ActionProps<T> {
  editLink: Href<string>;
  onDelete: (item: T) => void;
  isLoading?: boolean;
}

const getPropertyValue = (item: any, path: string) => {
  return path.split(".").reduce((acu, cur) => {
    cur = cur.endsWith("at") || cur.includes("date") ? new Date(acu[cur]).toLocaleDateString("en-GB") : acu[cur];
    return cur;
  }, item);
};

export default function List<T>({ data, columns, properties, renderItem, createLinks, actions }: ListProps<T>) {
  if (!data) return <ActivityIndicator />;

  return (
    <Box className="my-4 mx-5 flex">
      <Box className="self-end my-2 flex-row">
        {createLinks &&
          createLinks.map((createLink, index) => (
            <Link href={createLink} key={createLink.toString() + index}>
              <Icon name="Plus" className="text-foreground" />
            </Link>
          ))}
      </Box>
      <Box className="border border-solid border-outline-200 rounded-lg overflow-auto">
        <ScrollView horizontal contentContainerClassName="w-full">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-outline-200">
                {columns.map((coloumn, index) => (
                  <TableHead key={coloumn + index}>{coloumn}</TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data &&
                data.length > 0 &&
                data.map((item: any) => {
                  return renderItem ? (
                    renderItem(item)
                  ) : (
                    <TableRow key={item.id} className="text-center">
                      {properties &&
                        properties.length > 0 &&
                        properties.map((property, index) => {
                          return property.includes("icon") ? (
                            <TableData key={index} className="flex justify-center items-center">
                              <Icon name={getPropertyValue(item, property)} size={20} />
                            </TableData>
                          ) : (
                            <TableData key={index}>{getPropertyValue(item, property)}</TableData>
                          );
                        })}
                      {actions && (
                        <TableData className="flex justify-center items-center gap-2">
                          <Link href={actions.editLink + item.id}>
                            <Icon name="Pencil" size={20} className="text-primary-300" />
                          </Link>
                          {actions.isLoading ? (
                            <Icon name="Loader" size={20} className="text-primary-300" />
                          ) : (
                            <TouchableOpacity onPress={() => actions.onDelete(item)}>
                              <Icon name="Trash2" size={20} className="text-red-600" />
                            </TouchableOpacity>
                          )}
                        </TableData>
                      )}
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </ScrollView>
      </Box>
    </Box>
  );
}
