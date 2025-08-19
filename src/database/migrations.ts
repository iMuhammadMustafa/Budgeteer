import { schemaMigrations, createTable } from "@nozbe/watermelondb/Schema/migrations";

export default schemaMigrations({
  migrations: [
    // Migration from version 1 to 2 - add any new tables or columns here
    // {
    //   toVersion: 2,
    //   steps: [
    //     // If this was a real migration, you would add specific migration steps here
    //     // For example: createTable({ name: 'new_table', columns: [...] })
    //     // Since we're starting fresh, we can leave this empty
    //   ],
    // },
  ],
});
