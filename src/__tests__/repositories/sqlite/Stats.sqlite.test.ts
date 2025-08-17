import { describe, it, expect, beforeEach } from "@jest/globals";
import dayjs from "dayjs";
import { StatsSQLiteRepository } from "../../../repositories/sqlite/Stats.sqlite";

// Mock the SQLite provider
jest.mock("../../../providers/SQLite", () => ({
  getSQLiteDB: jest.fn(),
  isSQLiteReady: jest.fn(() => true),
}));

// Mock drizzle-orm
let mockQueryResult: any[] = [];

const createMockSelectChain = (result: any) => ({
  from: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnValue({
      groupBy: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue(result),
      }),
    }),
    innerJoin: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          groupBy: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue(result),
          }),
        }),
      }),
      where: jest.fn().mockReturnValue({
        groupBy: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue(result),
        }),
      }),
    }),
  }),
});

const mockDb = {
  select: jest.fn().mockImplementation(() => createMockSelectChain(mockQueryResult)),
};

describe("StatsSQLiteRepository", () => {
  let statsRepository: StatsSQLiteRepository;
  const tenantId = "test-tenant-stats";
  const testDate = "2024-01-15";

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockQueryResult = [];
    
    // Mock the database instance
    const { getSQLiteDB } = require("../../../providers/SQLite");
    getSQLiteDB.mockReturnValue(mockDb);
    
    statsRepository = new StatsSQLiteRepository();
  });

  describe("getStatsDailyTransactions", () => {
    it("should return daily transaction stats for expenses", async () => {
      const mockData = [
        {
          date: testDate,
          sum: 150,
          tenantid: tenantId,
          type: "Expense",
        },
      ];
      mockQueryResult = mockData;

      const startDate = dayjs(testDate).startOf("day").toISOString();
      const endDate = dayjs(testDate).endOf("day").toISOString();

      const result = await statsRepository.getStatsDailyTransactions(
        tenantId,
        startDate,
        endDate,
        "Expense"
      );

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it("should return empty array when no transactions in date range", async () => {
      mockQueryResult = [];

      const startDate = dayjs(testDate).add(1, "day").startOf("day").toISOString();
      const endDate = dayjs(testDate).add(1, "day").endOf("day").toISOString();

      const result = await statsRepository.getStatsDailyTransactions(
        tenantId,
        startDate,
        endDate,
        "Expense"
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("getStatsMonthlyTransactionsTypes", () => {
    it("should return monthly transaction type stats", async () => {
      const mockData = [
        {
          date: "2024-01",
          sum: 150,
          tenantid: tenantId,
          type: "Expense",
        },
      ];
      mockQueryResult = mockData;

      const startDate = dayjs(testDate).startOf("month").toISOString();
      const endDate = dayjs(testDate).endOf("month").toISOString();

      const result = await statsRepository.getStatsMonthlyTransactionsTypes(
        tenantId,
        startDate,
        endDate
      );

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe("getStatsMonthlyCategoriesTransactions", () => {
    it("should return monthly categories transaction stats", async () => {
      const mockData = [
        {
          groupid: "test-group-1",
          categoryid: "test-category-1",
          groupname: "Test Expense Group",
          categoryname: "Test Expense Category",
          sum: 150,
          type: "Expense",
          date: "2024-01",
          tenantid: tenantId,
          groupicon: "icon",
          categoryicon: "icon",
          groupbudgetamount: 0,
          categorybudgetamount: 0,
          categorybudgetfrequency: "Monthly",
          categorycolor: "info-100",
          categorydisplayorder: 0,
          groupbudgetfrequency: "Monthly",
          groupcolor: "info-100",
          groupdisplayorder: 0,
        },
      ];
      mockQueryResult = mockData;

      const startDate = dayjs(testDate).startOf("month").format("YYYY-MM-DD");
      const endDate = dayjs(testDate).endOf("month").format("YYYY-MM-DD");

      const result = await statsRepository.getStatsMonthlyCategoriesTransactions(
        tenantId,
        startDate,
        endDate
      );

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe("getStatsMonthlyAccountsTransactions", () => {
    it("should return monthly accounts transaction stats", async () => {
      const mockData = [
        {
          account: "Test Account",
          accountid: "test-account-1",
          date: "2024-01",
          sum: 150,
          tenantid: tenantId,
        },
      ];
      mockQueryResult = mockData;

      const startDate = dayjs(testDate).startOf("month").format("YYYY-MM-DD");
      const endDate = dayjs(testDate).endOf("month").format("YYYY-MM-DD");

      const result = await statsRepository.getStatsMonthlyAccountsTransactions(
        tenantId,
        startDate,
        endDate
      );

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe("getStatsNetWorthGrowth", () => {
    it("should return net worth growth stats", async () => {
      const mockData = [
        {
          month: "2024-01-01",
          total_net_worth: 1000,
          tenantid: tenantId,
        },
      ];
      mockQueryResult = mockData;

      const startDate = dayjs(testDate).startOf("year").format("YYYY-MM-DD");
      const endDate = dayjs(testDate).endOf("year").format("YYYY-MM-DD");

      const result = await statsRepository.getStatsNetWorthGrowth(
        tenantId,
        startDate,
        endDate
      );

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe("error handling", () => {
    it("should throw error when database is not initialized", async () => {
      const { isSQLiteReady } = require("../../../providers/SQLite");
      isSQLiteReady.mockReturnValue(false);
      
      await expect(
        statsRepository.getStatsDailyTransactions(tenantId)
      ).rejects.toThrow("SQLite database not initialized");
    });
  });
});