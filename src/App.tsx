import { useEffect, useMemo, useState } from 'react';

type PageData = {
  content_id?: string;

  title?: string;
  blog_image?: string;
  short_description?: string;
  long_description?: string;

  insta_image?: string;
  instagram_description?: string;

  facebook_image?: string;
  facebook_description?: string;
};

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1TOpJBRk-w3OGSP-bmKT6Yx5rnMJl4AXxUfEjsTwFFbw/gviz/tq?tqx=out:csv&sheet=AI%20GENERATED%20DATA';

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

      if (char === '\r' && nextChar === '\n') {
        i++;
      }
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

function getGoogleDriveImageUrl(value?: string) {
  if (!value) return '';

  const text = String(value).trim();

  // already only ID
  if (!text.includes('http') && !text.includes('id=')) {
    return `https://lh3.googleusercontent.com/d/${text}`;
  }

  // format: https://drive.google.com/open?id=FILE_ID
  const idFromQuery = text.match(/[?&]id=([^&]+)/)?.[1];
  if (idFromQuery) {
    return `https://lh3.googleusercontent.com/d/${idFromQuery}`;
  }

  // format: https://drive.google.com/file/d/FILE_ID/view
  const idFromPath = text.match(/\/d\/([^/]+)/)?.[1];
  if (idFromPath) {
    return `https://lh3.googleusercontent.com/d/${idFromPath}`;
  }

  return text;
}

function extractDriveFileId(value?: string) {
  if (!value) return '';

  const text = String(value).trim();

  if (!text) return '';

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
      `https://images.weserv.nl/?url=${encodeURIComponent(baseWithoutProtocol)}`,
    ];
  }

  return [
    `https://lh3.googleusercontent.com/d/${fileId}=s0`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
    `https://images.weserv.nl/?url=${encodeURIComponent(
      `drive.google.com/uc?export=download&id=${fileId}`
    )}`,
    base,
  ];
}

type SmartImageProps = {
  src: string;
  alt: string;
};

function SmartImage({ src, alt }: SmartImageProps) {
  const candidates = useMemo(() => buildImageCandidates(src), [src]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [src]);

  const currentSrc = candidates[candidateIndex] ?? src;

  return (
    <img
      className="hero-image"
      src={currentSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        setCandidateIndex((prev) =>
          prev < candidates.length - 1 ? prev + 1 : prev
        );
      }}
    />
  );
}

async function fetchContentById(contentId: string): Promise<PageData | null> {
  const response = await fetch(SHEET_CSV_URL);

  if (!response.ok) {
    throw new Error('Failed to fetch Google Sheet data');
  }

  const csvText = await response.text();
  const rows = parseCSV(csvText);

  console.log('All parsed rows:', rows);
  console.log('URL content id:', contentId);

  const matchedRow = rows.find((row) => {
    const sheetContentId =
      row.CONTENTID ||
      row.content_id ||
      row.CONTENT_ID ||
      row['CONTENT ID'];

    return String(sheetContentId || '').trim() === String(contentId || '').trim();
  });

  console.log('Matched row:', matchedRow);

  if (!matchedRow) {
    return null;
  }

  return {
    content_id:
      matchedRow.CONTENTID ||
      matchedRow.content_id ||
      matchedRow.CONTENT_ID ||
      matchedRow['CONTENT ID'],

    title: matchedRow.TITLE || matchedRow.title,

    short_description:
      matchedRow['BLOG SHORT DESCRIPTION'] ||
      matchedRow['BLOG SHORT D'] ||
      matchedRow.short_description,

    long_description:
      matchedRow['BLOG LONG DESCRIPTION'] ||
      matchedRow['BLOG LONG DE'] ||
      matchedRow.long_description,

    blog_image: getGoogleDriveImageUrl(
      matchedRow.BLOG_IMAGE ||
        matchedRow['BLOG IMAGE'] ||
        matchedRow.blog_image
    ),

    insta_image: getGoogleDriveImageUrl(
      matchedRow.INSTRAGRAM_IMAGE ||
        matchedRow.INSTAGRAM_IMAGE ||
        matchedRow.INSTA_IMAGE ||
        matchedRow['INSTAGRAM IMAGE'] ||
        matchedRow['INSTA IMAGE'] ||
        matchedRow.insta_image
    ),

    instagram_description:
      matchedRow['INSTAGRAM DESCRIPTION'] ||
      matchedRow['INSTA DESCRIPTION'] ||
      matchedRow.INSTAGRAM_DESCRIPTION ||
      matchedRow.INSTA_DESCRIPTION ||
      matchedRow.instagram_description ||
      matchedRow.insta_description,

    facebook_image: getGoogleDriveImageUrl(
      matchedRow['FACEBOOK IMAGE'] ||
        matchedRow.FACEBOOK_IMAGE ||
        matchedRow.FB_IMAGE ||
        matchedRow.facebook_image ||
        matchedRow.fb_image
    ),

    facebook_description:
      matchedRow['FACEBOOK DESCRIPTION'] ||
      matchedRow['FB DESCRIPTION'] ||
      matchedRow.FACEBOOK_DESCRIPTION ||
      matchedRow.FB_DESCRIPTION ||
      matchedRow.facebook_description ||
      matchedRow.fb_description,
  };
}

