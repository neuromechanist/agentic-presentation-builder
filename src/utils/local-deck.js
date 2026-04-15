export function createImportedDeckFileCatalog(files) {
  const filesByPath = new Map();

  for (const fileEntry of files) {
    const file = fileEntry.file || fileEntry;
    const relativePath = fileEntry.relativePath || file.webkitRelativePath || file.name;
    const normalizedPath = normalizeImportedFilePath(relativePath);

    if (!normalizedPath) {
      continue;
    }

    filesByPath.set(normalizedPath, file);
  }

  const jsonFiles = Array.from(filesByPath.keys())
    .filter(path => path.toLowerCase().endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));

  return {
    filesByPath,
    jsonFiles
  };
}

export function rewriteImportedPresentationAssetPaths(
  presentationData,
  { createObjectUrl, filesByPath, jsonRelativePath }
) {
  const clonedPresentation = structuredClone(presentationData);
  const objectUrls = [];
  const objectUrlByPath = new Map();
  const unresolvedAssets = [];

  for (const slide of clonedPresentation.presentation?.slides || []) {
    slide.background = resolveImportedAssetReference(
      slide.background,
      jsonRelativePath,
      filesByPath,
      createObjectUrl,
      objectUrlByPath,
      objectUrls,
      unresolvedAssets
    );

    for (const element of slide.elements || []) {
      if (element.type === 'image') {
        element.src = resolveImportedAssetReference(
          element.src,
          jsonRelativePath,
          filesByPath,
          createObjectUrl,
          objectUrlByPath,
          objectUrls,
          unresolvedAssets
        );
      }
    }
  }

  return {
    objectUrls,
    presentationData: clonedPresentation,
    unresolvedAssets
  };
}

function resolveImportedAssetReference(
  assetPath,
  jsonRelativePath,
  filesByPath,
  createObjectUrl,
  objectUrlByPath,
  objectUrls,
  unresolvedAssets
) {
  const resolvedPath = resolveImportedAssetPath(assetPath, jsonRelativePath);

  if (!resolvedPath) {
    return assetPath;
  }

  const file = filesByPath.get(resolvedPath);
  if (!file) {
    unresolvedAssets.push({
      assetPath,
      resolvedPath
    });
    return assetPath;
  }

  let objectUrl = objectUrlByPath.get(resolvedPath);
  if (!objectUrl) {
    objectUrl = createObjectUrl(file);
    objectUrlByPath.set(resolvedPath, objectUrl);
    objectUrls.push(objectUrl);
  }

  return objectUrl;
}

function resolveImportedAssetPath(assetPath, jsonRelativePath) {
  if (typeof assetPath !== 'string' || assetPath.length === 0) {
    return null;
  }

  if (assetPath.startsWith('#') || assetPath.startsWith('//')) {
    return null;
  }

  if (hasRemoteProtocol(assetPath)) {
    return null;
  }

  if (assetPath.startsWith('/')) {
    return normalizePath(assetPath.slice(1));
  }

  const baseDirectory = dirname(jsonRelativePath);
  return normalizePath(joinRelativePath(baseDirectory, assetPath));
}

function normalizeImportedFilePath(path) {
  if (typeof path !== 'string' || path.length === 0) {
    return '';
  }

  const normalized = path.replaceAll('\\', '/').replace(/^\/+/, '');
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length === 0) {
    return '';
  }

  if (normalized.includes('/')) {
    return normalizePath(segments.slice(1).join('/'));
  }

  return normalizePath(segments[0]);
}

function dirname(path) {
  const normalized = normalizePath(path);
  const lastSlashIndex = normalized.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    return '';
  }

  return normalized.slice(0, lastSlashIndex);
}

function joinRelativePath(baseDirectory, relativePath) {
  if (!baseDirectory) {
    return relativePath;
  }

  return `${baseDirectory}/${relativePath}`;
}

function normalizePath(path) {
  const segments = path.replaceAll('\\', '/').split('/');
  const normalizedSegments = [];

  for (const segment of segments) {
    if (!segment || segment === '.') {
      continue;
    }

    if (segment === '..') {
      normalizedSegments.pop();
      continue;
    }

    normalizedSegments.push(segment);
  }

  return normalizedSegments.join('/');
}

function hasRemoteProtocol(value) {
  const protocolMatch = value.match(/^([a-zA-Z][a-zA-Z\d+.-]*):/);
  return Boolean(protocolMatch);
}
