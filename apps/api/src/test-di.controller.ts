import { Controller, Get } from '@nestjs/common';

export class TestService {
  getMessage(): string {
    return 'Test service works!';
  }
}

@Controller('test-di')
export class TestDiController {
  constructor(private readonly testService: TestService) {
    console.log('[TestDiController] testService:', !!this.testService);
  }

  @Get()
  test(): { success: boolean; message: string } {
    return {
      success: true,
      message: this.testService.getMessage(),
    };
  }
}
