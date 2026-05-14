import { useEffect, useMemo, useState } from 'react';
import './App.css';

type PageData = {
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

const ASSET =
  'https://www.shipbymail.com/blog/wp-content/themes/SBM-Blog/images';

function parseCSV(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"' && next === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (value || row.length) {
        row.push(value.trim());
        rows.push(row);
        row = [];
        value = '';
      }
      if (char === '\r' && next === '\n') i++;
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value.trim());
    rows.push(row);
  }

  const headers = rows[0] || [];

  return rows.slice(1).map((r) => {
    const item: Record<string, string> = {};
    headers.forEach((h, i) => {
      item[h.trim()] = r[i]?.trim() || '';
    });
    return item;
  });
}

function extractDriveFileId(value?: string) {
  if (!value) return '';
  const text = value.trim();

  if (!text.includes('http') && !text.includes('id=')) return text;

  return (
    text.match(/[?&]id=([^&]+)/)?.[1] ||
    text.match(/\/d\/([^/?]+)/)?.[1] ||
    ''
  );
}

function normalizeImageUrl(value?: string) {
  if (!value) return '';
  const text = value.trim();
  const id = extractDriveFileId(text);
  return id ? `https://lh3.googleusercontent.com/d/${id}` : text;
}

function buildImageCandidates(url?: string) {
  const base = String(url || '').trim();
  if (!base) return [];

  const id = extractDriveFileId(base);

  if (!id) {
    return [
      base,
      `https://images.weserv.nl/?url=${encodeURIComponent(
        base.replace(/^https?:\/\//, '')
      )}`,
    ];
  }

  return [
    `https://lh3.googleusercontent.com/d/${id}=s0`,
    `https://drive.google.com/uc?export=view&id=${id}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w2000`,
    base,
  ];
}

function SmartImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const candidates = useMemo(() => buildImageCandidates(src), [src]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [src]);

  return (
    <img
      className={className}
      src={candidates[index] || src}
      alt={alt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => {
        if (index < candidates.length - 1) setIndex((prev) => prev + 1);
      }}
    />
  );
}

