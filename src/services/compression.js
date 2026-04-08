import imageCompression from 'browser-image-compression';
import { MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from '../constants';

/**
 * Compress an image file to WebP format, targeting ≤ MAX_IMAGE_SIZE.
 * Returns a File object with .webp extension.
 */
export async function compressImage(file) {
  // If already small enough WebP, return as-is
  if (file.type === 'image/webp' && file.size <= MAX_IMAGE_SIZE) {
    return file;
  }

  const options = {
    maxSizeMB: MAX_IMAGE_SIZE / (1024 * 1024),
    fileType: 'image/webp',
    useWebWorker: true,
    initialQuality: 0.85,
  };

  const compressed = await imageCompression(file, options);
  return new File([compressed], file.name.replace(/\.[^.]+$/, '.webp'), {
    type: 'image/webp',
  });
}

/**
 * Compress a video file to WebM VP9 format, stripping audio, targeting ≤ MAX_VIDEO_SIZE.
 * Uses FFmpeg.wasm loaded on demand.
 * Returns a File object with .webm extension.
 */
export async function compressVideo(file) {
  // If already small enough WebM, return as-is
  if (file.type === 'video/webm' && file.size <= MAX_VIDEO_SIZE) {
    return file;
  }

  const { FFmpeg } = await import('@ffmpeg/ffmpeg');
  const { fetchFile } = await import('@ffmpeg/util');

  const ffmpeg = new FFmpeg();
  await ffmpeg.load();

  const inputName = 'input' + getExtension(file.name);
  const outputName = 'output.webm';

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  // Encode to VP9 WebM, strip audio, target reasonable bitrate
  await ffmpeg.exec([
    '-i', inputName,
    '-c:v', 'libvpx-vp9',
    '-b:v', '1M',
    '-an',
    '-deadline', 'realtime',
    '-cpu-used', '4',
    outputName,
  ]);

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.terminate();

  return new File([data], file.name.replace(/\.[^.]+$/, '.webm'), {
    type: 'video/webm',
  });
}

function getExtension(filename) {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot) : '';
}
