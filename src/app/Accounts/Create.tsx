// components/AccountForm.tsx
import Form from "@/src/components/Form";
import { Account } from "@/src/data/models/Models";
import { createAccount, updateAccount } from "@/src/repositories/api";
import React from "react";

interface AccountFormProps {
  isEditing?: boolean;
  onSuccess?: () => void;
}

const AccountForm: React.FC<AccountFormProps> = ({ isEditing, onSuccess }) => {
  const initialValues: Account = {
    Id: "",
    Name: "",
    Category: "",
    Type: "",
    OpenBalance: 0,
    CurrentBalance: 0,
    Currency: "",
    Notes: "",
    CreatedAt: "",
    UpdatedAt: "",
    CreatedBy: "",
    UpdatedBy: "",
    IsDeleted: false,
  };
  const handleSubmit = async (values: Account) => {
    try {
      if (isEditing) {
        await updateAccount(values.Id, values);
      } else {
        await createAccount(values);
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
    }
  };

  const fields = {
    Name: { label: "Name" },
    Category: { label: "Category" },
    Type: { label: "Type" },
    OpenBalance: { label: "Open Balance", type: "number" },
    CurrentBalance: { label: "Current Balance", type: "number" },
    Currency: { label: "Currency" },
    Notes: { label: "Notes" },
  };

  return <Form initialValues={initialValues} onSubmit={handleSubmit} fields={fields} />;
};

export default AccountForm;
