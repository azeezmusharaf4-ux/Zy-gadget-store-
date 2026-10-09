/**
 * Netlify Function: Paystack Transaction Verification
 * Endpoint: /.netlify/functions/paystack-verify
 * 
 * Securely verifies payment status with the official Paystack Verification API
 * using the server-side PAYSTACK_SECRET_KEY.
 */

export const handler = async (event: any) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
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

  let reference: string | undefined;

  if (event.httpMethod === 'GET') {
    reference = event.queryStringParameters?.reference;
  } else if (event.httpMethod === 'POST') {
    try {
      const parsed = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      reference = parsed?.reference;
    } catch {
      reference = undefined;
    }
  }

  if (!reference || reference.trim() === '') {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        status: false,
        message: 'Transaction reference is required for verification.',
      }),
    };
  }

  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference.trim())}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey.trim()}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return {
        statusCode: response.status || 400,
        headers,
        body: JSON.stringify({
          status: false,
          message: data.message || 'Payment verification failed.',
          details: data,
        }),
      };
    }

    const paystackData = data.data;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: true,
        verified: paystackData.status === 'success',
        message: data.message || 'Verification complete',
        data: {
          status: paystackData.status, // 'success' | 'failed' | 'abandoned'
          reference: paystackData.reference,
          amount: paystackData.amount ? paystackData.amount / 100 : 0,
          currency: paystackData.currency,
          paidAt: paystackData.paid_at,
          createdAt: paystackData.created_at,
          channel: paystackData.channel, // 'card', 'bank', 'ussd', etc.
          gatewayResponse: paystackData.gateway_response,
          ipAddress: paystackData.ip_address,
          customer: paystackData.customer
            ? {
                email: paystackData.customer.email,
                phone: paystackData.customer.phone,
                name: `${paystackData.customer.first_name || ''} ${paystackData.customer.last_name || ''}`.trim(),
              }
            : undefined,
          metadata: paystackData.metadata,
        },
      }),
    };
  } catch (error: any) {
    console.error('Error verifying Paystack transaction:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: false,
        message: error.message || 'Internal server error while verifying Paystack payment.',
      }),
    };
  }
};
