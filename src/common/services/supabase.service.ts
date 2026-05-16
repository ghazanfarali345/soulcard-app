import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('DEBUG: SUPABASE_URL length:', supabaseUrl?.length || 0);
    console.log('DEBUG: SUPABASE_SERVICE_ROLE_KEY length:', supabaseKey?.length || 0);

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('DEBUG: Supabase client initialized successfully');
    } else {
      console.error('DEBUG: Supabase credentials missing in process.env!');
    }
  }

  async uploadImage(file: Express.Multer.File, bucket: string): Promise<string> {
    console.log(`DEBUG: Attempting to upload to Supabase bucket: '${bucket}'`);
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Supabase upload error: ${error.message}`);
      throw error;
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }
}
