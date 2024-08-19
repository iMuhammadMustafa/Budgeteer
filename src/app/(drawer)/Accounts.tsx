import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { deleteAccount, fetchAllAccounts, useGetList } from "@/src/repositories/api";
import { Link, router } from "expo-router";
import { Account } from "@/src/lib/supabase";
import {
  Table,
  TableHeader,
  TableFooter,
  TableBody,
  TableHead,
  TableData,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Box } from "@/components/ui/box";
import Icon, { PlusIcon } from "@/src/lib/IonIcons";

export default function Accounts() {
  const { data, isLoading, error } = useGetList<Account>("accounts");

  const handleDelete = async (id: string) => {
    await deleteAccount(id);
  };

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <Box className="my-4 mx-5 flex">
      <Box className="self-end my-2">
        <Link href="/Accounts/Create/null">
          <Icon name="Plus" className="text-foreground" />
        </Link>
      </Box>
      <Box className="border border-solid border-outline-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Current Balance</TableHead>
              <TableHead>Open Balance</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data &&
              data.map((account: Account) => (
                <TableRow key={account.id} className="text-center">
                  <TableData>{account.name}</TableData>
                  <TableData>{account.category}</TableData>
                  <TableData>{account.type}</TableData>
                  <TableData>{account.currency}</TableData>
                  <TableData>{account.currentbalance}</TableData>
                  <TableData>{account.openbalance}</TableData>
                  <TableData>{account.notes}</TableData>
                  <TableData>{new Date(account.createdat).toLocaleDateString("en-GB")}</TableData>
                  <TableData className="flex justify-center items-center gap-2">
                    <Link href={`/Accounts/Create/${account.id}`}>
                      <Icon name="Pencil" size={20} className="text-primary-300"/>
                    </Link>
                    <TouchableOpacity onPress={() => deleteAccount(account.Id)}>
                      <Icon name="Trash2" size={20} className="text-red-600" />
                    </TouchableOpacity>
                  </TableData>
                </TableRow>
              ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableData />
            </TableRow>
          </TableFooter>
          <TableCaption />
        </Table>
      </Box>
    </Box>
  );
}
