# SQLite Provider with Drizzle ORM

This provider enables the use of SQLite database with Drizzle ORM in your Expo React Native application.

## Features

- **Expo SQLite Integration**: Uses `expo-sqlite` for cross-platform SQLite support
- **Drizzle ORM**: Type-safe database operations with Drizzle ORM
- **Automatic Migrations**: Runs database migrations on initialization
- **React Context**: Provides database instance through React Context
- **Error Handling**: Comprehensive error handling and loading states
- **TypeScript Support**: Full TypeScript support with schema inference

## Setup

### 1. Database Schema

The schema is defined in `sqllite/schema.ts`:

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const lists = sqliteTable("lists", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  list_id: integer("list_id")
    .notNull()
    .references(() => lists.id),
});

export type Task = typeof tasks.$inferSelect;
```

### 2. Provider Setup

Wrap your app with the `SQLiteProvider` in your `_layout.tsx`:

```tsx
import { SQLiteProvider } from "@/src/providers/SqlLiteProvider";

export default function RootLayout() {
  return <SQLiteProvider databaseName="budgeteerdb">{/* Your other providers and components */}</SQLiteProvider>;
}
```

### 3. Using the Database

Use the `useSQLite` hook to access the database:

```tsx
import { useSQLite } from "@/src/providers/SqlLiteProvider";
import { tasks, lists } from "@/sqllite/schema";

function MyComponent() {
  const { db, isLoading, error, isReady } = useSQLite();

  const createTask = async () => {
    if (!db) return;

    await db.insert(tasks).values({
      name: "My Task",
      list_id: 1,
    });
  };

  const getTasks = async () => {
    if (!db) return [];

    return await db.select().from(tasks);
  };

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error}</Text>;
  if (!isReady) return <Text>Database not ready</Text>;

  // Use db for database operations
}
```

## Database Operations

### Insert Data

```tsx
await db.insert(tasks).values({
  name: "New Task",
  list_id: 1,
});
```

### Query Data

```tsx
// Get all tasks
const allTasks = await db.select().from(tasks);

// Get tasks with conditions
const completedTasks = await db.select().from(tasks).where(eq(tasks.completed, true));
```

### Update Data

```tsx
await db.update(tasks).set({ name: "Updated Task" }).where(eq(tasks.id, 1));
```

### Delete Data

```tsx
await db.delete(tasks).where(eq(tasks.id, 1));
```

### Joins

```tsx
const tasksWithLists = await db
  .select({
    taskId: tasks.id,
    taskName: tasks.name,
    listName: lists.name,
  })
  .from(tasks)
  .innerJoin(lists, eq(tasks.list_id, lists.id));
```

## Provider Props

| Prop           | Type        | Default         | Description                      |
| -------------- | ----------- | --------------- | -------------------------------- |
| `databaseName` | `string`    | `"budgeteerdb"` | Name of the SQLite database file |
| `children`     | `ReactNode` | -               | Child components                 |

## Context Values

| Property    | Type                         | Description                           |
| ----------- | ---------------------------- | ------------------------------------- |
| `db`        | `ExpoSQLiteDatabase \| null` | Drizzle database instance             |
| `isLoading` | `boolean`                    | Whether the database is initializing  |
| `error`     | `string \| null`             | Initialization error message          |
| `isReady`   | `boolean`                    | Whether the database is ready for use |

## Migrations

Migrations are automatically run when the provider initializes. They are located in:

- `drizzle/migrations.js` - Migration configuration
- `drizzle/*.sql` - SQL migration files

To generate new migrations:

```bash
bunx drizzle-kit generate
```

## Error Handling

The provider includes comprehensive error handling:

```tsx
const { db, error, isReady } = useSQLite();

if (error) {
  // Handle database initialization error
  console.error("Database error:", error);
}

// Always check if database is ready before operations
if (db && isReady) {
  // Safe to perform database operations
}
```

## Example Usage

See `src/components/examples/SQLiteExample.tsx` for a complete example demonstrating:

- Creating lists and tasks
- Querying data
- Updating and deleting records
- Error handling
- Loading states

## Best Practices

1. **Always check if database is ready** before performing operations
2. **Use transactions** for multiple related operations
3. **Handle errors appropriately** in your UI
4. **Use TypeScript** for type safety
5. **Keep schema changes in migrations** for database versioning

## Troubleshooting

### Database not initializing

- Check if `expo-sqlite` is properly installed
- Verify migration files are correctly formatted
- Check console for initialization errors

### Type errors

- Ensure schema is properly exported
- Update Drizzle ORM to latest version
- Check TypeScript configuration

### Performance issues

- Use indexes for frequently queried columns
- Avoid N+1 queries with proper joins
- Consider pagination for large datasets
