/**
 * Marketing edition — no sidebar tree. `navGroups` is kept as an empty array
 * (not deleted) because `build/layout.js` imports it unconditionally and
 * `navHrefs`'s top-level `flatMap` runs at module-load time even for the
 * `marketing` layout this edition actually uses. See `marketingNav` below for
 * the real navigation source of truth.
 *
 * @typedef {{ title: string, href?: string, icon?: string, badge?: string, children?: NavItem[] }} NavItem
 * @typedef {{ label: string, items: NavItem[] }} NavGroup
 */

/** @type {NavGroup[]} */
export const navGroups = [];

/** Every navigable href in the tree — used to resolve one active item per page. */
export const navHrefs = navGroups.flatMap((g) =>
  g.items.flatMap((item) => [
    ...(item.href ? [item.href] : []),
    ...(item.children ?? []).map((c) => c.href).filter(Boolean),
  ]),
);

/**
 * Marketing-shell navigation — header links and footer link columns.
 * Consumed at BUILD time by `build/layout.js`'s `marketing` layout.
 *
 * Reference: the reference edition's `content/pages.ts` `nav`/`footer`
 * exports. The reference's header nav includes two items ("Pages", "Shop")
 * whose target is a dropdown of routes this single-page marketing edition
 * doesn't materialise — both are re-pointed at the nearest real anchor
 * (`Pages` -> `/#about`, `Shop` -> `/#services`) rather than dropped, so every
 * reference nav label still appears and resolves to real content.
 *
 * @typedef {{ title: string, href: string }} NavLink
 * @type {{ header: NavLink[], footer: { label: string, links: NavLink[] }[] }}
 */
export const marketingNav = {
  header: [
    {
      title: "Home",
      href: "/"
    },
    {
      title: "Pages",
      href: "/#about"
    },
    {
      title: "Services",
      href: "/#services"
    },
    {
      title: "Shop",
      href: "/#services"
    },
    {
      title: "Blog",
      href: "https://asoc-reach-landing-html.vercel.app/#blog"
    },
    {
      title: "Contacts",
      href: "https://asoc-reach-landing-html.vercel.app/#footer"
    }
  ],
  footer: [
    {
      label: "Company",
      links: [
        {
          title: "About",
          href: "/#about"
        },
        {
          title: "Expertise",
          href: "/#services"
        },
        {
          title: "News & Media",
          href: "https://asoc-reach-landing-html.vercel.app/#blog"
        },
        {
          title: "Team",
          href: "https://asoc-reach-landing-html.vercel.app/#team"
        },
        {
          title: "Contacts",
          href: "https://asoc-reach-landing-html.vercel.app/#footer"
        }
      ]
    }
  ]
};