async function fetchContentById(contentId: string): Promise<PageData | null> {
  const response = await fetch(SHEET_CSV_URL);
  const csvText = await response.text();
  const rows = parseCSV(csvText);

  const matchedRow = rows.find((row) => {
    const id =
      row.CONTENTID ||
      row.content_id ||
      row.CONTENT_ID ||
      row['CONTENT ID'];

    return String(id || '').trim() === contentId.trim();
  });

  if (!matchedRow) return null;

  return {
    title: matchedRow.TITLE || matchedRow.title,

    blog_image: normalizeImageUrl(
      matchedRow.BLOG_IMAGE ||
      matchedRow['BLOG IMAGE'] ||
      matchedRow['BLOG IMAGE URL']
    ),

    insta_image: normalizeImageUrl(
      matchedRow.INSTRAGRAM_IMAGE ||
      matchedRow['INSTRAGRAM IMAGE'] ||
      matchedRow.INSTA_IMAGE ||
      matchedRow['INSTA IMAGE URL']
    ),

    facebook_image: normalizeImageUrl(
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

function Header() {
  return (
    <>
      <header className="siteHeader">
        <div className="container headerInner">
          <div className="logoWrap">
            <img src={`${ASSET}/ship_logo.png`} alt="ShipByMail" />
            <img src={`${ASSET}/bbb-logo.webp`} alt="BBB" className="bbbLogo" />
          </div>

          <nav className="mainMenu">
            <a>HOW IT WORKS</a>
            <a>PRICING</a>
            <a>SUPPORT</a>

            <div className="accountBox">
              <a className="loginBtn">LOGIN</a>
              <a className="createBtn">CREATE ACCOUNT</a>
            </div>
          </nav>
        </div>
      </header>

      <section className="flagSection">
        <div className="container flagInfo">
          <a>
            <label>Shop and Ship</label>
            <img src={`${ASSET}/usFlag.png`} alt="US Flag" />
          </a>

          <a>
            <label>Shop and Ship</label>
            <img src={`${ASSET}/caFlag.png`} alt="CA Flag" />
          </a>

          <a>
            <label>Shop and Ship</label>
            <img src={`${ASSET}/mxFlag.png`} alt="MX Flag" />
          </a>
        </div>
      </section>
    </>
  );
}

// function SidebarItem({ title, img }: { title: string; img: string }) {
//   return (
//     <div className="featuredItem">
//       <a>
//         <div className="featuredThumb">
//           <img src={img} alt="" />
//         </div>
//         <h4>{title}</h4>
//       </a>
//     </div>
//   );
// }

// function Sidebar() {
//   return (
//     <aside className="rightSideBar">
//       <div className="sidebarSearch">
//         <input type="text" />
//         <button>Search</button>
//       </div>

//       <div className="featuredArticle">
//         <h2>FEATURED ARTICLES</h2>

//         <SidebarItem
//           title="Shipping from Canada to Cyprus: Costs & Duties"
//           img="https://www.shipbymail.com/blog/wp-content/uploads/2023/08/cyprus-Marina-.jpg-e1772731813947.webp"
//         />

//         <SidebarItem
//           title="Ship to South Korea"
//           img="https://www.shipbymail.com/blog/wp-content/uploads/2022/12/business-gf-e1772732939267-1.jpg"
//         />

//         <SidebarItem
//           title="Shipping to Panama: Duties, Costs, and Transit Times"
//           img="https://www.shipbymail.com/blog/wp-content/uploads/2018/12/Panama.jpg"
//         />

//         <SidebarItem
//           title="Ship To USA"
//           img="https://www.shipbymail.com/blog/wp-content/uploads/2018/11/new-york-city-1.jpg"
//         />
//       </div>
//     </aside>
//   );
// }

function InstagramPreview({ data }: { data: PageData }) {
  if (!data.insta_image && !data.instagram_description) return null;

  const menuItems = [
    { icon: '⌂', label: 'Home', active: true },
    { icon: '▻', label: 'Reels' },
    { icon: '✈', label: 'Messages' },
    { icon: '⌕', label: 'Search' },
    { icon: '⊙', label: 'Explore' },
    { icon: '♡', label: 'Notifications' },
    { icon: '＋', label: 'Create' },
    { icon: '▣', label: 'Dashboard' },
    { icon: '◉', label: 'Profile' },
    { icon: '☰', label: 'More' },
    { icon: '▦', label: 'Also from Meta' },
  ];

  return (
    <section className="instagramFullPagePreview">
      {/* <h2>Instagram Preview</h2> */}

      <div className="instagramFullShell">
        <aside className="igLeftNav">
          <div className="igLogoIcon">◎</div>

          <nav className="igSideMenu">
            {menuItems.map((item) => (
              <div
                key={item.label}
                className={`igMenuItem ${item.active ? 'active' : ''}`}
              >
                <span className="igMenuIcon">{item.icon}</span>
                <span className="igMenuLabel">{item.label}</span>
              </div>
            ))}
          </nav>
        </aside>

        <main className="igMainFeed">
          <article className="igPost">
            <div className="igPostHeader">
              <div className="igAvatarRing">
                <img src={`${ASSET}/ship_logo.png`} alt="ShipByMail" />
              </div>

              <div className="igAccountInfo">
                <strong>shipbymail</strong>
                {/* <span>14 h</span> */}
              </div>

              <button className="igFollowBtn">Follow</button>
              <button className="igMoreBtn">•••</button>
            </div>

            {data.insta_image && (
              <SmartImage
                src={data.insta_image}
                alt={data.title || ''}
                className="igPostImage"
              />
            )}

            <div className="igActionRow">
              <span>♡</span>
              <span>💬</span>
              <span>↗</span>
              <span className="igSave">⌑</span>
            </div>

            <div className="igLikes">75.1K likes</div>

            <p className="igCaption">
              <strong>shipbymail</strong>{' '}
              <div>{ data.title}</div>
              {data.instagram_description || data.title}
            </p>
          </article>
        </main>

        <aside className="igRightPanel">
          <div className="igProfileRow">
            <div className="igProfileAvatar">
              <img src={`${ASSET}/ship_logo.png`} alt="ShipByMail" />
            </div>

            <div>
              <strong>shipbymail</strong>
              <span>ShipByMail</span>
            </div>

            <a>Switch</a>
          </div>

          <div className="igSuggestHead">
            <strong>Suggested for you</strong>
            <a>See all</a>
          </div>

          {[
            'Ship from Canada',
            'Global Shipping',
            'Parcel Forwarding',
            'Courier Services',
            'Shop and Ship',
          ].map((name) => (
            <div className="igSuggestRow" key={name}>
              <div className="igSuggestAvatar">
                <img src={`${ASSET}/ship_logo.png`} alt="" />
              </div>

              <div>
                <strong>{name}</strong>
                <span>Suggested for you</span>
              </div>

              <a>Follow</a>
            </div>
          ))}

          <div className="igFooter">
            About · Help · Press · API · Jobs · Privacy · Terms · Locations ·
            Language · Meta Verified
            <br />
            <br />© 2026 INSTAGRAM FROM META
          </div>
        </aside>
      </div>
    </section>
  );
}

function FacebookPreview({ data }: { data: PageData }) {
  if (!data.facebook_image && !data.facebook_description) return null;

  return (
    <section className="facebookFullPagePreview">
      {/* <h2>Facebook Preview</h2> */}

      <div className="facebookFullShell">
        <aside className="fbFullLeftPanel">
          <div className="fbFullTopSearch">
            <div className="fbFullLogo">f</div>
            <div className="fbFullSearch">Search Facebook</div>
          </div>

          <h3>Manage Page</h3>

          <div className="fbFullPageRow">
            <img src={`${ASSET}/ship_logo.png`} alt="ShipByMail" />
            <strong>Shipbymail</strong>
            <span>⌄</span>
          </div>

          <div className="fbFullMenu">
            <span>Professional dashboard</span>
            <span>Insights</span>
            <span>Ad Center</span>
            <span>Create ads</span>
            <span>Boost Instagram post</span>
            <span>Settings</span>
            <span>Meta Verified</span>
            <span>Leads Center</span>
            <span>Meta Business Suite</span>
            <span>Manus AI</span>
          </div>
        </aside>

        <main className="fbFullMain">
          {/* <div className="fbFullTopNav">
            <span>⌂</span>
            <span>👥</span>
            <span>▣</span>
            <span>🏪</span>
            <span>◎</span>
          </div> */}

          <div className="fbFullPageHeader">
            <div>
              <img src={`${ASSET}/ship_logo.png`} alt="ShipByMail" />
              <strong>Shipbymail</strong>
            </div>
            <button>•••</button>
          </div>

          <div className="fbFullBody">
            <aside className="fbFullInfoCol">
              <div className="fbFullCard">
                <h3>Details</h3>
                <p>🕘 Closed now</p>
                <p>📍 3130-580 Seaborne Avenue, Port Coquitlam, BC, Canada, V3B 0M3</p>

                <h3>Links</h3>
                <p>🔗 shipbymail.com</p>

                <h3>Contact info</h3>
                <p>☎ +1 778-727-1427</p>
                <p>✉ support@shipbymail.com</p>
                <p>💬 Shipbymail</p>
              </div>

              <div className="fbFullCard">
                <div className="fbFullPhotosHead">
                  <h3>Photos</h3>
                  <a>See all photos</a>
                </div>

                <div className="fbFullPhotoGrid">
                  {[
                    `${ASSET}/ship_logo.png`,
                    data.facebook_image || data.blog_image || '',
                    data.insta_image || data.blog_image || '',
                    data.blog_image || '',
                    data.facebook_image || '',
                    data.insta_image || '',
                    data.blog_image || '',
                    data.facebook_image || '',
                    data.insta_image || '',
                  ].map((img, index) =>
                    img ? (
                      <SmartImage
                        key={index}
                        src={img}
                        alt=""
                        className="fbFullPhotoThumb"
                      />
                    ) : null
                  )}
                </div>
              </div>
            </aside>

            <section className="fbFullFeedCol">
              <article className="fbFullPost">
                <div className="fbFullPostHeader">
                  <img src={`${ASSET}/ship_logo.png`} alt="ShipByMail" />

                  <div>
                    <strong>Shipbymail</strong>
                    <span>Just now · 🌐</span>
                  </div>

                  <button>•••</button>
                </div>
                {data.title && (
                  <p className="fbFullPostText">{data.title}</p>
                )}
                {data.facebook_description && (
                  <p className="fbFullPostText">{data.facebook_description}</p>
                )}

                {data.facebook_image && (
                  <div className="fbFullPostImageWrap">
                    <SmartImage
                      src={data.facebook_image}
                      alt={data.title || ''}
                      className="fbFullPostImage"
                    />
                  </div>
                )}

                <div className="fbFullStats">
                  <span>👍😮 7</span>
                  <span>2 comments · 209 views</span>
                </div>

                <div className="fbFullActions">
                  <span>👍 Like</span>
                  <span>💬 Comment</span>
                  <span>↗ Share</span>
                </div>
              </article>
            </section>
          </div>
        </main>
      </div>
    </section>
  );
}

function App() {
  const [data, setData] = useState<PageData | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (id) fetchContentById(id).then(setData);
  }, []);

  if (!data) return <div className="status">Loading...</div>;

  return (
    <main>
      <Header />

      <section className="blogPostList">
        <div className="container">
          <h1 className="pageTitle">Latest Blog Posts</h1>

          <div className="contentGrid">
            <div className="leftCol">
              <article className="postInfoUpr">
                {data.blog_image && (
                  <div className="postfeatureImg">
                    <SmartImage
                      src={data.blog_image}
                      alt={data.title || ''}
                      className="blogImage"
                    />

                    <button className="imageZoomTrigger">
                      <img src={`${ASSET}/searchIcon.png`} alt="Zoom" />
                    </button>
                  </div>
                )}

                <div className="postInfo">
                  <div className="postTitle">
                    <a>{data.title}</a>
                  </div>

                  {data.short_description && (
                    <div className="postContent">
                      <p>{data.short_description}</p>
                    </div>
                  )}

                  <div className="authorInfo">
                    <img
                      src={`${ASSET}/person.png`}
                      alt="Author"
                      className="authorIcon"
                    />
                    <span>By</span>
                    <a>Ship By Mail</a>
                    {/* <span>On</span> */}
                    {/* <span>November25 16, 20</span> */}
                  </div>

                  {data.page_url && (
                    <div className="postReadMore">
                      <a
                        href={data.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Read more...
                      </a>
                    </div>
                  )}
                </div>
              </article>

              <InstagramPreview data={data} />
              <FacebookPreview data={data} />
            </div>

            {/* <Sidebar /> */}
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;