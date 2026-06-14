import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ContentPage,
  ContentPageDocument,
} from '../entities/content-page.entity';

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(ContentPage.name)
    private readonly contentModel: Model<ContentPageDocument>,
  ) {}

  async getByKey(key: string) {
    let page = await this.contentModel.findOne({ key });
    if (!page) {
      page = await this.contentModel.create({
        key,
        content: '',
        isPublished: false,
      });
    }
    return page;
  }

  async update(key: string, content: string, editorId?: string) {
    const page = await this.getByKey(key);
    page.content = content;
    page.lastEditedBy = editorId || null;
    page.isPublished = false;
    return page.save();
  }

  async publish(key: string, editorId?: string) {
    const page = await this.getByKey(key);
    if (!page) throw new NotFoundException('Content page not found');
    page.isPublished = true;
    page.lastEditedBy = editorId || null;
    return page.save();
  }
}
