const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export const formatOrderAmount = (amount: number) => currency.format(amount);
