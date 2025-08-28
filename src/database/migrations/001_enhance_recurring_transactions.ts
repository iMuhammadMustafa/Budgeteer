import { addColumns, schemaMigrations } from "@nozbe/watermelondb/Schema/migrations";

export default schemaMigrations({
  migrations: [
    // Migration from version 1 to version 2 - Enhanced Recurring Transactions
    {
      toVersion: 2,
      steps: [
        // Add new columns to recurrings table
        addColumns({
          table: "recurrings",
          columns: [
            { name: "intervalmonths", type: "number", isOptional: false },
            { name: "autoapplyenabled", type: "boolean", isOptional: false },
            { name: "transferaccountid", type: "string", isOptional: true, isIndexed: true },
            { name: "isamountflexible", type: "boolean", isOptional: false },
            { name: "isdateflexible", type: "boolean", isOptional: false },
            { name: "recurringtype", type: "string", isOptional: false },
            { name: "lastautoappliedat", type: "string", isOptional: true },
            { name: "failedattempts", type: "number", isOptional: false },
            { name: "maxfailedattempts", type: "number", isOptional: false },
          ],
        }),

        // Create indexes for efficient querying (using raw SQL)
        {
          type: "sql",
          sql: `CREATE INDEX IF NOT EXISTS idx_recurrings_due_auto_apply ON recurrings (nextoccurrencedate, autoapplyenabled, isactive);`,
        },
        {
          type: "sql",
          sql: `CREATE INDEX IF NOT EXISTS idx_recurrings_transfers ON recurrings (recurringtype, transferaccountid);`,
        },
        {
          type: "sql",
          sql: `CREATE INDEX IF NOT EXISTS idx_recurrings_auto_apply_status ON recurrings (autoapplyenabled, failedattempts, isactive);`,
        },
      ],
    },
  ],
});
