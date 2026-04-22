import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Generate content using Gemini AI
   * @param prompt - The prompt to send to Gemini
   * @returns Generated content response
   */
  async generateContent(prompt: string): Promise<string> {
    try {
      if (!prompt || prompt.trim().length === 0) {
        throw new HttpException(
          'Prompt cannot be empty',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return text;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Gemini API Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Generate content with streaming (for real-time responses)
   * @param prompt - The prompt to send to Gemini
   * @returns Async generator for streaming responses
   */
  async generateContentStream(prompt: string) {
    try {
      if (!prompt || prompt.trim().length === 0) {
        throw new HttpException(
          'Prompt cannot be empty',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.model.generateContentStream(prompt);
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Gemini API Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Chat conversation with Gemini
   * @param messages - Array of message objects with role and content
   * @returns Response from Gemini
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    try {
      const chatModel = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });
      const chat = chatModel.startChat({
        history: messages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });

      const result = await chat.sendMessage(
        messages[messages.length - 1].content,
      );
      const response = result.response;
      return response.text();
    } catch (error) {
      throw new HttpException(
        `Gemini Chat Error: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
