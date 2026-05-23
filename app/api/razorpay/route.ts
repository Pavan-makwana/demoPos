import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", receipt = "receipt#1" } = body;

    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_yourkey",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "your_secret",
    });

    const options = {
      amount: Math.round(amount * 100), // amount in smallest currency unit
      currency,
      receipt,
    };

    const order = await instance.orders.create(options);
    return NextResponse.json(order);
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
