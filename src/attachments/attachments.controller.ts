import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AttachmentsService } from './attachments.service';

@ApiTags('Attachments')
@Controller({
  path: 'attachments',
  version: '1',
})
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    const attachment = await this.attachmentsService.create(file);

    return {
      success: true,
      data: attachment,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const attachment = await this.attachmentsService.findOne(id);

    return {
      success: true,
      data: attachment,
    };
  }
}
