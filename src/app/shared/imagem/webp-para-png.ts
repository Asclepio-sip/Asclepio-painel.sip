/** Arquivo WebP (pelo tipo ou pela extensão — alguns navegadores mandam o tipo vazio). */
export function isWebp(arquivo: File): boolean {
  return arquivo.type === 'image/webp' || /\.webp$/i.test(arquivo.name);
}

/**
 * Converte WebP para PNG no navegador (canvas), mantendo transparência e tamanho.
 * Qualquer outro formato volta igual. Rejeita se o navegador não conseguir ler a imagem.
 */
export async function webpParaPng(arquivo: File): Promise<File> {
  if (!isWebp(arquivo)) {
    return arquivo;
  }

  const bitmap = await createImageBitmap(arquivo);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao gerar o PNG'))), 'image/png')
    );

    const nome = arquivo.name.replace(/\.webp$/i, '') + '.png';
    return new File([blob], nome, { type: 'image/png', lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
