# QuickPrint — Payment Integration README

Direct, production-ready guidance for backend engineers integrating payments for QuickPrint.

---

## 1. High-Level Payment Flow

1. Operator opens Settings → Account Details → Payments & Billing in the existing frontend.
2. Frontend emits standardized events or opens a provider checkout/modal (UI-only). Frontend does NOT perform tokenization.
3. User completes payment in provider UI (redirect/hosted field/USSD etc.).
4. Provider sends webhook to your backend with transaction outcome.
5. Backend verifies webhook signature and payload, records the attempt, updates subscription/payment state, and emits an application-level event or pushes a client notification.
6. Backend should also cause the frontend to receive a client-side confirmation (via websocket, push, or by instructing the client to dispatch a CustomEvent) so the `PaymentTimer` and subscription UI update.

Key constraints:
- Frontend is UI-only and must not be modified for business logic.
- All final attribution of payment success/failure is the backend's responsibility.

---

## 2. Supported Payment Providers

- Card payments: Visa / Debit (standard card rails)
- Global Payment Gateway: Generic provider-agnostic integration (Adyen/Stripe/Paygate, etc.)
- Safaricom M-PESA: STK push and other M-PESA flows

What is abstracted vs provider-specific:
- Abstracted (backend must implement): payment attempt lifecycle, idempotent processing, event emission, persistence.
- Provider-specific: webhook signature formats, field names, tokenization SDKs, and any provider SDKs for server-to-server calls.

---

## 3. Required Backend Responsibilities

- NEVER persist raw card PAN/CVV/CVC anywhere. Use provider tokenization or hosted fields.
- Verify webhook signatures per provider docs before processing (reject and log invalid signatures).
- Handle duplicate webhooks idempotently (use provider-supplied event IDs or transaction IDs).
- Persist every payment attempt with these fields at minimum: `attempt_id`, `shop_id`, `provider`, `provider_transaction_id`, `amount`, `currency`, `status`, `raw_payload`, `received_at`, `processed_at`, `webhook_id`.
- Emit clean application events after processing: `payment.success`, `payment.failed`, `payment.pending` with canonical payloads.
- Update subscription/billing records atomically with payment state.
- Provide an API or websocket message to the frontend to indicate final payment outcome (frontend timer uses `payment:success` event).

---

## 4. Webhook Event Table

| Event name | Description | Required payload keys | Expected backend action |
|---|---:|---|---|
| `payment.success` | Provider confirms funds captured / transaction successful | `provider_transaction_id`, `amount`, `currency`, `shop_id` or `metadata.shop_id`, `timestamp`, `webhook_id` | Validate signature, idempotent store, update subscription to `successful`, emit application event, notify client, record receipt.
| `payment.failed` | Provider reports transaction failure | `provider_transaction_id`, `failure_code`, `failure_message`, `shop_id`, `timestamp`, `webhook_id` | Validate, store, set `failed`, emit event, notify client.
| `payment.pending` | Provider marks transaction as pending (e.g., awaiting settlement) | `provider_transaction_id`, `shop_id`, `timestamp`, `webhook_id` | Store as `pending`, emit event, notify client; schedule re-check if needed.
| `payment.refunded` | Provider reports refund | `provider_transaction_id`, `refund_id`, `amount`, `currency`, `shop_id`, `timestamp`, `webhook_id` | Validate, store refund record, update payments/subscriptions, emit event.

---

## 5. Copy-Paste Webhook Examples

### Node / Express (production-ready pattern)

- Notes: replace `VERIFY_SIGNATURE` and provider-specific signature extraction per provider docs. Use raw body for signature verification.

