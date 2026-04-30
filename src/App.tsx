import { useEffect, useMemo, useState } from 'react';

type PageData = {
  content_id?: string;
  title?: string;
  blog_image?: string;
  insta_image?: string;
  short_description?: string;
  long_description?: string;
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

    title:
      matchedRow.TITLE ||
      matchedRow.title,

    short_description:
      matchedRow['BLOG SHORT DESCRIPTION'] ||
      matchedRow['BLOG SHORT D'] ||
      matchedRow.short_description,

    long_description:
      matchedRow['BLOG LONG DESCRIPTION'] ||
      matchedRow['BLOG LONG DE'] ||
      matchedRow.long_description,

    blog_image:
      getGoogleDriveImageUrl(
    matchedRow.BLOG_IMAGE ||
    matchedRow.blog_image
  ), 

    insta_image:
      getGoogleDriveImageUrl(
    matchedRow.INSTRAGRAM_IMAGE ||
    matchedRow.INSTA_IMAGE ||
    matchedRow.insta_image
  ),
  };
}

function App() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const imageUrl = useMemo(() => data?.blog_image ?? '', [data?.blog_image]);
  const instaImageUrl = useMemo(() => data?.insta_image ?? '', [data?.insta_image]);

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
        {imageUrl ? (
          <>
            <p className="section-title">Blog Image</p>
            <img className="hero-image" src={imageUrl} alt={title} />
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

        {instaImageUrl ? (
          <>
            <div className="divider" />
            <p className="section-title">Instagram Image</p>
            <img className="hero-image" src={instaImageUrl} alt={title} />
          </>
        ) : null}
      </article>
    </main>
  );
}

export default App;