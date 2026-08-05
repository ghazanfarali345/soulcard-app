import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { join, extname } from 'path';
import * as fs from 'fs';
import { SoulSpaceService } from './soul-space.service';
import {
  CreateSoulSpaceDto,
  CreateSoulSpaceUploadDto,
  UpdateSoulSpaceUploadDto,
} from './dto/create-soul-space.dto';
import { UpdateSoulSpaceDto } from './dto/update-soul-space.dto';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { BulkCreateSoulSpaceDto } from './dto/bulk-create-soul-space.dto';
import { SoulSpace } from './entities/soul-space.entity';

@ApiTags('Soul Spaces')
@ApiBearerAuth('access-token')
@Controller('soul-spaces')
export class SoulSpaceController {
  constructor(private readonly soulSpaceService: SoulSpaceService) {}

  @Post()
  @UseGuards(JwtGuard, AdminGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateSoulSpaceUploadDto })
  @ApiOperation({ summary: 'Create a new soul space' })
  @ApiResponse({
    status: 201,
    description: 'The soul space has been successfully created.',
    type: SoulSpace,
  })
  @UseInterceptors(
    FileInterceptor('icon', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const isImageMime =
          typeof file.mimetype === 'string' &&
          file.mimetype.startsWith('image/');
        if (!isImageMime) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @Body() createSoulSpaceUploadDto: CreateSoulSpaceUploadDto,
    @UploadedFile() icon?: Express.Multer.File,
  ) {
    const createSoulSpaceDto: CreateSoulSpaceDto = {
      name: createSoulSpaceUploadDto.name,
      vibes: [],
    };

    try {
      createSoulSpaceDto.vibes = JSON.parse(createSoulSpaceUploadDto.vibes);
    } catch (error) {
      throw new BadRequestException('vibes must be a valid JSON array');
    }

    if (icon) {
      const uploadsDir = join(process.cwd(), 'uploads', 'soul-space-icons');
      fs.mkdirSync(uploadsDir, { recursive: true });
      const fileExt = extname(icon.originalname) || '';
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
      const savedPath = join(uploadsDir, fileName);
      fs.writeFileSync(savedPath, icon.buffer);
      createSoulSpaceDto.icon = `/uploads/soul-space-icons/${fileName}`;
    }

    return this.soulSpaceService.create(createSoulSpaceDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create multiple soul spaces' })
  @ApiResponse({
    status: 201,
    description: 'The soul spaces have been successfully created.',
    type: [SoulSpace],
  })
  bulkCreate(@Body() bulkCreateDto: BulkCreateSoulSpaceDto) {
    return this.soulSpaceService.bulkCreate(bulkCreateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all soul spaces' })
  @ApiResponse({
    status: 200,
    description: 'Return all soul spaces.',
    type: [SoulSpace],
  })
  findAll() {
    return this.soulSpaceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a soul space by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the soul space.',
    type: SoulSpace,
  })
  @ApiResponse({ status: 404, description: 'Soul space not found.' })
  findOne(@Param('id') id: string) {
    return this.soulSpaceService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtGuard, AdminGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateSoulSpaceUploadDto })
  @ApiOperation({ summary: 'Update a soul space' })
  @ApiResponse({
    status: 200,
    description: 'The soul space has been successfully updated.',
    type: SoulSpace,
  })
  @ApiResponse({ status: 404, description: 'Soul space not found.' })
  @UseInterceptors(
    FileInterceptor('icon', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const isImageMime =
          typeof file.mimetype === 'string' &&
          file.mimetype.startsWith('image/');
        if (!isImageMime) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    )
    updateSoulSpaceUploadDto: UpdateSoulSpaceUploadDto,
    @UploadedFile() icon?: Express.Multer.File,
  ) {
    const updateSoulSpaceDto: UpdateSoulSpaceDto = {};

    if (updateSoulSpaceUploadDto.name !== undefined) {
      updateSoulSpaceDto.name = updateSoulSpaceUploadDto.name;
    }

    if (updateSoulSpaceUploadDto.vibes !== undefined) {
      if (updateSoulSpaceUploadDto.vibes.trim() === '') {
        throw new BadRequestException('vibes must not be empty');
      }
      try {
        updateSoulSpaceDto.vibes = JSON.parse(updateSoulSpaceUploadDto.vibes);
      } catch (error) {
        throw new BadRequestException('vibes must be a valid JSON array');
      }
    }

    if (icon) {
      const uploadsDir = join(process.cwd(), 'uploads', 'soul-space-icons');
      fs.mkdirSync(uploadsDir, { recursive: true });
      const fileExt = extname(icon.originalname) || '';
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
      const savedPath = join(uploadsDir, fileName);
      fs.writeFileSync(savedPath, icon.buffer);
      updateSoulSpaceDto.icon = `/uploads/soul-space-icons/${fileName}`;
    }

    return this.soulSpaceService.update(id, updateSoulSpaceDto);
  }

  @Delete(':id')
  @UseGuards(JwtGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a soul space' })
  @ApiResponse({
    status: 204,
    description: 'The soul space has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Soul space not found.' })
  remove(@Param('id') id: string) {
    return this.soulSpaceService.remove(id);
  }
}