```js
// express app (with raw-body middleware for signature verification)
const express = require('express');
const app = express();
const crypto = require('crypto');

// raw body parser for webhooks
app.use('/webhooks/provider', express.raw({ type: '*/*' }));

app.post('/webhooks/provider', async (req, res) => {
  const raw = req.body; // Buffer
  const signatureHeader = req.headers['x-provider-signature'];

  // 1) VERIFY SIGNATURE - provider-specific
  if (!verifySignature(raw, signatureHeader)) {
    console.warn('Invalid webhook signature');
    return res.status(400).send('invalid signature');
  }

  // 2) PARSE
  let payload;
  try { payload = JSON.parse(raw.toString('utf8')); } catch(e) { return res.status(400).send('invalid json'); }

  const providerEventId = payload.id || payload.webhook_id;
  const providerTx = payload.data?.transaction_id || payload.transaction_id;
  const shopId = payload.data?.metadata?.shop_id || payload.metadata?.shop_id || payload.shop_id;
  const status = mapProviderStatusToCanonical(payload.status);

  // 3) IDEMPOTENCY - guard duplicates
  const seen = await db.hasProcessedWebhook(providerEventId);
  if (seen) return res.status(200).send('ok');

  // 4) STORE attempt (transactional)
  await db.insertPaymentAttempt({
    attempt_id: generateUuid(),
    provider_event_id: providerEventId,
    provider_transaction_id: providerTx,
    shop_id: shopId,
    provider_payload: payload,
    status: status,
    received_at: new Date()
  });

  // 5) PROCESS: update subscription/payment state atomically
  if (status === 'successful') {
    await db.transaction(async (trx) => {
      await db.markPaymentSuccessful(trx, providerTx, shopId);
      await db.updateSubscriptionOnSuccess(trx, shopId);
      await pubsub.emit('payment.success', { shopId, providerTx, timestamp: Date.now() });
    });
  } else if (status === 'failed') {
    await db.markPaymentFailed(providerTx, shopId, payload);
    await pubsub.emit('payment.failed', { shopId, providerTx, reason: payload.failure_message });
  } else if (status === 'pending') {
    await db.markPaymentPending(providerTx, shopId);
    await pubsub.emit('payment.pending', { shopId, providerTx });
  }

  // 6) RESPOND
  res.status(200).send('ok');
});

function verifySignature(raw, header) {
  // Implement per provider docs. Example (HMAC):
  // const expected = crypto.createHmac('sha256', process.env.PROVIDER_SECRET).update(raw).digest('hex');
  // return timingSafeEqual(expected, header);
  return true; // replace with real logic
}

function mapProviderStatusToCanonical(providerStatus) {
  // Map provider statuses to: initiated, pending, successful, failed, refunded
  if (/success|succeeded|captured/i.test(providerStatus)) return 'successful';
  if (/pending|authorized/i.test(providerStatus)) return 'pending';
  if (/failed|declined|error/i.test(providerStatus)) return 'failed';
  if (/refunded/i.test(providerStatus)) return 'refunded';
  return 'pending';
}
```

### Pseudocode (provider-agnostic)

```
receive webhook(rawBody, headers):
  if not verify_signature(rawBody, headers):
    return 400
  payload = parse_json(rawBody)
  event_id = payload.webhook_id
  if already_processed(event_id):
    return 200
  status = map_status(payload)
  persist_attempt(event_id, payload, status)
  if status == successful:
    run_atomic_transaction:
      mark_payment_successful()
      update_subscription()
    broadcast_application_event('payment.success', shop_id, tx_id)
  elif status == pending:
    mark_pending()
    broadcast_application_event('payment.pending', shop_id, tx_id)
  else if status == failed:
    mark_failed()
    broadcast_application_event('payment.failed', shop_id, tx_id)
  respond 200
```

---

## 6. Payment State Machine

Allowed canonical states:
- `initiated` — UI started a flow (frontend emitted `payment:started`), no provider response yet.
- `pending` — Provider indicates pending (e.g., awaiting settlement, or auth-only).
- `successful` — Funds captured / payment confirmed.
- `failed` — Transaction declined or errored.
- `refunded` — Post-success refund processed.
- `expired` — UI/session/checkout expired without completion.

Transitions (valid):
- initiated -> pending
- initiated -> successful (rare for immediate capture flows)
- pending -> successful
- pending -> failed
- pending -> expired
- successful -> refunded

Forbidden transitions (invalid):
- successful -> pending
- failed -> successful (unless a new initiated payment is created and processed as a new attempt)

Important: represent transitions with DB transactions to avoid race conditions.

---

## 7. Frontend Contract (exact)

Frontend (already implemented) emits these window-level CustomEvents:
- `payment:started` — detail: `{ provider: 'card'|'gateway'|'mpesa', attemptId?: string }` — optional attempt id if frontend receives one from server.
- `payment:openCheckout` — no detail; signals host app to open real checkout if using a different handler.

Backend MUST emit or cause the client to receive one of these application-level events (via websocket/push OR by instructing the client to dispatch a CustomEvent) when final outcome is known:
- `payment:success` — detail: `{ shopId, providerTransactionId, timestamp }`
- `payment:failed` — detail: `{ shopId, providerTransactionId, reason }`
- `payment:pending` — detail: `{ shopId, providerTransactionId }`

