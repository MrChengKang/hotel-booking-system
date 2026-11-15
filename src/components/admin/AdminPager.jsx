export default function AdminPager({ data, page, onPage }) {
  return data && data.totalPages > 1 && <div className="live-pagination"><button className="outline-button" disabled={page === 0} onClick={() => onPage(page - 1)}>Previous page</button><span>Page {page + 1} / {data.totalPages}</span><button className="outline-button" disabled={page + 1 >= data.totalPages} onClick={() => onPage(page + 1)}>Next page</button></div>;
}
