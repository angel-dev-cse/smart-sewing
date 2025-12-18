export const PAYMENT_INSTRUCTIONS = {
  BKASH: {
    title: "bKash Payment",
    lines: [
      "Send money to: 01XXXXXXXXX",
      "Account type: Personal",
      "After payment, enter the bKash Transaction ID below.",
    ],
  },
  NAGAD: {
    title: "Nagad Payment",
    lines: [
      "Send money to: 01XXXXXXXXX",
      "Account type: Personal",
      "After payment, enter the Nagad Transaction ID below.",
    ],
  },
  BANK_TRANSFER: {
    title: "Bank Transfer",
    lines: [
      "Bank: Example Bank Ltd.",
      "Account Name: Smart Sewing Solutions",
      "Account Number: 123456789",
      "Branch: Chittagong",
      "After transfer, enter the reference below.",
    ],
  },
} as const;