Shared state keys (for developer use):
- `subscription_active` (boolean)
- `payment_timer_start` (timestamp) — frontend `PaymentTimer` reads `payment:success` event to begin timer; backend should include timestamp in the event detail.

Example of backend causing client-side event (via websocket server):
```js
// server pushes over websocket to client
ws.send(JSON.stringify({ type: 'payment:success', data: { shopId, providerTx, timestamp: Date.now() } }))
// client receives and re-dispatches window event for UI components
window.dispatchEvent(new CustomEvent('payment:success', { detail: { shopId, providerTransactionId: providerTx, timestamp } }));
```

---

## 8. Failure & Retry Strategy

Timeouts / pending:
- If a webhook shows `pending`, schedule a re-check (provider API) at exponential backoff intervals: 1m, 5m, 30m, 2h.
- After a configurable threshold (e.g., 24–72 hours) if still pending, mark as `failed` and notify operator.

Duplicate webhooks / idempotency:
- Use provider event id or transaction id as idempotency key.
- If duplicate handled, acknowledge 200 immediately without reprocessing.

Retries for downstream tasks:
- Use background queue with retries (3 attempts, exponential backoff) for non-idempotent tasks (e.g., updating external subscription systems).

Duplicate charge / dispute:
- If provider indicates duplicate charge, mark attempt status `failed_duplicate` and open manual review.
- Provide manual refund workflow in admin console and log for audits.

Access rules on failure:
- `failed` payments keep subscription in existing state until manual action or reattempt.
- `pending` payments may allow limited access (soft-limited features) — implement policy in backend (not in UI).
- Do not automatically downgrade immediately on a single failed attempt. Follow business policy (e.g., 3 failed attempts → suspend).

---

## 9. Security & Compliance Notes (must-follow)

- PCI: Backend must NOT collect raw card data. Use provider-hosted fields or client-side tokenization.
- Tokenization: Frontend or provider SDK must return a token/nonce. Backend should store only provider tokens and provider transaction IDs.
- Logging: NEVER log CVV/CVC/PAN in plaintext. Mask card numbers in logs (last 4 only) and never log tokens that allow de-tokenization.
- Secrets: Store provider secret keys in secure vault (env vars with restricted access).
- Webhook verification: Implement strict signature verification and reject non-verified webhooks.
- Data retention: Keep raw webhook payloads only as long as necessary for debugging (rotate/delete after retention period), but keep structured payment records permanently for reconciliation.
- Rate-limiting & alerts: Rate-limit webhook endpoints to prevent replay or brute force. Alert on repeated signature failures.

---

## Appendix: Quick Implementation Checklist (copy-paste)

- [ ] Pick providers and document provider-specific webhook spec files.
- [ ] Implement secure webhook endpoints with raw body parsing and signature verification.
- [ ] Implement idempotency: store `provider_event_id` and skip duplicates.
- [ ] Persist payment attempts with required fields.
- [ ] Map provider statuses to canonical states and implement state machine with DB transactions.
- [ ] Emit application-level events `payment.success|failed|pending` to clients (websocket or push); ensure client re-dispatches `payment:success` for UI timer.
- [ ] Implement re-check/backfill job for `pending` statuses.
- [ ] Implement reconciliation job: match provider statements to stored attempts daily.
- [ ] Add admin actions: manual mark success/failure, refunds, and dispute handling.
- [ ] Secure environment: rotate keys, secure vault for secrets, limited audit logs.

---

## Database Schema

Run the `migration.sql` file to create the required tables:

### Tables Created:
- `payment_methods`: Stores tokenized payment methods (cards, M-PESA, gateways)
- `subscriptions`: Tracks subscription status, billing cycles, and plan types
- `payment_attempts`: Audit log of all payment events and webhook processing

### Key Fields:
- All tables include `shop_id` for multi-tenancy
- RLS policies ensure users only see their shop's data
- `payment_methods` stores only masked data and provider tokens (no raw card details)
- `subscriptions` tracks billing cycles and payment method associations
- `payment_attempts` provides full audit trail for reconciliation

### Security:
- Row Level Security (RLS) enabled on all tables
- Users can only access data for shops they operate
- Raw card data is never stored (tokenization required)

---

## Contact
For any missing provider details or to add provider SDK snippets (Stripe, Adyen, M-PESA STK) add a ticket and attach provider docs.

End of document.
