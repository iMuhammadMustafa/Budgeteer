import type { useMutation } from "@tanstack/react-query";
export {};

declare global {
  type DeleteMutation = ReturnType<typeof useMutation<void, unknown, { id: string; item?: any }>>;
  type BatchDeleteMutation = ReturnType<typeof useMutation<void, unknown, { items?: any[] }>>;
  type Href = Href;
}
