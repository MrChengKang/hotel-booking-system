// Footer destinations correspond to working routes or local help dialogs.
export function getFooterGroups(role) {
  const workspace = role === "host"
    ? { label: "Host Dashboard", href: "/host" }
    : role === "admin"
      ? { label: "Admin Dashboard", href: "/admin" }
      : { label: "Your bookings", href: "/bookings" };
  return [
    { title: "Explore", links: [
      { label: "Find a hotel", href: "/hotels" },
      { label: "Popular destinations", href: "/#destinations" },
      { label: "Featured hotels", href: "/#featured-stays-title" },
    ] },
    { title: "Your stay", links: [workspace,
      { label: "Saved hotels", href: "/wishlist" },
      { label: "Your account", href: "/account" },
      { label: "Notifications", href: "/notifications" },
    ] },
    { title: "Help & hosting", links: [
      { label: "Booking support", topic: "booking" },
      { label: "Cancellation policy", topic: "cancellation" },
      role === "host" ? { label: "Manage your hotels", href: "/host/hotels" }
        : role === "admin" ? { label: "Hotel review", href: "/admin/hotels" }
          : { label: "For hotel hosts", topic: "hosting" },
    ] },
  ];
}

export const footerHelp = {
  booking: {
    title: "Booking support",
    sections: [
      ["Find a room", "Search by city, then choose your dates and guests to check room availability and prices."],
      ["Manage a booking", "Open Your bookings to see your reservation, payment status and available cancellation options."],
    ],
  },
  cancellation: {
    title: "Cancellation policy",
    sections: [
      ["Check your booking first", "Cancellation options, deadlines and any refund amount are shown in your booking details."],
      ["Follow your refund", "Your booking details show the latest refund status. A pending refund may still keep your rooms reserved."],
    ],
  },
  hosting: {
    title: "For hotel hosts",
    sections: [
      ["One account, multiple hotels", "A Hotel Host account can manage multiple hotels, room types, photos and nightly availability."],
      ["Ready to welcome guests", "Create a Hotel Host account, prepare your hotel and submit it for platform review before publication."],
    ],
  },
};
