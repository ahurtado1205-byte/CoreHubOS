import crypto from 'crypto';

interface SignatureVerificationResult {
  isValid: boolean;
  timestamp?: number;
  reason?: string;
}

/**
 * Verifies a webhook signature using HMAC-SHA256.
 * Supports standard format like:
 * - Stripe: t=timestamp,v1=signature
 * - MercadoPago / General: ts=timestamp,v1=signature or ts=timestamp;v1=signature
 * - Custom header: x-signature / x-webhook-signature
 * 
 * @param rawBody The raw request body as string.
 * @param signatureHeader The signature header value.
 * @param secret The webhook shared secret.
 * @param maxDriftSeconds Maximum allowed drift in seconds (default: 300 seconds / 5 minutes).
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
  maxDriftSeconds: number = 300
): SignatureVerificationResult {
  if (!signatureHeader) {
    return { isValid: false, reason: 'Missing signature header' };
  }

  if (!secret) {
    return { isValid: false, reason: 'Webhook secret is not configured' };
  }

  try {
    let timestampStr = '';
    let hashStr = '';

    // 1. Parse header formats
    // Format A: t=123456,v1=abc... or ts=123456,v1=abc...
    // Format B: ts=123456;v1=abc...
    if (signatureHeader.includes('v1=')) {
      const parts = signatureHeader.split(/[;,]/);
      for (const part of parts) {
        const [key, val] = part.trim().split('=');
        if (key === 't' || key === 'ts') {
          timestampStr = val;
        } else if (key === 'v1') {
          hashStr = val;
        }
      }
    } else {
      // Direct hash signature (e.g. raw signature hex)
      hashStr = signatureHeader;
    }

    // 2. Timestamp verification if present
    let timestamp: number | undefined;
    if (timestampStr) {
      timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp)) {
        return { isValid: false, reason: 'Invalid timestamp format in header' };
      }

      // Check drift
      const now = Math.floor(Date.now() / 1000);
      const diff = Math.abs(now - timestamp);
      if (diff > maxDriftSeconds) {
        return { 
          isValid: false, 
          timestamp, 
          reason: `Timestamp drift too large (${diff}s > ${maxDriftSeconds}s)` 
        };
      }
    }

    // 3. Compute expected signature
    let expectedSignature: string;
    if (timestampStr) {
      // Signed payload contains timestamp + '.' + rawBody (similar to Stripe specification)
      const signedPayload = `${timestampStr}.${rawBody}`;
      expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');
    } else {
      // Direct rawBody signature
      expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
    }

    // Timing-safe comparison to prevent timing attacks
    const bufferExpected = Buffer.from(expectedSignature, 'hex');
    const bufferActual = Buffer.from(hashStr, 'hex');

    if (bufferExpected.length !== bufferActual.length) {
      return { isValid: false, timestamp, reason: 'Signature length mismatch' };
    }

    const isValid = crypto.timingSafeEqual(bufferExpected, bufferActual);
    return {
      isValid,
      timestamp,
      reason: isValid ? undefined : 'Signature verification failed (hash mismatch)'
    };
  } catch (error: any) {
    return { isValid: false, reason: `Error during validation: ${error.message}` };
  }
}
