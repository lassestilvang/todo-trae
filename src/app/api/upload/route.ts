import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createAttachment } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

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
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename while preserving extension
    const originalName = file.name;
    const extension = path.extname(originalName);
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
