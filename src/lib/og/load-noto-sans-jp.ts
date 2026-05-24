/** next/og ImageResponse 向けに Noto Sans JP を Google Fonts から読み込む */
export async function loadNotoSansJP(
  weight: 400 | 700 | 800,
  text: string,
): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await fetch(cssUrl).then((res) => {
    if (!res.ok) throw new Error(`Failed to load font CSS: ${res.status}`);
    return res.text();
  });

  const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype|woff2)'\)/);
  if (!match?.[1]) {
    throw new Error("Failed to parse Noto Sans JP font URL");
  }

  return fetch(match[1]).then((res) => {
    if (!res.ok) throw new Error(`Failed to load font file: ${res.status}`);
    return res.arrayBuffer();
  });
}
