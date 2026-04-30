import { useMemo } from 'react';

type PageData = {
  title?: string;
  image?: string;
  imageUrl?: string;
  description?: string;
};

type AppProps = {
  data: PageData | null;
};

function App({ data }: AppProps) {
  const imageUrl = useMemo(() => data?.imageUrl ?? data?.image ?? '', [data]);
  const title = useMemo(() => data?.title?.trim() || 'Untitled', [data?.title]);
  const description = useMemo(
    () => data?.description?.trim() ?? '',
    [data?.description]
  );

  if (!data) {
    return (
      <main className="screen">
        <p className="status">
          Add query parameters to the URL: <code>image</code>, <code>title</code>, and{' '}
          <code>description</code>. Example:{' '}
          <code>
            ?title=Hello&amp;description=World&amp;image=https%3A%2F%2Fexample.com%2Fphoto.jpg
          </code>
        </p>
      </main>
    );
  }

  return (
    <main className="screen">
      <article className="content-card">
        {imageUrl ? <img className="hero-image" src={imageUrl} alt={title} /> : null}
        <section className="content-text">
          <h1 className="content-title">{title}</h1>
          {description ? (
            <p className="content-description">{description}</p>
          ) : (
            <p className="content-description">No description.</p>
          )}
        </section>
      </article>
    </main>
  );
}

export default App;
