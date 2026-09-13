import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createAttachment } from '@/lib/api';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.txt',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file attachment for a task
 *     tags:
 *       - Attachments
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               taskId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attachment created.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const taskId = formData.get('taskId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 });
    }

    // Validate taskId is a valid UUID to prevent path traversal
    if (!uuidValidate(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Validate file extension against allowlist
    const extension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: `File type '${extension}' is not allowed` },
        { status: 400 }
      );
    }

    // Validate MIME type against allowlist
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File MIME type '${file.type}' is not allowed` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename while preserving extension
    const originalName = file.name;
    const baseName = path.basename(originalName, extension);
    const uniqueName = `${baseName}-${Date.now()}${extension}`;
    const filePath = `/uploads/${taskId}/${uniqueName}`;

    // In production, upload to S3/Cloudinary here.
    // For now, save to local filesystem.
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', taskId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePathOnDisk = path.join(uploadDir, uniqueName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePathOnDisk, Buffer.from(bytes));

    const attachment = await createAttachment({
      id: uuidv4(),
      taskId,
      filename: originalName,
      filePath,
      fileSize: file.size,
      mimeType: file.type,
    });

    logger.info('Attachment uploaded', {
      taskId,
      filename: originalName,
      fileSize: file.size,
      userId: session.user.id,
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    logger.error('Error uploading file', { error });
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
