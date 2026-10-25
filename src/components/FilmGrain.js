// Fine, flickering film grain and faint CRT scanlines over the whole page.
export default function FilmGrain() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      <div className="film-grain" />
      <div className="crt-scanlines" />
    </div>
  );
}
