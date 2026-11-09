const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export const formatINR = (amount: number) => inr.format(amount);
