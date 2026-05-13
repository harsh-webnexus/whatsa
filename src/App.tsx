import { useEffect, useMemo, useState } from 'react';

type PageData = {
  content_id?: string;

  title?: string;
  blog_image?: string;
  short_description?: string;

  page_url?: string;

  insta_image?: string;
  instagram_description?: string;

  facebook_image?: string;
  facebook_description?: string;
};

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1TOpJBRk-w3OGSP-bmKT6Yx5rnMJl4AXxUfEjsTwFFbw/gviz/tq?tqx=out:csv&sheet=AI%20GENERATED%20DATA';

/* ---------------- CSV PARSER ---------------- */

function parseCSV(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];

  let currentRow: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"' && nextChar === '"') {
      currentValue += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentValue.trim());
      currentValue = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (currentValue || currentRow.length > 0) {
        currentRow.push(currentValue.trim());

        rows.push(currentRow);

        currentRow = [];
        currentValue = '';
      }

      if (char === '\r' && nextChar === '\n') i++;
    } else {
      currentValue += char;
    }
  }

  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue.trim());
    rows.push(currentRow);
  }

  const headers = rows[0] || [];

  return rows.slice(1).map((row) => {
    const item: Record<string, string> = {};

    headers.forEach((header, index) => {
      item[header.trim()] = row[index]?.trim() || '';
    });

    return item;
  });
}

/* ---------------- IMAGE HELPERS ---------------- */

function getGoogleDriveImageUrl(value?: string) {
  if (!value) return '';

  const text = String(value).trim();

  if (!text.includes('http') && !text.includes('id=')) {
    return `https://lh3.googleusercontent.com/d/${text}`;
  }

  const idFromQuery = text.match(/[?&]id=([^&]+)/)?.[1];

  if (idFromQuery) {
    return `https://lh3.googleusercontent.com/d/${idFromQuery}`;
  }

  const idFromPath = text.match(/\/d\/([^/]+)/)?.[1];

  if (idFromPath) {
    return `https://lh3.googleusercontent.com/d/${idFromPath}`;
  }

  return text;
}

function extractDriveFileId(value?: string) {
  if (!value) return '';

  const text = String(value).trim();

  if (!text.includes('http') && !text.includes('id=')) {
    return text;
  }

  const idFromQuery = text.match(/[?&]id=([^&]+)/)?.[1];

  if (idFromQuery) return idFromQuery;

  const idFromPath = text.match(/\/d\/([^/?]+)/)?.[1];

  if (idFromPath) return idFromPath;

  return '';
}

function buildImageCandidates(url?: string) {
  const base = String(url ?? '').trim();

  if (!base) return [];

  const fileId = extractDriveFileId(base);

  if (!fileId) {
    const baseWithoutProtocol = base.replace(/^https?:\/\//, '');

    return [
      base,
      `https://images.weserv.nl/?url=${encodeURIComponent(
        baseWithoutProtocol
      )}`,
    ];
  }

  return [
    `https://lh3.googleusercontent.com/d/${fileId}=s0`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
    base,
  ];
}

/* ---------------- SMART IMAGE ---------------- */

function SmartImage({ src, alt }: { src: string; alt: string }) {
  const candidates = useMemo(() => buildImageCandidates(src), [src]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [src]);

  const currentSrc = candidates[index] ?? src;

  return (
    <img
      className="hero-image"
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        if (index < candidates.length - 1) {
          setIndex((prev) => prev + 1);
        }
      }}
    />
  );
}

/* ---------------- FETCH ---------------- */

async function fetchContentById(
  contentId: string
): Promise<PageData | null> {
  const response = await fetch(SHEET_CSV_URL);

  const csvText = await response.text();

  const rows = parseCSV(csvText);

  const matchedRow = rows.find((row) => {
    const sheetContentId =
      row.CONTENTID ||
      row.content_id ||
      row.CONTENT_ID ||
      row['CONTENT ID'];

    return String(sheetContentId || '').trim() === contentId.trim();
  });

  console.log('MATCHED ROW:', matchedRow);

  if (!matchedRow) return null;

  return {
    title: matchedRow.TITLE || matchedRow.title,

    blog_image: getGoogleDriveImageUrl(
      matchedRow.BLOG_IMAGE ||
        matchedRow['BLOG IMAGE'] ||
        matchedRow['BLOG IMAGE URL']
    ),

    insta_image: getGoogleDriveImageUrl(
      matchedRow.INSTRAGRAM_IMAGE ||
        matchedRow['INSTRAGRAM IMAGE'] ||
        matchedRow.INSTA_IMAGE ||
        matchedRow['INSTA IMAGE URL']
    ),

    facebook_image: getGoogleDriveImageUrl(
      matchedRow['FACEBOOK IMAGE'] ||
        matchedRow.FACEBOOK_IMAGE ||
        matchedRow.FB_IMAGE ||
        matchedRow['FB IMAGE URL']
    ),

    short_description:
      matchedRow['BLOG SHORT DESCRIPTION'] ||
      matchedRow['SHORT DESCRIPTION'],

    page_url:
      matchedRow.post_url ||
      matchedRow['post_url'] ||
      matchedRow['POST_URL'],

    instagram_description: matchedRow['INSTAGRAM DESCRIPTION'],

    facebook_description: matchedRow['FACEBOOK DESCRIPTION'],
  };
}

/* ---------------- APP ---------------- */

function App() {
  const [data, setData] = useState<PageData | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');

    if (!id) return;

    fetchContentById(id).then(setData);
  }, []);

  if (!data) return <p>Loading...</p>;

  const blogImageUrl = data.blog_image?.trim() || '';
  const instaImageUrl = data.insta_image?.trim() || '';
  const facebookImageUrl = data.facebook_image?.trim() || '';

  return (
    <main className="screen">
      <article className="content-card">

        {/* BLOG */}
        {blogImageUrl && (
          <>
            <p className="section-title">Blog</p>

            <SmartImage src={blogImageUrl} alt="" />
          </>
        )}

        <section className="content-text">
          <h1 className="content-title">{data.title}</h1>

          {data.short_description && (
            <p className="content-description">
               {data.short_description}
            </p>
          )}

          {data.page_url?.trim() && (
            <div className="page-url-wrapper">
              <a
                href={data.page_url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="page-url-button"
              >
                PREVIEW
              </a>
            </div>
          )}
        </section>

        {/* INSTAGRAM */}
        {(instaImageUrl || data.instagram_description) && (
          <>
            <div className="divider" />

            {instaImageUrl && (
              <>
                <p className="section-title">Instagram</p>

                <SmartImage src={instaImageUrl} alt="" />
              </>
            )}

            {data.instagram_description && (
              <section className="content-text">
                <h2 className="content-title">{data.title}</h2>

                <p className="content-description">
                 {' '}
                  {data.instagram_description}
                </p>
              </section>
            )}
          </>
        )}

        {/* FACEBOOK */}
        {(facebookImageUrl || data.facebook_description) && (
          <>
            <div className="divider" />

            {facebookImageUrl && (
              <>
                <p className="section-title">Facebook</p>

                <SmartImage src={facebookImageUrl} alt="" />
              </>
            )}

            {data.facebook_description && (
              <section className="content-text">
                <h2 className="content-title">{data.title}</h2>

                <p className="content-description">
                  {' '}
                  {data.facebook_description}
                </p>
              </section>
            )}
          </>
        )}

      </article>
    </main>
  );
}

export default App;