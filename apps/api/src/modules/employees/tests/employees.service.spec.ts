import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from '../employees.service';
import { PrismaService } from '../../../prisma/prisma.service';

// Mock PrismaService
const mockPrismaService = {
  employee: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  assignment: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
};

describe('EmployeesService', () => {
  let service: EmployeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableEmployees', () => {
    it('should return only available employees sorted by kpiScore DESC', async () => {
      // arrange
      // Примечание: Prisma сортирует, поэтому мок должен вернуть уже отсортированные данные
      mockPrismaService.employee.findMany.mockResolvedValue([
        { id: 13, name: 'Марина', kpiScore: 91.0, isAvailable: true },
        { id: 33, name: 'Александр', kpiScore: 78.5, isAvailable: true },
        { id: 1, name: 'Алексей', kpiScore: 65.0, isAvailable: true },
      ]);

      // act
      const result = await service.getAvailableEmployees();

      // assert
      expect(result[0].id).toBe(13); // Марина с KPI 91 идёт первой
      expect(result[0].kpiScore).toBe(91.0);
      expect(result[1].id).toBe(33);
      expect(result[2].id).toBe(1);
      expect(mockPrismaService.employee.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isAvailable: true },
          orderBy: { kpiScore: 'desc' },
        }),
      );
    });

    it('should return empty array when no employees are available', async () => {
      // arrange
      mockPrismaService.employee.findMany.mockResolvedValue([]);

      // act
      const result = await service.getAvailableEmployees();

      // assert
      expect(result).toEqual([]);
    });

    it('should filter out unavailable employees', async () => {
      // arrange
      mockPrismaService.employee.findMany.mockResolvedValue([
        { id: 13, name: 'Марина', kpiScore: 91.0, isAvailable: true },
      ]);

      // act
      const result = await service.getAvailableEmployees();

      // assert
      expect(result).toHaveLength(1);
      expect(result[0].isAvailable).toBe(true);
    });
  });

  describe('getPersonalManager', () => {
    it('should return personal manager if interaction count >= 2', async () => {
      // arrange
      mockPrismaService.assignment.findFirst.mockResolvedValue({
        employeeId: 13,
        interactionCount: 3,
        employee: {
          id: 13,
          name: 'Марина',
          kpiScore: 91.0,
          isAvailable: true,
        },
      });

      // act
      const result = await service.getPersonalManager(
        '+375291234567',
        'test@example.com',
      );

      // assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(13);
      expect(result!.isPersonalManager).toBe(true);
    });

    it('should return null if interaction count < 2', async () => {
      // arrange
      mockPrismaService.assignment.findFirst.mockResolvedValue({
        employeeId: 13,
        interactionCount: 1,
        employee: {
          id: 13,
          name: 'Марина',
          kpiScore: 91.0,
          isAvailable: true,
        },
      });

      // act
      const result = await service.getPersonalManager(
        '+375291234567',
        'test@example.com',
      );

      // assert
      expect(result).toBeNull();
    });

    it('should return null if no assignment found', async () => {
      // arrange
      mockPrismaService.assignment.findFirst.mockResolvedValue(null);

      // act
      const result = await service.getPersonalManager(
        '+375291234567',
        'test@example.com',
      );

      // assert
      expect(result).toBeNull();
    });

    it('should search by phone first, then email', async () => {
      // arrange
      mockPrismaService.assignment.findFirst
        .mockResolvedValueOnce(null) // phone search
        .mockResolvedValueOnce({
          // email search
          employeeId: 33,
          interactionCount: 2,
          employee: {
            id: 33,
            name: 'Александр',
            kpiScore: 78.5,
            isAvailable: true,
          },
        });

      // act
      const result = await service.getPersonalManager(
        '+375291234567',
        'test@example.com',
      );

      // assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(33);
      expect(mockPrismaService.assignment.findFirst).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateAvailability', () => {
    it('should update employee availability', async () => {
      // arrange
      mockPrismaService.employee.update.mockResolvedValue({
        id: 13,
        name: 'Марина',
        isAvailable: false,
      });

      // act
      const result = await service.updateAvailability(13, false);

      // assert
      expect(result.id).toBe(13);
      expect(result.isAvailable).toBe(false);
      expect(mockPrismaService.employee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 13 },
          data: { isAvailable: false },
        }),
      );
    });

    it('should throw NotFoundException if employee does not exist', async () => {
      // arrange
      mockPrismaService.employee.update.mockRejectedValue(
        new Error('Record not found'),
      );

      // act & assert
      await expect(service.updateAvailability(999, true)).rejects.toThrow();
    });
  });

  describe('getEmployeeKpi', () => {
    it('should return employee with KPI history', async () => {
      // arrange
      const mockEmployee = {
        id: 13,
        name: 'Марина',
        kpiScore: 91.0,
        dealsWon: 45,
        dealsLost: 4,
        avgResponseMinutes: 8.5,
        kpiHistory: [
          { period: new Date('2026-04-01'), kpiScore: 89.0 },
          { period: new Date('2026-04-07'), kpiScore: 91.0 },
        ],
      };

      mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

      // act
      const result = await service.getEmployeeKpi(13);

      // assert
      expect(result.id).toBe(13);
      expect(result.kpiHistory).toHaveLength(2);
      expect(result.kpiHistory[0].kpiScore).toBe(89.0);
    });

    it('should throw NotFoundException if employee does not exist', async () => {
      // arrange
      mockPrismaService.employee.findUnique.mockResolvedValue(null);

      // act & assert
      await expect(service.getEmployeeKpi(999)).rejects.toThrow();
    });
  });
});
