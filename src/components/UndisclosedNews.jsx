import { useState } from "react";
import { UNDISCLOSED_NEWS } from "../data/undisclosedNews";

/**
 * Industry / regulatory notes — Undisclosed only (not WellPept Renew).
 */
export default function UndisclosedNews() {
  const [openId, setOpenId] = useState(UNDISCLOSED_NEWS[0]?.id || null);

  if (!UNDISCLOSED_NEWS.length) return null;

  return (
    <section className="section ud-news-section" id="ud-news">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="section-kicker">Lab desk</p>
            <h2>Industry notes</h2>
            <p>
              Regulatory and market context for research teams. Not medical
              advice. Not FDA approval of any compound for human use.
            </p>
          </div>
        </div>

        <div className="ud-news-list">
          {UNDISCLOSED_NEWS.map((item) => {
            const open = openId === item.id;
            return (
              <article
                key={item.id}
                className={`ud-news-card${open ? " is-open" : ""}`}
              >
                <button
                  type="button"
                  className="ud-news-card-head"
                  onClick={() => setOpenId(open ? null : item.id)}
                  aria-expanded={open}
                >
                  <div>
                    <p className="ud-news-kicker">
                      {item.kicker} · {item.dateLabel}
                    </p>
                    <h3>{item.title}</h3>
                    <p className="ud-news-summary">{item.summary}</p>
                  </div>
                  <span className="ud-news-toggle" aria-hidden="true">
                    {open ? "−" : "+"}
                  </span>
                </button>

                {open ? (
                  <div className="ud-news-card-body">
                    {item.body?.map((p) => (
                      <p key={p.slice(0, 48)}>{p}</p>
                    ))}
                    {item.votes?.length ? (
                      <ul className="ud-news-votes">
                        {item.votes.map((v) => (
                          <li
                            key={v.name}
                            className={
                              v.result === "pass"
                                ? "ud-news-vote--pass"
                                : "ud-news-vote--fail"
                            }
                          >
                            <strong>{v.name}</strong>
                            <span>{v.detail}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {item.links?.length ? (
                      <p className="ud-news-links meta">
                        Sources:{" "}
                        {item.links.map((link, i) => (
                          <span key={link.href}>
                            {i > 0 ? " · " : null}
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {link.label}
                            </a>
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
