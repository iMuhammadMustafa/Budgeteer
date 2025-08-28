import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // Migration from version 1 to 2: Add enhanced recurring transaction fields
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'recurrings',
          columns: [
            { name: 'intervalmonths', type: 'number' },
            { name: 'autoapplyenabled', type: 'boolean' },
            { name: 'transferaccountid', type: 'string', isOptional: true, isIndexed: true },
            { name: 'isamountflexible', type: 'boolean' },
            { name: 'isdateflexible', type: 'boolean' },
            { name: 'recurringtype', type: 'string' },
            { name: 'lastautoappliedat', type: 'string', isOptional: true },
            { name: 'failedattempts', type: 'number' },
            { name: 'maxfailedattempts', type: 'number' },
          ],
        }),
      ],
    },
  ],
});