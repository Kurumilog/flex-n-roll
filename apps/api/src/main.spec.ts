import { Test, TestingModule } from "@nestjs/testing";
import {
  HttpException,
  HttpStatus,
  ArgumentsHost,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";

describe("GlobalExceptionFilter", () => {
  let filter: GlobalExceptionFilter;

  const mockResponse = () => {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    return res;
  };

  const mockRequest = {
    method: "GET",
    url: "/api/test",
  };

  const mockArgumentsHost = (req: any, res: any) => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => res,
        getRequest: () => req,
      }),
    } as unknown as ArgumentsHost;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GlobalExceptionFilter],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
  });

  it("should be defined", () => {
    expect(filter).toBeDefined();
  });

  describe("HttpException handling", () => {
    it("should handle HttpException with object response", () => {
      const res = mockResponse();
      const req = mockRequest;
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException(
        { message: "Validation failed", errors: ["email is invalid"] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, host);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: "Validation failed",
        errors: ["email is invalid"],
      });
    });

    it("should handle HttpException with string response", () => {
      const res = mockResponse();
      const req = mockRequest;
      const host = mockArgumentsHost(req, res);
      const exception = new HttpException("Custom error message", HttpStatus.BAD_GATEWAY);

      filter.catch(exception, host);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 502,
        message: "Custom error message",
        error: "HttpException",
      });
    });

    it("should handle BadRequestException", () => {
      const res = mockResponse();
      const req = mockRequest;
      const host = mockArgumentsHost(req, res);
      const exception = new BadRequestException("Invalid input");

      filter.catch(exception, host);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 400,
        message: "Invalid input",
        error: "Bad Request",
      });
    });

    it("should handle UnauthorizedException", () => {
      const res = mockResponse();
      const req = mockRequest;
      const host = mockArgumentsHost(req, res);
      const exception = new UnauthorizedException("Session not found");

      filter.catch(exception, host);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 401,
        message: "Session not found",
        error: "Unauthorized",
      });
    });

    it("should handle NotFoundException", () => {
      const res = mockResponse();
      const req = mockRequest;
      const host = mockArgumentsHost(req, res);
      const exception = new NotFoundException("Resource not found");

      filter.catch(exception, host);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 404,
        message: "Resource not found",
        error: "Not Found",
      });
    });

    it("should NOT log errors with status < 500", () => {
      const loggerSpy = jest.spyOn(filter["logger"], "error");
      const res = mockResponse();
      const req = mockRequest;
      const host = mockArgumentsHost(req, res);
      const exception = new BadRequestException("Bad request");

      filter.catch(exception, host);

      expect(loggerSpy).not.toHaveBeenCalled();
    });
  });

  describe("Unknown exception handling", () => {
    it("should handle Error as 500", () => {
      const res = mockResponse();
      const req = mockRequest;
      const host = mockArgumentsHost(req, res);
      const exception = new Error("Unexpected error");

      filter.catch(exception, host);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 500,
        message: "Internal server error",
      });
    });

    it("should handle non-Error objects as 500", () => {
      const res = mockResponse();
      const req = mockRequest;
      const host = mockArgumentsHost(req, res);

      filter.catch("string error", host);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 500,
        message: "Internal server error",
      });
    });

    it("should log unknown exceptions", () => {
      const loggerSpy = jest.spyOn(filter["logger"], "error");
      const res = mockResponse();
      const req = mockRequest;
      const host = mockArgumentsHost(req, res);
      const exception = new Error("Unexpected error");

      filter.catch(exception, host);

      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
