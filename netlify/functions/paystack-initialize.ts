/**
 * Netlify Function: Paystack Transaction Initialization
 * Endpoint: /.netlify/functions/paystack-initialize
 * 
 * Securely initializes a Paystack payment session using the server-side PAYSTACK_SECRET_KEY.
 * The secret key is never exposed to the client.
 */

interface PaystackInitRequest {
  email: string;
  amount: number; // in normal currency units (e.g. 500.00)
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  callbackUrl?: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export const handler = async (event: any) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ status: false, message: 'Method Not Allowed. Use POST.' }),
    };
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey.trim() === '') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: false,
        error: 'PAYSTACK_SECRET_KEY_NOT_CONFIGURED',
        message:
          'PAYSTACK_SECRET_KEY is not configured on the server. Please add PAYSTACK_SECRET_KEY to your Netlify site environment variables (Site configuration → Environment variables) or .env file.',
      }),
    };
  }

  try {
    let bodyData: PaystackInitRequest;
    try {
      bodyData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: false, message: 'Invalid JSON request body.' }),
      };
    }

    const { email, amount, orderId, customerName, customerPhone, callbackUrl, items } = bodyData;

    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: false, message: 'Invalid order amount.' }),
      };
    }

    // Paystack amounts are in the subunit of the currency (kobo, cents: amount * 100)
    const amountInSubunit = Math.round(Number(amount) * 100);

    // Fallback email format if customer did not provide one
    const customerEmail =
      email && email.includes('@')
        ? email.trim()
        : `customer_${orderId || Date.now()}@zygadgetstore.com`;

    const reference = orderId || `zy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const paystackPayload: Record<string, any> = {
      email: customerEmail,
      amount: amountInSubunit,
      reference,
      metadata: {
        orderId,
        customerName: customerName || 'Valued Customer',
        customerPhone: customerPhone || 'N/A',
        storeName: 'ZY GADGET STORE',
        itemsSummary: items?.map((i) => `${i.name} (x${i.quantity})`).join(', ') || 'Gadgets & Electronics',
        custom_fields: [
          {
            display_name: 'Order Reference',
            variable_name: 'order_reference',
            value: reference,
          },
          {
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: customerName || 'N/A',
          },
        ],
      },
    };

    if (callbackUrl) {
      paystackPayload.callback_url = callbackUrl;
    }

    // Call official Paystack API
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return {
        statusCode: response.status || 400,
        headers,
        body: JSON.stringify({
          status: false,
          message: data.message || 'Paystack initialization failed.',
          details: data,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: true,
        message: 'Payment initialized successfully',
        data: {
          authorization_url: data.data.authorization_url,
          access_code: data.data.access_code,
          reference: data.data.reference || reference,
        },
      }),
    };
  } catch (error: any) {
    console.error('Error initializing Paystack transaction:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: false,
        message: error.message || 'Internal server error while initializing Paystack payment.',
      }),
    };
  }
};
