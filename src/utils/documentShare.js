const MIME_BY_FILE_TYPE = {
  pdf: 'application/pdf',
  image: 'image/jpeg',
};

const EXT_BY_MIME = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function sanitizeFileName(name) {
  return (name || 'document')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 120);
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function isPdfBlob(blob) {
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  return header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
}

function getAttachmentList(doc) {
  if (Array.isArray(doc?.attachments) && doc.attachments.length > 0) {
    return doc.attachments;
  }

  if (doc?.cloudinaryUrl) {
    return [{
      cloudinaryUrl: doc.cloudinaryUrl,
      fileType: doc.fileType,
      originalName: `${doc.documentName || 'document'}.${doc.fileType === 'pdf' ? 'pdf' : 'jpg'}`,
    }];
  }

  return [];
}

async function buildDocumentFileFromAttachment(doc, attachment, index) {
  const response = await fetch(attachment.cloudinaryUrl);
  if (!response.ok) {
    throw new Error('Unable to load the document file');
  }

  const blob = await response.blob();
  const mimeType = attachment.fileType === 'pdf'
    ? 'application/pdf'
    : (response.headers.get('content-type') || blob.type || MIME_BY_FILE_TYPE[attachment.fileType] || 'application/octet-stream');

  if (attachment.fileType === 'pdf' && !(await isPdfBlob(blob))) {
    throw new Error('This document was stored as a preview image, not the original PDF. Please re-upload the original PDF.');
  }

  const ext = EXT_BY_MIME[mimeType] || (attachment.fileType === 'pdf' ? 'pdf' : 'jpg');
  const baseName = sanitizeFileName(
    attachment.originalName || doc.documentName || `document-${index + 1}`
  );
  const fileName = baseName.toLowerCase().endsWith(`.${ext}`)
    ? baseName
    : `${baseName}.${ext}`;

  return new File([blob], fileName, { type: mimeType });
}

export async function buildDocumentFiles(doc) {
  const attachments = getAttachmentList(doc);
  if (attachments.length === 0) {
    throw new Error('No document file available');
  }

  const files = [];
  for (let index = 0; index < attachments.length; index += 1) {
    files.push(await buildDocumentFileFromAttachment(doc, attachments[index], index));
  }

  return files;
}

export async function shareDocumentFile(doc) {
  const files = await buildDocumentFiles(doc);

  const shareData = {
    title: doc.documentName,
    text: doc.documentName,
    files,
  };

  if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
    await navigator.share(shareData);
    return { mode: 'shared', fileName: files.map((file) => file.name).join(', ') };
  }

  files.forEach((file) => downloadBlob(file, file.name));
  return { mode: 'downloaded', fileName: files.map((file) => file.name).join(', ') };
}
