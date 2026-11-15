/** Keep real hrefs for opening new tabs and use the app router for ordinary clicks. */
export default function RouteLink({ href, onNavigate, children, ...props }) {
  return <a {...props} href={href} onClick={event => {
    if (onNavigate && !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
      event.preventDefault(); onNavigate(href);
    }
  }}>{children}</a>;
}