function App() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const blogImageUrl = useMemo(() => data?.blog_image ?? '', [data?.blog_image]);

  const instaImageUrl = useMemo(
    () => data?.insta_image ?? '',
    [data?.insta_image]
  );

  const facebookImageUrl = useMemo(
    () => data?.facebook_image ?? '',
    [data?.facebook_image]
  );

  const title = useMemo(
    () => data?.title?.trim() || 'Untitled',
    [data?.title]
  );

  const shortDescription = useMemo(
    () => data?.short_description?.trim() || '',
    [data?.short_description]
  );

  const longDescription = useMemo(
    () => data?.long_description?.trim() || '',
    [data?.long_description]
  );

  const instagramDescription = useMemo(
    () => data?.instagram_description?.trim() || '',
    [data?.instagram_description]
  );

  const facebookDescription = useMemo(
    () => data?.facebook_description?.trim() || '',
    [data?.facebook_description]
  );

  useEffect(() => {
    async function loadData() {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (!id) {
          setError('Missing content id in URL.');
          setLoading(false);
          return;
        }

        const result = await fetchContentById(id);

        if (!result) {
          setError('Content not found.');
          setLoading(false);
          return;
        }

        setData(result);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Unable to load content.');
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <main className="screen">
        <p className="status">Loading...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="screen">
        <p className="status">{error || 'No data found.'}</p>
      </main>
    );
  }

  return (
    <main className="screen">
      <article className="content-card">
        {/* Blog Section */}
        {blogImageUrl ? (
          <>
            <p className="section-title">Blog Image</p>
            <SmartImage src={blogImageUrl} alt={title} />
          </>
        ) : null}

        <section className="content-text">
          <h1 className="content-title">{title}</h1>

          {shortDescription ? (
            <p className="content-description">
              <b>Short Description:</b> {shortDescription}
            </p>
          ) : null}

          {longDescription ? (
            <p className="content-description">
              <b>Long Description:</b> {longDescription}
            </p>
          ) : null}
        </section>

        {/* Instagram Section */}
        {instaImageUrl || instagramDescription ? (
          <>
            <div className="divider" />

            {instaImageUrl ? (
              <>
                <p className="section-title">Instagram Image</p>
                <SmartImage src={instaImageUrl} alt={title} />
              </>
            ) : null}

            <section className="content-text">
              <h2 className="content-title">{title}</h2>

              {instagramDescription ? (
                <p className="content-description">
                  <b>Instagram Description:</b> {instagramDescription}
                </p>
              ) : null}
            </section>
          </>
        ) : null}

        {/* Facebook Section */}
        {facebookImageUrl || facebookDescription ? (
          <>
            <div className="divider" />

            {facebookImageUrl ? (
              <>
                <p className="section-title">Facebook Image</p>
                <SmartImage src={facebookImageUrl} alt={title} />
              </>
            ) : null}

            <section className="content-text">
              <h2 className="content-title">{title}</h2>

              {facebookDescription ? (
                <p className="content-description">
                  <b>Facebook Description:</b> {facebookDescription}
                </p>
              ) : null}
            </section>
          </>
        ) : null}
      </article>
    </main>
  );
}

export default App;