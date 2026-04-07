import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { AppConfigService } from "./app.config";

describe("AppConfigService", () => {
  let service: AppConfigService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AppConfigService>(AppConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("nodeEnv", () => {
    it("should return development by default", () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(service.nodeEnv).toBe("development");
    });

    it("should return configured value", () => {
      mockConfigService.get.mockReturnValue("production");

      expect(service.nodeEnv).toBe("production");
    });

    it("should return test when set", () => {
      mockConfigService.get.mockReturnValue("test");

      expect(service.nodeEnv).toBe("test");
    });
  });

  describe("port", () => {
    it("should return default port 3001", () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(service.port).toBe(3001);
    });

    it("should return configured port", () => {
      mockConfigService.get.mockReturnValue(8080);

      expect(service.port).toBe(8080);
    });
  });

  describe("frontendOrigin", () => {
    it("should return default origin http://localhost:3000", () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(service.frontendOrigin).toBe("http://localhost:3000");
    });

    it("should return configured origin", () => {
      mockConfigService.get.mockReturnValue("https://myapp.com");

      expect(service.frontendOrigin).toBe("https://myapp.com");
    });
  });

  describe("demoPassword", () => {
    it("should return default password demo12345", () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(service.demoPassword).toBe("demo12345");
    });

    it("should return configured password", () => {
      mockConfigService.get.mockReturnValue("secret123");

      expect(service.demoPassword).toBe("secret123");
    });
  });

  describe("groqApiKey", () => {
    it("should return undefined if not configured", () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(service.groqApiKey).toBeUndefined();
    });

    it("should return configured API key", () => {
      mockConfigService.get.mockReturnValue("gsk_abc123");

      expect(service.groqApiKey).toBe("gsk_abc123");
    });
  });

  describe("bitrix24WebhookUrl", () => {
    it("should return undefined if not configured", () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(service.bitrix24WebhookUrl).toBeUndefined();
    });

    it("should return configured webhook URL", () => {
      mockConfigService.get.mockReturnValue("https://hook.bitrix24.com/abc123");

      expect(service.bitrix24WebhookUrl).toBe("https://hook.bitrix24.com/abc123");
    });
  });

  describe("jwtSecret", () => {
    it("should return undefined if not configured", () => {
      mockConfigService.get.mockReturnValue(undefined);

      expect(service.jwtSecret).toBeUndefined();
    });

    it("should return configured JWT secret", () => {
      mockConfigService.get.mockReturnValue("my-secret-key");

      expect(service.jwtSecret).toBe("my-secret-key");
    });
  });

  describe("environment checks", () => {
    it("should return isDevelopment as true when nodeEnv is development", () => {
      mockConfigService.get.mockReturnValue("development");

      expect(service.isDevelopment).toBe(true);
      expect(service.isProduction).toBe(false);
      expect(service.isTest).toBe(false);
    });

    it("should return isProduction as true when nodeEnv is production", () => {
      mockConfigService.get.mockReturnValue("production");

      expect(service.isDevelopment).toBe(false);
      expect(service.isProduction).toBe(true);
      expect(service.isTest).toBe(false);
    });

    it("should return isTest as true when nodeEnv is test", () => {
      mockConfigService.get.mockReturnValue("test");

      expect(service.isDevelopment).toBe(false);
      expect(service.isProduction).toBe(false);
      expect(service.isTest).toBe(true);
    });
  });
});
