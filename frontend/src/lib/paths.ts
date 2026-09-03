export const paths = {
  customer: (id: string) => `/customers/detail?id=${encodeURIComponent(id)}`,
  customerEdit: (id: string) => `/customers/edit?id=${encodeURIComponent(id)}`,
  invoice: (id: string) => `/billing/detail?id=${encodeURIComponent(id)}`,
  invoiceEdit: (id: string) => `/billing/edit?id=${encodeURIComponent(id)}`,
  ticket: (id: string) => `/support/detail?id=${encodeURIComponent(id)}`,
  ticketEdit: (id: string) => `/support/edit?id=${encodeURIComponent(id)}`,
  email: (id: string) => `/emails/detail?id=${encodeURIComponent(id)}`,
  emailEdit: (id: string) => `/emails/edit?id=${encodeURIComponent(id)}`,
};
